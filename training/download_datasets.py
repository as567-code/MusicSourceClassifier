#!/usr/bin/env python3
"""Download and organise GTZAN and SONICS datasets for training.

Usage
-----
    python training/download_datasets.py --output-dir data/

The script creates the following layout::

    data/
      gtzan/          # 1 000 human-made 30-second clips (10 genres)
      sonics/         # AI-generated clips from the SONICS benchmark

Both directories contain .wav files ready for the training pipeline.

Prerequisites
-------------
* ``kaggle`` CLI authenticated (``~/.kaggle/kaggle.json``)
  – Install: ``pip install kaggle``
  – Credentials: https://www.kaggle.com/docs/api#authentication
* ``huggingface_hub`` for SONICS
  – Install: ``pip install huggingface_hub``
"""

import argparse
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path


def download_gtzan(output_dir: Path) -> Path:
    """Download GTZAN dataset from Kaggle.

    Dataset: https://www.kaggle.com/datasets/andradaolteanu/gtzan-dataset-music-genre-classification
    Contains 1 000 audio tracks (100 per genre × 10 genres), each 30 s long.
    """
    dest = output_dir / "gtzan"
    if dest.exists() and any(dest.rglob("*.wav")):
        print(f"[GTZAN] Already present at {dest}, skipping download.")
        return dest

    print("[GTZAN] Downloading from Kaggle …")
    try:
        subprocess.check_call(
            [
                "kaggle", "datasets", "download",
                "-d", "andradaolteanu/gtzan-dataset-music-genre-classification",
                "-p", str(output_dir),
                "--unzip",
            ]
        )
    except FileNotFoundError:
        print(
            "ERROR: 'kaggle' CLI not found. Install with:\n"
            "  pip install kaggle\n"
            "Then place your API token at ~/.kaggle/kaggle.json\n"
            "  https://www.kaggle.com/docs/api#authentication",
            file=sys.stderr,
        )
        sys.exit(1)

    # The Kaggle archive unpacks into Data/genres_original/<genre>/*.wav
    genres_dir = output_dir / "Data" / "genres_original"
    if not genres_dir.exists():
        # Some versions unpack differently
        for candidate in [
            output_dir / "genres_original",
            output_dir / "GTZAN" / "genres_original",
        ]:
            if candidate.exists():
                genres_dir = candidate
                break

    dest.mkdir(parents=True, exist_ok=True)
    wav_count = 0
    for wav in genres_dir.rglob("*.wav"):
        genre = wav.parent.name
        target = dest / f"{genre}_{wav.name}"
        shutil.copy2(wav, target)
        wav_count += 1

    print(f"[GTZAN] {wav_count} tracks copied to {dest}")

    # Clean up extracted archive directories
    for d in ["Data", "genres_original", "GTZAN"]:
        p = output_dir / d
        if p.exists():
            shutil.rmtree(p)

    return dest


def download_sonics(output_dir: Path) -> Path:
    """Download SONICS dataset from Hugging Face.

    Dataset: https://huggingface.co/datasets/awsqit/SONICS
    Contains AI-generated music tracks from multiple generators.
    """
    dest = output_dir / "sonics"
    if dest.exists() and any(dest.rglob("*.wav")) or (dest.exists() and any(dest.rglob("*.mp3"))):
        print(f"[SONICS] Already present at {dest}, skipping download.")
        return dest

    print("[SONICS] Downloading from Hugging Face …")
    try:
        from huggingface_hub import snapshot_download
    except ImportError:
        print(
            "ERROR: 'huggingface_hub' not found. Install with:\n"
            "  pip install huggingface_hub",
            file=sys.stderr,
        )
        sys.exit(1)

    snapshot_download(
        repo_id="awsqit/SONICS",
        repo_type="dataset",
        local_dir=str(dest),
        ignore_patterns=["*.md", "*.txt", "*.json", "*.csv", "*.gitattributes"],
    )

    audio_count = sum(
        1 for _ in dest.rglob("*")
        if _.suffix.lower() in {".wav", ".mp3", ".flac", ".ogg"}
    )
    print(f"[SONICS] {audio_count} audio files at {dest}")
    return dest


def main():
    parser = argparse.ArgumentParser(
        description="Download GTZAN and SONICS datasets for AudioCNN training."
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data",
        help="Root directory for downloaded datasets (default: data/)",
    )
    parser.add_argument(
        "--gtzan-only",
        action="store_true",
        help="Download only the GTZAN dataset",
    )
    parser.add_argument(
        "--sonics-only",
        action="store_true",
        help="Download only the SONICS dataset",
    )
    args = parser.parse_args()
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not args.sonics_only:
        download_gtzan(output_dir)
    if not args.gtzan_only:
        download_sonics(output_dir)

    print("\nDone. Run training with:")
    print(f"  python training/train.py --data-dir {output_dir}")


if __name__ == "__main__":
    main()
