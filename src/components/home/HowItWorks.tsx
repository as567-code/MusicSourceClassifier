import { ArrowRight, AudioLines, Fingerprint, LibraryBig } from "lucide-react";

const steps = [
  {
    title: "Upload or pull a demo",
    description:
      "Start with your own file or use a portfolio-safe clip from the crate to trigger the current pipeline.",
    icon: AudioLines,
  },
  {
    title: "Read the audio texture",
    description:
      "The model inspects timing, timbre, and repetition cues that often separate synthetic polish from live nuance.",
    icon: Fingerprint,
  },
  {
    title: "Return a cautious verdict",
    description:
      "Results route to the legacy AI or human screens today, with richer staged analysis arriving in Task 5.",
    icon: LibraryBig,
  },
];

const HowItWorks = () => {
  return (
    <section className="grid gap-8 rounded-[32px] border border-border/80 bg-card/75 px-6 py-8 shadow-card md:px-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <p className="font-label text-xs uppercase tracking-[0.3em] text-muted-foreground">
          How it works
        </p>
        <h2 className="max-w-md font-display text-4xl leading-tight">
          A short walk through the current classifier story.
        </h2>
        <p className="max-w-md text-base leading-7 text-muted-foreground">
          The landing page now explains the demo in one glance: upload, analyze,
          and interpret the result with context instead of a bare binary label.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {steps.map(({ title, description, icon: Icon }, index) => (
          <article
            key={title}
            className="rounded-[24px] border border-border/70 bg-background/70 p-5"
          >
            <div className="mb-5 flex items-center justify-between">
              <Icon className="h-5 w-5 text-primary" />
              <span className="font-label text-xs uppercase tracking-[0.24em] text-muted-foreground">
                0{index + 1}
              </span>
            </div>
            <h3 className="font-display text-2xl leading-none">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
            {index < steps.length - 1 ? (
              <ArrowRight className="mt-6 h-4 w-4 text-muted-foreground" />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
