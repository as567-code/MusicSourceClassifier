import VinylRecord from "@/components/VinylRecord";
import { cn } from "@/lib/utils";

interface AnalysisVisualizerProps {
  fileName: string;
  currentStage: string;
  activeStageIndex: number;
}

const barHeights = [
  "h-10",
  "h-20",
  "h-14",
  "h-24",
  "h-16",
  "h-28",
  "h-12",
  "h-20",
  "h-8",
];

const AnalysisVisualizer = ({
  fileName,
  currentStage,
  activeStageIndex,
}: AnalysisVisualizerProps) => {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-secondary px-6 py-8 text-secondary-foreground shadow-vinyl md:px-8 md:py-9">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(214,122,55,0.32),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(241,207,148,0.14),_transparent_32%)]" />
      <div className="absolute right-[-2rem] top-[-2rem] hidden md:block">
        <VinylRecord size="lg" isPlaying className="opacity-15" />
      </div>

      <div className="relative space-y-8">
        <div className="space-y-4">
          <p className="font-label text-xs uppercase tracking-[0.34em] text-secondary-foreground/60">
            Listening chamber live
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <h1 className="max-w-xl font-display text-4xl leading-[0.96] md:text-5xl">
                The lab is listening for texture, timing, and spectral fingerprints.
              </h1>
              <p className="max-w-lg text-sm leading-6 text-secondary-foreground/72 md:text-base">
                A focused staging screen keeps the analysis legible while the
                classifier and similarity pass do their work.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-right backdrop-blur">
              <p className="font-label text-[11px] uppercase tracking-[0.28em] text-secondary-foreground/55">
                Source
              </p>
              <p className="max-w-[14rem] truncate font-display text-xl">
                {fileName}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-label text-[11px] uppercase tracking-[0.28em] text-secondary-foreground/55">
                  Active stage
                </p>
                <p className="mt-2 font-display text-3xl leading-none">
                  {currentStage}
                </p>
              </div>
              <div className="font-label rounded-full border border-primary/40 bg-primary/10 px-3 py-2 text-xs uppercase tracking-[0.24em] text-primary-foreground/90">
                step {String(activeStageIndex + 1).padStart(2, "0")}
              </div>
            </div>

            <div className="mt-8 flex h-40 items-end gap-2 rounded-[24px] border border-white/10 bg-black/20 px-4 py-5">
              {barHeights.map((heightClass, index) => (
                <div
                  key={`${heightClass}-${index}`}
                  className={cn(
                    "flex-1 rounded-full bg-gradient-to-t from-primary/35 via-accent/60 to-white/90 transition-all duration-700 animate-wave",
                    heightClass,
                    index % 2 === 0 && "opacity-80",
                  )}
                  style={{ animationDelay: `${index * 120}ms` }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <p className="font-label text-[11px] uppercase tracking-[0.28em] text-secondary-foreground/55">
              Editorial notes
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-[22px] border border-white/10 bg-black/15 p-4">
                <p className="font-display text-2xl text-secondary-foreground">
                  Warm paper outside, dark control room inside.
                </p>
                <p className="mt-2 text-sm leading-6 text-secondary-foreground/70">
                  The staging view stays deliberate instead of noisy so the user can
                  track where the analysis is headed.
                </p>
              </div>
              <div className="rounded-[22px] border border-dashed border-white/12 p-4">
                <p className="font-label text-[11px] uppercase tracking-[0.28em] text-secondary-foreground/55">
                  Signal motifs
                </p>
                <p className="mt-2 text-sm leading-6 text-secondary-foreground/70">
                  Waveform motion, vinyl shadows, and measured type keep the analog
                  lab aesthetic consistent with the homepage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnalysisVisualizer;
