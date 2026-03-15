import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AnalysisErrorState from "@/components/analysis/AnalysisErrorState";
import AnalysisTimeline from "@/components/analysis/AnalysisTimeline";
import AnalysisVisualizer from "@/components/analysis/AnalysisVisualizer";
import { ANALYSIS_PROGRESS_STAGES, analyzeTrack } from "@/lib/api";
import { clearAnalysisResult, saveAnalysisResult } from "@/lib/analysis-storage";
import {
  clearPendingAnalysisFile,
  takePendingAnalysisFile,
} from "@/lib/pending-analysis-file";

interface AnalyzeRouteState {
  file?: File;
}

function getRouteFile(state: unknown): File | null {
  if (!state || typeof state !== "object") {
    return null;
  }

  const maybeFile = (state as AnalyzeRouteState).file;
  return maybeFile instanceof File ? maybeFile : null;
}

const Analyze = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [file] = useState<File | null>(
    () => getRouteFile(location.state) ?? takePendingAnalysisFile(),
  );
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      return;
    }

    let isCancelled = false;
    setActiveStageIndex(0);
    setErrorMessage(null);
    clearAnalysisResult();
    clearPendingAnalysisFile();

    const stageTimer = window.setInterval(() => {
      setActiveStageIndex((currentIndex) =>
        Math.min(currentIndex + 1, ANALYSIS_PROGRESS_STAGES.length - 1),
      );
    }, 850);

    void analyzeTrack(file)
      .then((result) => {
        if (isCancelled) {
          return;
        }

        saveAnalysisResult(result);
        navigate(`/results/${result.verdict}`, {
          state: { result },
        });
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We could not finish the analysis request.",
        );
      })
      .finally(() => {
        window.clearInterval(stageTimer);
      });

    return () => {
      isCancelled = true;
      window.clearInterval(stageTimer);
    };
  }, [attempt, file, navigate]);

  if (!file) {
    return (
      <AnalysisErrorState
        title="Analysis session expired"
        description="The listening chamber only keeps a pending upload in memory until analysis begins, so refreshing this screen or opening it directly clears the staged file. Head back to the homepage and drop a track into the desk again."
        primaryActionLabel="Back to upload"
        onPrimaryAction={() => navigate("/")}
      />
    );
  }

  if (errorMessage) {
    return (
      <AnalysisErrorState
        title="Analysis failed"
        description="The chamber lost the thread before the unified analysis request completed. Retry the same track, or head back to the homepage and choose another upload or sample."
        primaryActionLabel="Back to upload"
        onPrimaryAction={() => navigate("/")}
        secondaryActionLabel="Retry analysis"
        onSecondaryAction={() => setAttempt((currentAttempt) => currentAttempt + 1)}
        errorDetail={errorMessage}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <AnalysisVisualizer
          fileName={file.name}
          currentStage={ANALYSIS_PROGRESS_STAGES[activeStageIndex]}
          activeStageIndex={activeStageIndex}
        />
        <section className="rounded-[36px] border border-border/70 bg-card/82 p-6 shadow-card backdrop-blur md:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-label text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Analysis deck
              </p>
              <h2 className="mt-2 font-display text-4xl leading-none text-foreground">
                Staged listening pass
              </h2>
            </div>
            <div className="rounded-full border border-border/80 bg-background/75 px-4 py-2 text-right">
              <p className="font-label text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Status
              </p>
              <p className="font-display text-2xl text-foreground">In progress</p>
            </div>
          </div>

          <p className="mb-6 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
            The analysis route holds the user in a dedicated chamber while the
            backend completes the unified `/api/analyze` request.
          </p>

          <AnalysisTimeline
            stages={ANALYSIS_PROGRESS_STAGES}
            activeStageIndex={activeStageIndex}
          />
        </section>
      </main>
    </div>
  );
};

export default Analyze;
