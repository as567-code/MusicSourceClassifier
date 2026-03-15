export interface SampleTrack {
  id: string;
  label: string;
  description: string;
  assetPath: string;
  filename: string;
  formatLabel: string;
  durationLabel: string;
  provenance: string;
}

export const sampleTracks: SampleTrack[] = [
  {
    id: "human-demo",
    label: "Human Demo",
    description:
      "A warm guitar-and-keys phrase with slight timing drift and natural dynamics.",
    assetPath: "/demo/human-demo.wav",
    filename: "human-demo.wav",
    formatLabel: "WAV",
    durationLabel: "0:08",
    provenance: "Original demo performance",
  },
  {
    id: "ai-demo",
    label: "AI Demo",
    description:
      "A glassy synth loop designed to feel tightly repeated and intentionally machine-like.",
    assetPath: "/demo/ai-demo.wav",
    filename: "ai-demo.wav",
    formatLabel: "WAV",
    durationLabel: "0:08",
    provenance: "Prepared synthetic demo clip",
  },
];

function getSampleTrackMimeType(track: SampleTrack): string {
  if (track.assetPath.endsWith(".wav")) {
    return "audio/wav";
  }

  if (track.assetPath.endsWith(".mp3")) {
    return "audio/mpeg";
  }

  if (track.assetPath.endsWith(".ogg")) {
    return "audio/ogg";
  }

  return "application/octet-stream";
}

export async function loadSampleTrackFile(track: SampleTrack): Promise<File> {
  const response = await fetch(track.assetPath);

  if (!response.ok) {
    throw new Error(`Unable to load sample track: ${track.filename}`);
  }

  const blob = await response.blob();

  return new File([blob], track.filename, {
    type: blob.type || getSampleTrackMimeType(track),
  });
}
