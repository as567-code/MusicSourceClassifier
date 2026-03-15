import type { AnalysisResult } from "@/types/analysis";
import { parseAnalysisResult } from "@/lib/analysis-result";

export const ANALYSIS_RESULT_STORAGE_KEY = "music-source-classifier.latest-analysis";

export function saveAnalysisResult(result: AnalysisResult): void {
  sessionStorage.setItem(ANALYSIS_RESULT_STORAGE_KEY, JSON.stringify(result));
}

export function loadAnalysisResult(): AnalysisResult | null {
  const raw = sessionStorage.getItem(ANALYSIS_RESULT_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = parseAnalysisResult(JSON.parse(raw));

    if (!parsed) {
      sessionStorage.removeItem(ANALYSIS_RESULT_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(ANALYSIS_RESULT_STORAGE_KEY);
    return null;
  }
}

export function clearAnalysisResult(): void {
  sessionStorage.removeItem(ANALYSIS_RESULT_STORAGE_KEY);
}
