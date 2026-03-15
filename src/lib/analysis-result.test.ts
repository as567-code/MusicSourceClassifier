import { describe, expect, it } from "vitest";

import { parseAnalysisResult } from "@/lib/analysis-result";
import type { AnalysisResult } from "@/types/analysis";

function createAnalysisResult(
  overrides: Partial<AnalysisResult> = {},
): AnalysisResult {
  return {
    verdict: "ai",
    confidence: 0.91,
    filename: "demo.mp3",
    explanation:
      "The classifier leaned toward AI-generated audio with higher confidence.",
    signals: ["high model confidence", "elevated spectral flatness"],
    analysisStages: ["upload received", "spectrogram generated", "classifier scored"],
    similarSongs: [],
    matchedTrack: null,
    limitations: ["This is a model prediction, not definitive proof."],
    ...overrides,
  };
}

describe("parseAnalysisResult", () => {
  it("rejects out-of-range confidence values", () => {
    expect(
      parseAnalysisResult(createAnalysisResult({ confidence: 91 })),
    ).toBeNull();
    expect(
      parseAnalysisResult(createAnalysisResult({ confidence: -0.1 })),
    ).toBeNull();
  });
});
