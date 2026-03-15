import { AudioWaveform, Disc3, ShieldCheck } from "lucide-react";

import DropZone from "@/components/DropZone";
import type { SampleTrack } from "@/data/sampleTracks";
import SampleTrackPicker from "@/components/home/SampleTrackPicker";
import VinylRecord from "@/components/VinylRecord";

interface UploadHeroProps {
  onFileSelect: (file: File) => void;
  onSampleSelect?: (track: SampleTrack) => void;
  isProcessing: boolean;
  uploadedFile: File | null;
  activeTrackId?: string | null;
}

const heroNotes = [
  {
    title: "Spectral fingerprinting",
    description: "The model reads texture, dynamics, and repetition cues from the audio itself.",
    icon: AudioWaveform,
  },
  {
    title: "Warm, honest framing",
    description: "Built for demos that feel premium without overstating what an ML verdict can prove.",
    icon: ShieldCheck,
  },
  {
    title: "Portfolio walkthrough",
    description: "Upload your own song or pull a safe sample from the crate to see the current flow.",
    icon: Disc3,
  },
];

const UploadHero = ({
  onFileSelect,
  onSampleSelect,
  isProcessing,
  uploadedFile,
  activeTrackId,
}: UploadHeroProps) => {
  return (
    <section className="relative overflow-hidden rounded-[40px] border border-border/80 bg-secondary px-6 py-8 text-secondary-foreground shadow-vinyl md:px-10 md:py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(214,122,55,0.26),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(241,207,148,0.16),_transparent_28%)]" />
      <div className="absolute -left-12 top-10 hidden lg:block">
        <VinylRecord size="lg" isPlaying className="opacity-20" />
      </div>
      <div className="absolute bottom-8 right-8 hidden xl:block">
        <VinylRecord size="md" className="opacity-20" />
      </div>

      <div className="relative grid gap-10 xl:grid-cols-[1.15fr_0.95fr]">
        <div className="space-y-8">
          <div className="max-w-2xl space-y-5">
            <div className="font-label flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.34em] text-secondary-foreground/70">
              <span>Retro editorial analog-lab</span>
              <span className="h-px w-16 bg-secondary-foreground/20" />
            </div>

            <div className="space-y-4">
              <p className="font-label text-sm uppercase tracking-[0.3em] text-secondary-foreground/60">
                MusicSourceClassifier
              </p>
              <h1 className="max-w-3xl font-display text-5xl leading-[0.95] text-secondary-foreground md:text-6xl xl:text-7xl">
                Hear the difference between machine polish and human pulse.
              </h1>
              <p className="max-w-xl text-base leading-7 text-secondary-foreground/75 md:text-lg">
                A showcase-grade music classifier for demo rooms, portfolios, and
                research storytelling. Drop in a track or cue one from the crate
                to enter the staged listening chamber before the unified results
                handoff.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {heroNotes.map(({ title, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <Icon className="mb-4 h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl leading-none text-secondary-foreground">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-secondary-foreground/70">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-6 self-start">
          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-label text-xs uppercase tracking-[0.26em] text-secondary-foreground/60">
                  Upload
                </p>
                <h2 className="mt-2 font-display text-3xl text-secondary-foreground">
                  Drop a track into the lab desk
                </h2>
              </div>

              <div className="font-label rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.24em] text-secondary-foreground/60">
                .wav .mp3 .flac .ogg
              </div>
            </div>

            <DropZone
              onFileSelect={onFileSelect}
              isProcessing={isProcessing}
              uploadedFile={uploadedFile}
            />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-secondary-foreground/65">
              <p>Uploads and crate demos now route through the dedicated `/analyze` chamber.</p>
              {uploadedFile ? (
                <p className="font-label rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.24em] text-secondary-foreground/75">
                  Queued: {uploadedFile.name}
                </p>
              ) : null}
            </div>
          </div>

          <SampleTrackPicker
            onSelect={onSampleSelect}
            activeTrackId={activeTrackId}
            isLoading={isProcessing || Boolean(activeTrackId)}
          />
        </div>
      </div>
    </section>
  );
};

export default UploadHero;
