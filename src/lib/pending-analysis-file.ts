let pendingAnalysisFile: File | null = null;

export function setPendingAnalysisFile(file: File): void {
  pendingAnalysisFile = file;
}

export function takePendingAnalysisFile(): File | null {
  const file = pendingAnalysisFile;
  pendingAnalysisFile = null;
  return file;
}

export function clearPendingAnalysisFile(): void {
  pendingAnalysisFile = null;
}

export function peekPendingAnalysisFile(): File | null {
  return pendingAnalysisFile;
}
