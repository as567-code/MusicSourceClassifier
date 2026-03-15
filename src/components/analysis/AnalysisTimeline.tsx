import { cn } from "@/lib/utils";

interface AnalysisTimelineProps {
  stages: readonly string[];
  activeStageIndex: number;
}

const AnalysisTimeline = ({
  stages,
  activeStageIndex,
}: AnalysisTimelineProps) => {
  return (
    <ol className="grid gap-3" aria-label="Analysis progress">
      {stages.map((stage, index) => {
        const isComplete = index < activeStageIndex;
        const isActive = index === activeStageIndex;

        return (
          <li
            key={stage}
            className={cn(
              "flex items-center gap-4 rounded-[22px] border px-4 py-3 transition-all duration-500",
              isActive
                ? "border-primary/60 bg-primary/10 text-foreground shadow-card"
                : "border-border/70 bg-background/60 text-muted-foreground",
            )}
          >
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border font-label text-xs uppercase tracking-[0.2em]",
                isActive
                  ? "border-primary/70 bg-primary text-primary-foreground"
                  : isComplete
                    ? "border-success/60 bg-success/15 text-foreground"
                    : "border-border/80 bg-background/70",
              )}
            >
              {String(index + 1).padStart(2, "0")}
            </div>
            <div className="min-w-0">
              <p className="font-label text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
                Stage
              </p>
              <p className="font-display text-2xl leading-none">{stage}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export default AnalysisTimeline;
