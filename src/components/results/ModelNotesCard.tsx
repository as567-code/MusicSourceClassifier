interface ModelNotesCardProps {
  analysisStages: string[];
  limitations: string[];
}

const ModelNotesCard = ({
  analysisStages,
  limitations,
}: ModelNotesCardProps) => {
  return (
    <section className="rounded-[30px] border border-border/70 bg-secondary p-6 text-secondary-foreground shadow-vinyl">
      <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <p className="font-label text-[11px] uppercase tracking-[0.28em] text-secondary-foreground/55">
            Model notes
          </p>
          <h2 className="mt-3 font-display text-3xl text-secondary-foreground">
            How this read was assembled
          </h2>
        </div>

        <div className="grid gap-4">
          <article className="rounded-[24px] border border-white/10 bg-white/6 p-5">
            <p className="font-label text-[11px] uppercase tracking-[0.24em] text-secondary-foreground/55">
              Analysis stages
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-secondary-foreground/78">
              {analysisStages.map((stage) => (
                <li key={stage} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{stage}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-[24px] border border-white/10 bg-black/14 p-5">
            <p className="font-label text-[11px] uppercase tracking-[0.24em] text-secondary-foreground/55">
              Limitations
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-secondary-foreground/72">
              {limitations.map((limitation) => (
                <li key={limitation} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-secondary-foreground/45" />
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
};

export default ModelNotesCard;
