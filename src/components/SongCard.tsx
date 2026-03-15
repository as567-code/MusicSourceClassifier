import { Play, Music2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { SimilarSong } from "@/types/analysis";

import VinylRecord from "./VinylRecord";

export type Song = SimilarSong;

interface SongCardProps {
  song: SimilarSong;
  rank?: number;
  delay?: number;
  detailed?: boolean;
}

function formatSimilarity(similarity: number): string {
  const decimals = Number.isInteger(similarity) ? 0 : 1;
  return `${similarity.toFixed(decimals)}%`;
}

function getSimilarityWidth(similarity: number): number {
  return Math.min(Math.max(similarity, 0), 100);
}

const SongCard = ({ song, rank, delay = 0, detailed = false }: SongCardProps) => {
  return (
    <div
      className={cn(
        "group relative rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-vinyl opacity-0 animate-slide-up",
        detailed && "bg-background/84 p-6",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {rank && (
        <div className="absolute -left-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-warm font-display text-lg font-bold text-primary-foreground shadow-lg">
          {rank}
        </div>
      )}

      <div className="flex gap-5">
        <div className="relative flex-shrink-0">
          <VinylRecord size="sm" className="group-hover:animate-spin-slow" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-6 h-6 text-primary-foreground fill-current" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="truncate font-display text-lg font-semibold text-foreground">
            {song.title}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{song.artist}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{song.album}</span>
          </div>
        </div>

        <div className="flex flex-col items-end justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Music2 className="w-3 h-3" />
            <span>{song.genre}</span>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-gradient">
              {formatSimilarity(song.similarity)}
            </p>
            <p className="text-xs text-muted-foreground">match</p>
          </div>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-warm transition-all duration-1000 ease-out"
          style={{ width: `${getSimilarityWidth(song.similarity)}%` }}
        />
      </div>
    </div>
  );
};

export default SongCard;
