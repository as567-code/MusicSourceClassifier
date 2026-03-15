import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ShareSummaryCard from "@/components/results/ShareSummaryCard";
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
    similarSongs: [
      {
        id: 1,
        title: "Real Track",
        artist: "Artist",
        album: "GTZAN Reference",
        similarity: 82.4,
        genre: "Rock",
      },
    ],
    matchedTrack: null,
    limitations: ["This is a model prediction, not definitive proof."],
    ...overrides,
  };
}

describe("ShareSummaryCard", () => {
  const writeText = vi.fn();

  it("copies a concise result summary with the verdict explanation", async () => {
    const user = userEvent.setup();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);

    render(
      <ShareSummaryCard result={createAnalysisResult()} copyText={writeText} />,
    );

    await user.click(screen.getByRole("button", { name: /copy summary/i }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("MusicSourceClassifier"));
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(
        "The classifier leaned toward AI-generated audio with higher confidence.",
      ),
    );
    expect(screen.getByRole("status")).toHaveTextContent(/summary copied/i);
  });

  it("uses the human fallback reference when matchedTrack is missing", async () => {
    const user = userEvent.setup();
    writeText.mockReset();
    writeText.mockResolvedValue(undefined);

    render(
      <ShareSummaryCard
        result={createAnalysisResult({
          verdict: "human",
          explanation:
            "The classifier found more human-made musical cues than synthetic ones.",
          similarSongs: [
            {
              id: 7,
              title: "Fallback Reference",
              artist: "Human Artist",
              album: "Verified Catalog",
              similarity: 93.7,
              genre: "Soul",
            },
          ],
          matchedTrack: null,
        })}
        copyText={writeText}
      />,
    );

    await user.click(screen.getByRole("button", { name: /copy summary/i }));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(
        "Matched human reference: Fallback Reference by Human Artist (93.7% alignment)",
      ),
    );
  });
});
