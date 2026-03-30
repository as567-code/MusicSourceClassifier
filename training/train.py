#!/usr/bin/env python3
"""Training pipeline for AudioCNN (Human vs AI-generated music).

Uses the *exact* same model architecture from ``backend/cnn_model.py``
and the *exact* same Mel-spectrogram preprocessing from
``backend/utils.py`` so that trained weights are drop-in compatible
with the inference API.

Usage
-----
    python training/train.py --data-dir data/ --epochs 25 --batch-size 32

Expected data layout::

    data/
      gtzan/    *.wav   (label 0 - human)
      sonics/   *.wav|*.mp3|*.flac|*.ogg   (label 1 - AI)
"""

import argparse
import csv
import json
import os
import sys
import time
from pathlib import Path

import librosa
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import torchaudio
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader, Dataset
from tqdm import tqdm

# ---------------------------------------------------------------------------
# Import the *existing* model so we never duplicate the architecture
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from backend.cnn_model import AudioCNN  # noqa: E402

# ---------------------------------------------------------------------------
# Preprocessing - mirrors backend/utils.py transform_audio exactly
# ---------------------------------------------------------------------------
SAMPLE_RATE = 22050
MAX_MS = 4000  # 4 seconds
N_MELS = 64
AUDIO_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg"}


def preprocess_audio(file_path: str):
    """Convert an audio file to a Mel-spectrogram tensor.

    Reproduces the exact pipeline of ``backend/utils.py:transform_audio``
    so that models trained here are compatible with the inference server.

    Returns a tensor of shape (1, 1, n_mels, time) or None on failure.
    """
    try:
        waveform, _ = librosa.load(file_path, sr=SAMPLE_RATE)
    except Exception as e:
        print(f"  [skip] {file_path}: {e}")
        return None

    waveform_tensor = torch.from_numpy(waveform).unsqueeze(0)  # (1, samples)

    max_len = int(SAMPLE_RATE * MAX_MS / 1000)
    if waveform_tensor.shape[1] > max_len:
        waveform_tensor = waveform_tensor[:, :max_len]
    else:
        padding = max_len - waveform_tensor.shape[1]
        waveform_tensor = F.pad(waveform_tensor, (0, padding))

    mel_transform = torchaudio.transforms.MelSpectrogram(
        sample_rate=SAMPLE_RATE,
        n_mels=N_MELS,
    )
    spec = mel_transform(waveform_tensor)
    spec = torchaudio.transforms.AmplitudeToDB()(spec)
    return spec.unsqueeze(0)  # (1, 1, n_mels, time)


