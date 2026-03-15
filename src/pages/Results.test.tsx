import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";

import { ANALYSIS_RESULT_STORAGE_KEY } from "@/lib/analysis-storage";
import Results from "@/pages/Results";
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

function LocationProbe() {
  const location = useLocation();

  return <p data-testid="pathname">{location.pathname}</p>;
}

describe("Results", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("shows similar tracks for AI results and hides them for human results", () => {
    const aiResult = createAnalysisResult({
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
    });
    const humanResult = createAnalysisResult({
      verdict: "human",
      filename: "field-recording.wav",
      explanation: "The classifier found more human-made musical cues than synthetic ones.",
      matchedTrack: {
        id: 2,
        title: "Matched Reference",
        artist: "Human Artist",
        album: "Verified Catalog",
        similarity: 96.2,
        genre: "Soul",
      },
    });

    const { unmount } = render(
      <MemoryRouter
        initialEntries={[{ pathname: "/results/ai", state: { result: aiResult } }]}
      >
        <Routes>
          <Route path="/results/:type" element={<Results />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole("heading", { name: /similar human-made tracks/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /real track/i }),
    ).toBeInTheDocument();

    unmount();

    render(
      <MemoryRouter
        initialEntries={[
          { pathname: "/results/human", state: { result: humanResult } },
        ]}
      >
        <Routes>
          <Route path="/results/:type" element={<Results />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("heading", { name: /similar human-made tracks/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /matched human reference/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /matched reference/i }),
    ).toBeInTheDocument();
  });

  it("restores the latest analysis result from session storage on refresh", () => {
    const result = createAnalysisResult({
      verdict: "human",
      filename: "field-recording.wav",
    });

    sessionStorage.setItem(ANALYSIS_RESULT_STORAGE_KEY, JSON.stringify(result));

    render(
      <MemoryRouter initialEntries={["/results/human"]}>
        <Routes>
          <Route path="/results/:type" element={<Results />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /human analysis ready/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/field-recording.wav/i, { selector: "span" }),
    ).toBeInTheDocument();
  });

  it("ignores malformed route-state data and falls back to a valid stored result", () => {
    const storedResult = createAnalysisResult({
      verdict: "human",
      filename: "stored-session.wav",
    });

    sessionStorage.setItem(
      ANALYSIS_RESULT_STORAGE_KEY,
      JSON.stringify(storedResult),
    );

    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: "/results/human",
            state: {
              result: {
                verdict: "maybe",
                confidence: "0.91",
                filename: "bad-route-state.wav",
                explanation: "bad route state should be ignored",
                signals: [],
                analysisStages: [],
                similarSongs: [],
                matchedTrack: null,
                limitations: [],
              },
            },
          },
        ]}
      >
        <Routes>
          <Route path="/results/:type" element={<Results />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /human analysis ready/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/stored-session.wav/i, { selector: "span" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/bad-route-state.wav/i)).not.toBeInTheDocument();
  });

  it("reconciles the results route param with the validated verdict", async () => {
    const result = createAnalysisResult({
      verdict: "human",
      filename: "session-take.wav",
    });

    render(
      <MemoryRouter initialEntries={[{ pathname: "/results/ai", state: { result } }]}>
        <Routes>
          <Route
            path="/results/:type"
            element={
              <>
                <Results />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /human analysis ready/i }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("pathname")).toHaveTextContent("/results/human");
    });
  });
});
