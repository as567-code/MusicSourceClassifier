import { afterEach, describe, expect, it, vi } from "vitest";

import { analyzeTrack, ApiError } from "@/lib/api";
import type { AnalysisResult } from "@/types/analysis";

function createAnalysisResult(): AnalysisResult {
  return {
    verdict: "ai",
    confidence: 0.91,
    filename: "demo.mp3",
    explanation: "The model detected patterns often associated with AI-generated music.",
    signals: ["high repetition"],
    analysisStages: ["upload received"],
    similarSongs: [],
    matchedTrack: null,
    limitations: ["This is a model prediction, not definitive proof."],
  };
}

function createAudioFile(): File {
  return new File(["demo"], "demo.mp3", { type: "audio/mpeg" });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("analyzeTrack", () => {
  it("posts to the Flask backend by default", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(createAnalysisResult()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    await analyzeTrack(createAudioFile());

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8000/api/analyze",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
  });

  it("uses VITE_API_BASE_URL when configured", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:8123");

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(createAnalysisResult()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    await analyzeTrack(createAudioFile());

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:8123/api/analyze",
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
  });

  it("preserves typed ApiError details from backend failures", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "No file provided", stage: "upload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const promise = analyzeTrack(createAudioFile());

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      name: "ApiError",
      message: "No file provided",
      stage: "upload",
      status: 400,
    });
  });

  it("rejects malformed 200 responses with an ApiError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ verdict: "ai" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const promise = analyzeTrack(createAudioFile());

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({
      name: "ApiError",
      message: "Analysis service returned an invalid response.",
      status: 200,
    });
  });
});