# ---------------------------------------------------------------------------
# Dataset
# ---------------------------------------------------------------------------
class AudioDataset(Dataset):
    """Lazily-preprocessed audio dataset backed by file paths + labels."""

    def __init__(self, file_paths, labels):
        self.file_paths = file_paths
        self.labels = labels

    def __len__(self):
        return len(self.file_paths)

    def __getitem__(self, idx):
        spec = preprocess_audio(self.file_paths[idx])
        if spec is None:
            # Return a zero tensor so the DataLoader does not crash
            spec = torch.zeros(1, 1, N_MELS, int(SAMPLE_RATE * MAX_MS / 1000) // 512 + 1)
        label = torch.tensor([self.labels[idx]], dtype=torch.float32)
        return spec.squeeze(0), label  # (1, n_mels, time), (1,)


# ---------------------------------------------------------------------------
# Data collection
# ---------------------------------------------------------------------------
def collect_files(data_dir: Path):
    """Walk *data_dir*/gtzan and *data_dir*/sonics, return paths + labels."""
    gtzan_dir = data_dir / "gtzan"
    sonics_dir = data_dir / "sonics"

    if not gtzan_dir.exists():
        sys.exit(f"ERROR: GTZAN directory not found at {gtzan_dir}")
    if not sonics_dir.exists():
        sys.exit(f"ERROR: SONICS directory not found at {sonics_dir}")

    paths, labels = [], []

    for f in sorted(gtzan_dir.rglob("*")):
        if f.suffix.lower() in AUDIO_EXTENSIONS:
            paths.append(str(f))
            labels.append(0)  # human

    for f in sorted(sonics_dir.rglob("*")):
        if f.suffix.lower() in AUDIO_EXTENSIONS:
            paths.append(str(f))
            labels.append(1)  # AI

    print(f"Collected {labels.count(0)} human + {labels.count(1)} AI = {len(labels)} total files")
    return paths, labels


# ---------------------------------------------------------------------------
# Training loop
# ---------------------------------------------------------------------------
def train(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")

    # --- Data ----------------------------------------------------------
    paths, labels = collect_files(Path(args.data_dir))

    # Stratified 70/15/15 split
    train_paths, temp_paths, train_labels, temp_labels = train_test_split(
        paths, labels, test_size=0.30, stratify=labels, random_state=42,
    )
    val_paths, test_paths, val_labels, test_labels = train_test_split(
        temp_paths, temp_labels, test_size=0.50, stratify=temp_labels, random_state=42,
    )
    print(f"Split: train={len(train_paths)}  val={len(val_paths)}  test={len(test_paths)}")

    # Save test set manifest so training/evaluate.py can reload it
    os.makedirs("results", exist_ok=True)
    with open("results/test_manifest.json", "w") as f:
        json.dump({"paths": test_paths, "labels": test_labels}, f)

    train_ds = AudioDataset(train_paths, train_labels)
    val_ds = AudioDataset(val_paths, val_labels)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    # --- Model ---------------------------------------------------------
    model = AudioCNN(dropout_rate=args.dropout).to(device)
    param_count = sum(p.numel() for p in model.parameters())
    print(f"AudioCNN: {param_count:,} parameters")

    criterion = nn.BCELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode="min", factor=0.5, patience=2,
    )

    # --- Training loop -------------------------------------------------
    best_val_loss = float("inf")
    patience_counter = 0
    history = []

    os.makedirs("results", exist_ok=True)
    csv_path = "results/training_log.csv"
    best_model_path = args.output

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()

        # ---- Train ----------------------------------------------------
        model.train()
        train_loss, train_correct, train_total = 0.0, 0, 0
        for specs, labels_batch in tqdm(train_loader, desc=f"Epoch {epoch}/{args.epochs} [train]", leave=False):
            specs, labels_batch = specs.to(device), labels_batch.to(device)
            optimizer.zero_grad()
            outputs = model(specs)
            loss = criterion(outputs, labels_batch)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * specs.size(0)
            preds = (outputs >= 0.5).float()
            train_correct += (preds == labels_batch).sum().item()
            train_total += specs.size(0)

        train_loss /= train_total
        train_acc = train_correct / train_total

        # ---- Validate -------------------------------------------------
        model.eval()
        val_loss, val_correct, val_total = 0.0, 0, 0
        with torch.no_grad():
            for specs, labels_batch in tqdm(val_loader, desc=f"Epoch {epoch}/{args.epochs} [val]", leave=False):
                specs, labels_batch = specs.to(device), labels_batch.to(device)
                outputs = model(specs)
                loss = criterion(outputs, labels_batch)
                val_loss += loss.item() * specs.size(0)
                preds = (outputs >= 0.5).float()
                val_correct += (preds == labels_batch).sum().item()
                val_total += specs.size(0)

        val_loss /= val_total
        val_acc = val_correct / val_total
        elapsed = time.time() - t0

        scheduler.step(val_loss)

        row = {
            "epoch": epoch,
            "train_loss": round(train_loss, 5),
            "val_loss": round(val_loss, 5),
            "train_acc": round(train_acc, 5),
            "val_acc": round(val_acc, 5),
            "lr": optimizer.param_groups[0]["lr"],
            "time_s": round(elapsed, 1),
        }
        history.append(row)

        print(
            f"Epoch {epoch:>3d}/{args.epochs} | "
            f"train_loss={train_loss:.4f}  train_acc={train_acc:.4f} | "
            f"val_loss={val_loss:.4f}  val_acc={val_acc:.4f} | "
            f"{elapsed:.1f}s"
        )

        # Save best model
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "epoch": epoch,
                    "val_loss": val_loss,
                    "val_acc": val_acc,
                },
                best_model_path,
            )
            print(f"  -> Saved best model (val_loss={val_loss:.4f})")
        else:
            patience_counter += 1
            if patience_counter >= args.patience:
                print(f"  Early stopping triggered (patience={args.patience})")
                break

    # --- Write CSV log -------------------------------------------------
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(history[0].keys()))
        writer.writeheader()
        writer.writerows(history)
    print(f"\nTraining log saved to {csv_path}")
    print(f"Best model saved to {best_model_path}")

    # --- Final test set preview ----------------------------------------
    print("\n--- Test set evaluation ---")
    test_ds = AudioDataset(test_paths, test_labels)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    checkpoint = torch.load(best_model_path, map_location=device, weights_only=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    test_correct, test_total = 0, 0
    with torch.no_grad():
        for specs, labels_batch in tqdm(test_loader, desc="Testing", leave=False):
            specs, labels_batch = specs.to(device), labels_batch.to(device)
            outputs = model(specs)
            preds = (outputs >= 0.5).float()
            test_correct += (preds == labels_batch).sum().item()
            test_total += specs.size(0)

    test_acc = test_correct / test_total
    print(f"Test accuracy: {test_acc:.4f} ({test_correct}/{test_total})")
    print("\nRun `python training/evaluate.py` for full metrics, confusion matrix, and ROC curve.")


def parse_args():
    parser = argparse.ArgumentParser(description="Train AudioCNN for AI vs Human music classification")
    parser.add_argument("--data-dir", type=str, default="data", help="Root data directory")
    parser.add_argument("--epochs", type=int, default=25, help="Max training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-3, help="Initial learning rate")
    parser.add_argument("--dropout", type=float, default=0.5, help="Dropout rate")
    parser.add_argument("--patience", type=int, default=5, help="Early stopping patience")
    parser.add_argument("--output", type=str, default="results/best_model.pth", help="Path for best model checkpoint")
    return parser.parse_args()


if __name__ == "__main__":
    train(parse_args())
