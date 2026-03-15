import { useEffect } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import AnalysisErrorState from "@/components/analysis/AnalysisErrorState";
import SongCard from "@/components/SongCard";
import ConfidenceMeter from "@/components/results/ConfidenceMeter";
import ModelNotesCard from "@/components/results/ModelNotesCard";
import ShareSummaryCard from "@/components/results/ShareSummaryCard";
import SignalChips from "@/components/results/SignalChips";
import SimilarityResultsList from "@/components/results/SimilarityResultsList";
import VerdictCard from "@/components/results/VerdictCard";
import { Button } from "@/components/ui/button";
import { parseAnalysisResult, resolveHumanReferenceTrack } from "@/lib/analysis-result";
import { loadAnalysisResult } from "@/lib/analysis-storage";
import type { AnalysisResult } from "@/types/analysis";

interface ResultsRouteState {
  result?: AnalysisResult;
}

function getRouteResult(state: unknown): AnalysisResult | null {
  if (!state || typeof state !== "object") {
    return null;
  }

  return parseAnalysisResult((state as ResultsRouteState).result);
}

function formatVerdictHeading(verdict: AnalysisResult["verdict"]): string {
  return verdict === "ai" ? "AI analysis ready" : "Human analysis ready";
}

function formatVerdictLabel(verdict: AnalysisResult["verdict"]): string {
  return verdict === "ai" ? "AI track readout" : "Human track readout";
}

function HumanReferenceSummary({ result }: { result: AnalysisResult }) {
  const reference = resolveHumanReferenceTrack(result);

  return (
    <section className="rounded-[32px] border border-border/70 bg-card/86 p-6 shadow-card">
      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-[28px] border border-border/70 bg-background/80 p-5">
          <p className="font-label text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Catalog handling
          </p>
          <h2 className="mt-3 font-display text-3xl text-foreground">
            Matched human reference
          </h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Human verdicts still get a grounded readout, with a named match when the
            backend provides one and a clear summary when it does not.
          </p>

          <div className="mt-6 grid gap-3">
            <article className="rounded-[22px] border border-border/70 bg-card/70 p-4">
              <p className="font-label text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Result posture
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground">
                {reference
                  ? "Aligned with a known human-made reference profile."
                  : "No named catalog match was returned, but the classifier still favored human-made cues."}
              </p>
            </article>

            <article className="rounded-[22px] border border-border/70 bg-background/75 p-4">
              <p className="font-label text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Session takeaway
              </p>
              <p className="mt-3 text-sm leading-6 text-foreground">
                {reference
                  ? `${reference.title} anchors the human-side explanation for this upload.`
                  : "Use the verdict, confidence meter, and signals stack as the primary explanation for this session."}
              </p>
            </article>
          </div>
        </div>

        {reference ? (
          <SongCard song={reference} detailed />
        ) : (
          <div className="rounded-[28px] border border-dashed border-border/70 bg-background/70 p-6 text-sm leading-6 text-muted-foreground">
            No matched-track metadata was returned for this human result. The verdict,
            confidence treatment, and model notes remain available so the outcome still
            reads as complete.
          </div>
        )}
      </div>
    </section>
  );
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { type } = useParams();
  const routeResult = getRouteResult(location.state);
  const result = routeResult ?? loadAnalysisResult();

  useEffect(() => {
    if (!result) {
      return;
    }

    if (type !== "ai" && type !== "human") {
      return;
    }

    if (type !== result.verdict) {
      navigate(`/results/${result.verdict}`, {
        replace: true,
        state: location.state,
      });
    }
  }, [location.state, navigate, result, type]);

  if (!result) {
    return (
      <AnalysisErrorState
        title="Analysis result unavailable"
        description="There is no completed analysis saved for this session yet. Return to the homepage, upload a track, and let the listening chamber finish before reopening the results route."
        primaryActionLabel="Back to upload"
        onPrimaryAction={() => navigate("/")}
      />
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <main className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[40px] border border-border/70 bg-card/78 px-6 py-8 shadow-card backdrop-blur md:px-8 md:py-9">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(214,122,55,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(45,43,39,0.09),_transparent_28%)]" />
          <div className="relative space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => navigate("/")}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to upload
                </Button>
                <span className="rounded-full border border-border/80 bg-background/72 px-3 py-2 font-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
                  {formatVerdictLabel(result.verdict)}
                </span>
              </div>

              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/72 px-4 py-2 font-label text-xs uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Run another track
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <VerdictCard
                verdict={result.verdict}
                filename={result.filename}
                heading={formatVerdictHeading(result.verdict)}
                explanation={result.explanation}
              />

              <div className="space-y-6">
                <ConfidenceMeter
                  verdict={result.verdict}
                  confidence={result.confidence}
                />
                <article className="rounded-[30px] border border-border/70 bg-background/78 p-6 shadow-card">
                  <p className="font-label text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                    Session restore
                  </p>
                  <h2 className="mt-3 font-display text-3xl text-foreground">
                    Refresh-safe results
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    Route state is still validated first, and the latest completed
                    analysis restores from session storage if the page reloads.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <SignalChips signals={result.signals} />
          <ShareSummaryCard result={result} />
        </div>

        <ModelNotesCard
          analysisStages={result.analysisStages}
          limitations={result.limitations}
        />

        {result.verdict === "ai" ? (
          <SimilarityResultsList songs={result.similarSongs} />
        ) : (
          <HumanReferenceSummary result={result} />
        )}
      </main>
    </div>
  );
};

export default Results;
