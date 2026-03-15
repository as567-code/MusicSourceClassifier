import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearPendingAnalysisFile,
  peekPendingAnalysisFile,
} from "@/lib/pending-analysis-file";
import Index from "@/pages/Index";

const AnalyzeRouteProbe = () => {
  const location = useLocation();
  const file = peekPendingAnalysisFile();
  const hasRouteState = location.state !== null;

  return (
    <div>
      Analyze route: {file?.name ?? "missing file"} / state:{" "}
      {hasRouteState ? "present" : "missing"}
    </div>
  );
};

beforeEach(() => {
  clearPendingAnalysisFile();
});

afterEach(() => {
  clearPendingAnalysisFile();
  vi.restoreAllMocks();
});

describe("Index", () => {
  it("renders the sample track picker and trust copy", () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    );

    expect(screen.getByText(/try a sample track/i)).toBeInTheDocument();
    expect(
      screen.getByText(/model-based analysis, not definitive proof/i),
    ).toBeInTheDocument();
  });

  it("routes a sample track into /analyze with the selected file", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        if (input === "/demo/human-demo.wav") {
          return new Response("demo", {
            status: 200,
            headers: { "Content-Type": "audio/wav" },
          });
        }

        throw new Error(`Unexpected fetch: ${String(input)}`);
      });

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/analyze" element={<AnalyzeRouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getAllByRole("button", { name: /run demo/i })[0]);

    await waitFor(() =>
      expect(
        screen.getByText(/analyze route: human-demo.wav \/ state: missing/i),
      ).toBeInTheDocument(),
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith("/demo/human-demo.wav");
  });

  it("routes an uploaded track into /analyze without calling the backend", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const file = new File(["demo"], "upload.mp3", { type: "audio/mpeg" });

    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/analyze" element={<AnalyzeRouteProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    const fileInput = container.querySelector('input[type="file"]');

    expect(fileInput).not.toBeNull();

    fireEvent.change(fileInput as HTMLInputElement, {
      target: { files: [file] },
    });

    await waitFor(() =>
      expect(
        screen.getByText(/analyze route: upload.mp3 \/ state: missing/i),
      ).toBeInTheDocument(),
    );

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
