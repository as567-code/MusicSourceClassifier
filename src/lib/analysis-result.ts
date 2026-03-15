import type { AnalysisResult, SimilarSong } from "@/types/analysis";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isConfidence(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0 && value <= 1;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSimilarSong(value: unknown): value is SimilarSong {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isFiniteNumber(value.id) &&
    typeof value.title === "string" &&
    typeof value.artist === "string" &&
    typeof value.album === "string" &&
    isFiniteNumber(value.similarity) &&
    typeof value.genre === "string"
  );
}

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.verdict === "ai" || value.verdict === "human") &&
    isConfidence(value.confidence) &&
    typeof value.filename === "string" &&
    typeof value.explanation === "string" &&
    isStringArray(value.signals) &&
    isStringArray(value.analysisStages) &&
    Array.isArray(value.similarSongs) &&
    value.similarSongs.every(isSimilarSong) &&
    (value.matchedTrack === null || isSimilarSong(value.matchedTrack)) &&
    isStringArray(value.limitations)
  );
}

export function parseAnalysisResult(value: unknown): AnalysisResult | null {
  return isAnalysisResult(value) ? value : null;
}

export function resolveHumanReferenceTrack(
  result: AnalysisResult,
): SimilarSong | null {
  return result.matchedTrack ?? result.similarSongs[0] ?? null;
}
