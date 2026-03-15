import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AnalysisErrorStateProps {
  title: string;
  description: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  errorDetail?: string;
}

const AnalysisErrorState = ({
  title,
  description,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  errorDetail,
}: AnalysisErrorStateProps) => {
  return (
    <div className="min-h-screen px-4 py-6 md:px-6 md:py-8">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl items-center">
        <section className="relative w-full overflow-hidden rounded-[40px] border border-border/70 bg-card/85 px-6 py-10 shadow-card backdrop-blur md:px-10 md:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(214,122,55,0.15),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(45,43,39,0.08),_transparent_24%)]" />

          <div className="relative space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-border/80 bg-background/70 px-4 py-2">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <span className="font-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Recovery state
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="max-w-2xl font-display text-4xl leading-[0.96] text-foreground md:text-5xl">
                {title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                {description}
              </p>
              {errorDetail ? (
                <p className="font-label text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Detail: {errorDetail}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                className="gap-2 rounded-full px-5"
                onClick={onPrimaryAction}
              >
                <ArrowLeft className="h-4 w-4" />
                {primaryActionLabel}
              </Button>
              {secondaryActionLabel && onSecondaryAction ? (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full border-border/80 bg-background/60 px-5"
                  onClick={onSecondaryAction}
                >
                  <RefreshCcw className="h-4 w-4" />
                  {secondaryActionLabel}
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AnalysisErrorState;
