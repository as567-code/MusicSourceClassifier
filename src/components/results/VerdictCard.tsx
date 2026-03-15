import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/types/analysis";

interface VerdictCardProps {
  verdict: AnalysisResult["verdict"];
  filename: string;
  heading: string;
  explanation: string;
}

const verdictCopy = {
  ai: {
    badge: "Likely AI-generated",
    eyebrow: "Forensic verdict",
    emphasis: "Pattern density and repetition pushed this track into the synthetic lane.",
    reading: "Treat this as a strong model signal that benefits from human review.",
  },
  human: {
    badge: "Likely human-made",
    eyebrow: "Listening verdict",
    emphasis: "Performance texture and phrasing kept this track on the human side.",
    reading: "The model heard more lived-in musical variance than machine regularity.",
  },
} as const;

const VerdictCard = ({
  verdict,
  filename,
  heading,
  explanation,
}: VerdictCardProps) => {
  const copy = verdictCopy[verdict];
  const Icon = verdict === "ai" ? AlertTriangle : CheckCircle2;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[34px] border px-6 py-6 shadow-card md:px-7 md:py-7",
        verdict === "ai"
          ? "border-primary/25 bg-[linear-gradient(180deg,rgba(49,44,39,0.98),rgba(25,22,20,0.98))] text-secondary-foreground"
          : "border-border/70 bg-[linear-gradient(180deg,rgba(251,245,236,0.98),rgba(237,226,213,0.98))] text-foreground",
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          verdict === "ai"
            ? "bg-[radial-gradient(circle_at_top_left,rgba(214,122,55,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(252,222,187,0.08),transparent_30%)]"
            : "bg-[radial-gradient(circle_at_top_left,rgba(214,122,55,0.14),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(120,91,62,0.08),transparent_28%)]",
        )}
      />
      <div className="relative space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <p
              className={cn(
                "font-label text-[11px] uppercase tracking-[0.28em]",
                verdict === "ai"
                  ? "text-secondary-foreground/60"
                  : "text-muted-foreground",
              )}
            >
              {copy.eyebrow}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 font-label text-[11px] uppercase tracking-[0.22em]",
                  verdict === "ai"
                    ? "border-white/10 bg-white/8 text-secondary-foreground"
                    : "border-border/80 bg-background/75 text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {copy.badge}
              </span>
              <span
                className={cn(
                  "rounded-full border px-3 py-2 font-label text-[11px] uppercase tracking-[0.22em]",
                  verdict === "ai"
                    ? "border-white/10 bg-black/15 text-secondary-foreground/70"
                    : "border-border/80 bg-card/75 text-muted-foreground",
                )}
              >
                {filename}
              </span>
            </div>
          </div>

          <div
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full border",
              verdict === "ai"
                ? "border-white/10 bg-white/8"
                : "border-primary/20 bg-primary/10",
            )}
          >
            <Icon className="h-7 w-7" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="max-w-3xl font-display text-4xl leading-[0.95] md:text-5xl">
            {heading}
          </h1>
          <p
            className={cn(
              "max-w-3xl text-base leading-7 md:text-lg",
              verdict === "ai"
                ? "text-secondary-foreground/76"
                : "text-muted-foreground",
            )}
          >
            {explanation}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <article
            className={cn(
              "rounded-[24px] border p-4",
              verdict === "ai"
                ? "border-white/10 bg-black/20"
                : "border-border/70 bg-background/72",
            )}
          >
            <p
              className={cn(
                "font-label text-[11px] uppercase tracking-[0.24em]",
                verdict === "ai"
                  ? "text-secondary-foreground/60"
                  : "text-muted-foreground",
              )}
            >
              Why the meter leans here
            </p>
            <p className="mt-3 text-sm leading-6">{copy.emphasis}</p>
          </article>
          <article
            className={cn(
              "rounded-[24px] border p-4",
              verdict === "ai"
                ? "border-white/10 bg-white/8"
                : "border-border/70 bg-card/70",
            )}
          >
            <p
              className={cn(
                "font-label text-[11px] uppercase tracking-[0.24em]",
                verdict === "ai"
                  ? "text-secondary-foreground/60"
                  : "text-muted-foreground",
              )}
            >
              How to read it
            </p>
            <p className="mt-3 text-sm leading-6">{copy.reading}</p>
          </article>
        </div>
      </div>
    </section>
  );
};

export default VerdictCard;
