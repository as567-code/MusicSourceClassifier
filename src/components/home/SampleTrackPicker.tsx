import { ArrowUpRight, Play, Sparkles } from "lucide-react";

import type { SampleTrack } from "@/data/sampleTracks";
import { sampleTracks } from "@/data/sampleTracks";
import VinylRecord from "@/components/VinylRecord";
import { cn } from "@/lib/utils";

interface SampleTrackPickerProps {
  onSelect?: (track: SampleTrack) => void;
  activeTrackId?: string | null;
  isLoading?: boolean;
  className?: string;
}

const SampleTrackPicker = ({
  onSelect,
  activeTrackId,
  isLoading = false,
  className,
}: SampleTrackPickerProps) => {
  return (
    <aside
      className={cn(
        "rounded-[28px] border border-white/10 bg-background/70 p-5 text-foreground shadow-card backdrop-blur",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="font-label text-xs uppercase tracking-[0.28em] text-muted-foreground">
            Demo Crate
          </p>
          <h2 className="font-display text-2xl text-foreground">
            Try a sample track
          </h2>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            Load a safe demo clip to preview the current classifier flow without
            hunting for your own audio first.
          </p>
        </div>

        <VinylRecord size="sm" className="hidden opacity-80 sm:block" />
      </div>

      <div className="space-y-3">
        {sampleTracks.map((track) => {
          const isActive = track.id === activeTrackId;

          return (
            <article
              key={track.id}
              className={cn(
                "rounded-[24px] border border-border/70 bg-card/80 p-4 transition-colors",
                isActive && "border-primary/70 bg-card",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl leading-none">
                        {track.label}
                      </h3>
                      <span className="font-label rounded-full border border-border/70 px-2 py-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                        {track.formatLabel}
                      </span>
                      <span className="font-label rounded-full border border-border/70 px-2 py-1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                        {track.durationLabel}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {track.description}
                    </p>
                  </div>

                  <div className="font-label flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                    <span>{track.provenance}</span>
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Portfolio-safe
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelect?.(track)}
                  disabled={isLoading}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-foreground transition hover:border-primary/50 hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Play className="h-4 w-4" />
                  {isActive ? "Loading..." : "Run demo"}
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                <span>Use the same upload pipeline as a file drop.</span>
                <a
                  href={track.assetPath}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition hover:text-foreground"
                >
                  Open clip
                  <ArrowUpRight className="h-3 w-3" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </aside>
  );
};

export default SampleTrackPicker;
