import { ArrowUpRight, BadgeAlert, BookOpenText, ShieldCheck } from "lucide-react";

const trustCards = [
  {
    title: "What it does well",
    description:
      "Surface a fast, portfolio-friendly read on whether a track feels closer to human-made or AI-generated patterns.",
    icon: ShieldCheck,
  },
  {
    title: "What it cannot claim",
    description:
      "This is model-based analysis, not definitive proof. It should inform discussion, not act as legal or forensic evidence.",
    icon: BadgeAlert,
  },
  {
    title: "Why trust the framing",
    description:
      "The app links back to the research and keeps caveats visible so the presentation feels credible instead of theatrical.",
    icon: BookOpenText,
  },
];

const TrustSection = () => {
  return (
    <section className="grid gap-8 rounded-[32px] border border-border/80 bg-background/80 px-6 py-8 shadow-card md:px-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="space-y-4">
        <p className="font-label text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Trust and limitations
        </p>
        <h2 className="max-w-md font-display text-4xl leading-tight">
          Honest model framing matters as much as the visual polish.
        </h2>
        <p className="max-w-lg text-base leading-7 text-muted-foreground">
          MusicSourceClassifier is strongest when it shows both ambition and restraint:
          the experience is polished, but the language stays careful about what
          a classifier can actually say.
        </p>

        <a
          href="/research_paper.pdf"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition hover:text-primary"
        >
          Read the research paper
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {trustCards.map(({ title, description, icon: Icon }) => (
          <article
            key={title}
            className="rounded-[24px] border border-border/70 bg-card/85 p-5"
          >
            <Icon className="mb-4 h-5 w-5 text-primary" />
            <h3 className="font-display text-2xl leading-none">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default TrustSection;
