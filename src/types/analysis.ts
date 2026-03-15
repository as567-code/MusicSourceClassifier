export interface SimilarSong {
  id: number;
  title: string;
  artist: string;
  album: string;
  similarity: number;
  genre: string;
}

export interface AnalysisResult {
  verdict: "ai" | "human";
  confidence: number;
  filename: string;
  explanation: string;
  signals: string[];
  analysisStages: string[];
  similarSongs: SimilarSong[];
  matchedTrack: SimilarSong | null;
  limitations: string[];
}
