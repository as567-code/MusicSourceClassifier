import { useMemo, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resolveHumanReferenceTrack } from "@/lib/analysis-result";
import type { AnalysisResult } from "@/types/analysis";

interface ShareSummaryCardProps {
  result: AnalysisResult;
  copyText?: (value: string) => Promise<void>;
}

function buildShareSummary(result: AnalysisResult): string {
  const verdictLine =
    result.verdict === "ai" ? "Likely AI-generated" : "Likely human-made";
  const summaryLines = [
    `MusicSourceClassifier result for ${result.filename}`,
    `Verdict: ${verdictLine}`,
    `Confidence: ${Math.round(result.confidence * 100)}%`,
    `Summary: ${result.explanation}`,
    `Signals: ${result.signals.join(", ")}`,
  ];

  if (result.verdict === "ai") {
    const leadReference = result.similarSongs[0];
    summaryLines.push(
      leadReference
        ? `Nearest human-made reference: ${leadReference.title} by ${leadReference.artist} (${leadReference.similarity.toFixed(1)}% match)`
        : "Nearest human-made reference: no catalog match returned",
    );
  } else {
    const humanReference = resolveHumanReferenceTrack(result);

    summaryLines.push(
      humanReference
        ? `Matched human reference: ${humanReference.title} by ${humanReference.artist} (${humanReference.similarity.toFixed(1)}% alignment)`
        : "Matched human reference: no named catalog match returned",
    );
  }

  if (result.limitations[0]) {
    summaryLines.push(`Model note: ${result.limitations[0]}`);
  }

  return summaryLines.join("\n");
}

const ShareSummaryCard = ({ result, copyText }: ShareSummaryCardProps) => {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const summary = useMemo(() => buildShareSummary(result), [result]);

  const handleCopy = async () => {
    try {
      const writeSummary =
        copyText ?? ((value: string) => navigator.clipboard.writeText(value));

      await writeSummary(summary);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
    }
  };

  return (
    <section className="rounded-[30px] border border-border/70 bg-background/80 p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-label text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Share summary
          </p>
          <h2 className="mt-3 font-display text-3xl text-foreground">
            Demo-ready handoff
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-card/75">
          <Share2 className="h-5 w-5 text-primary" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        Copy a concise result summary for notes, email, or a quick walkthrough.
      </p>

      <pre className="mt-6 overflow-x-auto rounded-[24px] border border-border/70 bg-card/78 p-5 font-body text-sm leading-6 text-foreground whitespace-pre-wrap">
        {summary}
      </pre>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={handleCopy} className="gap-2">
          {copyState === "copied" ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          Copy summary
        </Button>
        <p className="text-sm text-muted-foreground" role="status">
          {copyState === "copied"
            ? "Summary copied to clipboard."
            : copyState === "error"
              ? "Clipboard copy is unavailable in this browser."
              : "Includes verdict, confidence, signals, and the lead reference."}
        </p>
      </div>
    </section>
  );
};

export default ShareSummaryCard;
