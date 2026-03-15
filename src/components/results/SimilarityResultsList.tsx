import SongCard from "@/components/SongCard";
import type { SimilarSong } from "@/types/analysis";

interface SimilarityResultsListProps {
  songs: SimilarSong[];
}

const SimilarityResultsList = ({ songs }: SimilarityResultsListProps) => {
  return (
    <section className="rounded-[30px] border border-border/70 bg-card/86 p-6 shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-label text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            Human references
          </p>
          <h2 className="mt-3 font-display text-3xl text-foreground">
            Similar human-made tracks
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Nearest catalog matches help explain what the upload resembles when the
            model leans synthetic.
          </p>
        </div>
        <p className="font-label text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {songs.length} reference{songs.length === 1 ? "" : "s"}
        </p>
      </div>

      {songs.length > 0 ? (
        <div className="mt-6 space-y-4">
          {songs.map((song, index) => (
            <SongCard
              key={song.id}
              song={song}
              rank={index + 1}
              delay={index * 90}
              detailed
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-border/70 bg-background/72 p-5 text-sm leading-6 text-muted-foreground">
          No catalog references were returned for this upload, so the verdict relies
          on the classifier signal stack alone.
        </div>
      )}
    </section>
  );
};

export default SimilarityResultsList;
