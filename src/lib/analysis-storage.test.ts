import { beforeEach, describe, expect, it } from "vitest";

import {
  ANALYSIS_RESULT_STORAGE_KEY,
  clearAnalysisResult,
  loadAnalysisResult,
  saveAnalysisResult,
} from "@/lib/analysis-storage";
import type { AnalysisResult } from "@/types/analysis";

describe("analysis storage", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("returns null and clears corrupted stored data", () => {
    sessionStorage.setItem(ANALYSIS_RESULT_STORAGE_KEY, "{not valid json");

    expect(loadAnalysisResult()).toBeNull();
    expect(sessionStorage.getItem(ANALYSIS_RESULT_STORAGE_KEY)).toBeNull();
  });

  it("returns null and clears parseable but invalid stored data", () => {
    sessionStorage.setItem(
      ANALYSIS_RESULT_STORAGE_KEY,
      JSON.stringify({
        verdict: "maybe",
        confidence: "0.91",
        filename: "demo.mp3",
      }),
    );

    expect(loadAnalysisResult()).toBeNull();
    expect(sessionStorage.getItem(ANALYSIS_RESULT_STORAGE_KEY)).toBeNull();
  });

  it("round-trips the latest analysis result", () => {
    const result: AnalysisResult = {
      verdict: "ai",
      confidence: 0.91,
      filename: "demo.mp3",
      explanation:
        "The model detected patterns often associated with AI-generated music.",
      signals: ["high repetition"],
      analysisStages: ["upload received"],
      similarSongs: [],
      matchedTrack: null,
      limitations: ["This is a model prediction, not definitive proof."],
    };

    saveAnalysisResult(result);
    expect(loadAnalysisResult()).toEqual(result);

    clearAnalysisResult();
    expect(loadAnalysisResult()).toBeNull();
  });
});
