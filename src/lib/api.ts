import type { AnalysisResult } from "@/types/analysis";
import { parseAnalysisResult } from "@/lib/analysis-result";

export const ANALYSIS_PROGRESS_STAGES = [
  "upload received",
  "audio normalized",
  "spectrogram generated",
  "classifier scored",
  "similarity search",
] as const;

export interface ApiErrorShape {
  message: string;
  stage?: string;
  status?: number;
}

export class ApiError extends Error {
  stage?: string;
  status?: number;

  constructor({ message, stage, status }: ApiErrorShape) {
    super(message);
    this.name = "ApiError";
    this.stage = stage;
    this.status = status;
  }
}

interface ApiErrorPayload {
  message?: string;
  stage?: string;
}

function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

  return baseUrl.replace(/\/+$/, "");
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function analyzeTrack(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}/api/analyze`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new ApiError({
      message: "Unable to reach the analysis service.",
    });
  }

  const payload = (await readJson(response)) as AnalysisResult | ApiErrorPayload | null;

  if (!response.ok) {
    throw new ApiError({
      message: payload && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : "Analysis request failed.",
      stage:
        payload && "stage" in payload && typeof payload.stage === "string"
          ? payload.stage
          : undefined,
      status: response.status,
    });
  }

  if (!payload) {
    throw new ApiError({
      message: "Analysis service returned an empty response.",
      status: response.status,
    });
  }

  const result = parseAnalysisResult(payload);

  if (!result) {
    throw new ApiError({
      message: "Analysis service returned an invalid response.",
      status: response.status,
    });
  }

  return result;
}
