import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearPendingAnalysisFile,
  setPendingAnalysisFile,
} from "@/lib/pending-analysis-file";
import type { AnalysisResult } from "@/types/analysis";

const analyzeTrackMock = vi.fn();

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");

  return {
    ...actual,
    analyzeTrack: (...args: unknown[]) => analyzeTrackMock(...args),
    ApiError: class ApiError extends Error {
      stage?: string;
      status?: number;
    },
  };
});

import Analyze from "@/pages/Analyze";

function createAnalysisResult(): AnalysisResult {
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
  };
}

describe("Analyze", () => {
  beforeEach(() => {
    analyzeTrackMock.mockReset();
    sessionStorage.clear();
    clearPendingAnalysisFile();
  });

  it("shows staged analysis progress while the request is pending", () => {
    analyzeTrackMock.mockReturnValue(new Promise(() => {}));

    const file = new File(["demo"], "demo.mp3", { type: "audio/mpeg" });

    render(
      <MemoryRouter initialEntries={[{ pathname: "/analyze", state: { file } }]}>
        <Routes>
          <Route path="/analyze" element={<Analyze />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/upload received/i).length).toBeGreaterThan(0);
  });

  it("shows an analysis session expired recovery state when no file is available", () => {
    render(
      <MemoryRouter initialEntries={["/analyze"]}>
        <Routes>
          <Route path="/analyze" element={<Analyze />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/analysis session expired/i)).toBeInTheDocument();
  });

  it("starts analysis from the pending-file store without route state", async () => {
    const file = new File(["demo"], "stored-demo.mp3", { type: "audio/mpeg" });

    analyzeTrackMock.mockReturnValue(new Promise(() => {}));
    setPendingAnalysisFile(file);

    render(
      <MemoryRouter initialEntries={["/analyze"]}>
        <Routes>
          <Route path="/analyze" element={<Analyze />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(analyzeTrackMock).toHaveBeenCalledWith(file);
    });

    expect(screen.getByText(/stored-demo.mp3/i)).toBeInTheDocument();
  });

  it("saves the analysis result and routes into the results flow on success", async () => {
    const result = createAnalysisResult();
    const file = new File(["demo"], "demo.mp3", { type: "audio/mpeg" });

    analyzeTrackMock.mockResolvedValue(result);

    render(
      <MemoryRouter initialEntries={[{ pathname: "/analyze", state: { file } }]}>
        <Routes>
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/results/:type" element={<div>Results route ready</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/results route ready/i)).toBeInTheDocument();
    });

    expect(analyzeTrackMock).toHaveBeenCalledWith(file);
    expect(
      JSON.parse(sessionStorage.getItem("music-source-classifier.latest-analysis") ?? "null"),
    ).toEqual(result);
  });

  it("shows retry controls when the analysis request fails", async () => {
    const file = new File(["demo"], "demo.mp3", { type: "audio/mpeg" });

    analyzeTrackMock
      .mockRejectedValueOnce(new Error("analysis unavailable"))
      .mockReturnValueOnce(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={[{ pathname: "/analyze", state: { file } }]}>
        <Routes>
          <Route path="/analyze" element={<Analyze />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/analysis failed/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry analysis/i }));

    await waitFor(() => {
      expect(analyzeTrackMock).toHaveBeenCalledTimes(2);
    });

    expect(screen.getAllByText(/upload received/i).length).toBeGreaterThan(0);
  });
});
