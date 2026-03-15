import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/types/analysis";

interface ConfidenceMeterProps {
  verdict: AnalysisResult["verdict"];
  confidence: number;
}

function toPercentage(confidence: number): number {
  return Math.round(Math.min(Math.max(confidence, 0), 1) * 100);
}

function getConfidenceLabel(percentage: number): string {
  if (percentage >= 85) {
    return "High confidence";
  }

  if (percentage >= 65) {
    return "Moderate confidence";
  }

  return "Tentative confidence";
}

const ConfidenceMeter = ({ verdict, confidence }: ConfidenceMeterProps) => {
  const percentage = toPercentage(confidence);

  return (
    <section className="rounded-[30px] border border-border/70 bg-background/78 p-6 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-label text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Confidence treatment
          </p>
          <h2 className="mt-3 font-display text-3xl text-foreground">
            {percentage}%
          </h2>
        </div>
        <span
          className={cn(
            "rounded-full border px-3 py-2 font-label text-[11px] uppercase tracking-[0.22em]",
            verdict === "ai"
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-success/20 bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
          )}
        >
          {getConfidenceLabel(percentage)}
        </span>
      </div>

      <div className="mt-6 space-y-3">
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700 ease-out",
              verdict === "ai"
                ? "bg-gradient-warm"
                : "bg-[linear-gradient(90deg,hsl(var(--success))_0%,hsl(var(--accent))_100%)]",
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between font-label text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>Tentative</span>
          <span>Balanced</span>
          <span>Strong</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {verdict === "ai"
          ? "Higher values mean the classifier saw more machine-like regularity and synthetic texture cues."
          : "Higher values mean the classifier found stronger evidence of human performance, timing variance, and organic phrasing."}
      </p>
    </section>
  );
};

export default ConfidenceMeter;
