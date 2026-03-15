import { AudioLines } from "lucide-react";

interface SignalChipsProps {
  signals: string[];
}

const SignalChips = ({ signals }: SignalChipsProps) => {
  return (
    <section className="rounded-[30px] border border-border/70 bg-card/84 p-6 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-label text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Signals weighed
          </p>
          <h2 className="mt-3 font-display text-3xl text-foreground">
            Listening cues
          </h2>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/70 bg-background/75">
          <AudioLines className="h-5 w-5 text-primary" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {signals.map((signal) => (
          <span
            key={signal}
            className="rounded-full border border-border/70 bg-background/78 px-4 py-2 text-sm text-foreground"
          >
            {signal}
          </span>
        ))}
      </div>
    </section>
  );
};

export default SignalChips;
