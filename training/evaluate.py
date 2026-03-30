#!/usr/bin/env python3
"""Evaluate a trained AudioCNN model on the held-out test set.

Produces:
  - results/eval_metrics.json     (accuracy, precision, recall, F1, AUC)
  - results/confusion_matrix.png
  - results/roc_curve.png
  - Classification report printed to stdout

Usage
-----
    python training/evaluate.py
    python training/evaluate.py --model results/best_model.pth --manifest results/test_manifest.json
"""

import argparse
import json
import os
import sys

import matplotlib
matplotlib.use("Agg")  # non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import torch
from sklearn.metrics import (
    accuracy_score,
    auc,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_curve,
)
from torch.utils.data import DataLoader
from tqdm import tqdm

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from backend.cnn_model import AudioCNN  # noqa: E402
from training.train import AudioDataset  # noqa: E402


def run_inference(model, test_loader, device):
    """Run model inference on the test set and return probabilities and labels."""
    all_probs, all_labels = [], []
    with torch.no_grad():
        for specs, labels_batch in tqdm(test_loader, desc="Running inference"):
            specs = specs.to(device)
            outputs = model(specs)
            all_probs.extend(outputs.cpu().numpy().flatten().tolist())
            all_labels.extend(labels_batch.numpy().flatten().tolist())
    return np.array(all_probs), np.array(all_labels, dtype=int)


def compute_metrics(all_labels, all_preds, all_probs):
    """Compute classification metrics and return as dict."""
    acc = accuracy_score(all_labels, all_preds)
    prec_human = precision_score(all_labels, all_preds, pos_label=0, zero_division=0)
    rec_human = recall_score(all_labels, all_preds, pos_label=0, zero_division=0)
    f1_human = f1_score(all_labels, all_preds, pos_label=0, zero_division=0)
    prec_ai = precision_score(all_labels, all_preds, pos_label=1, zero_division=0)
    rec_ai = recall_score(all_labels, all_preds, pos_label=1, zero_division=0)
    f1_ai = f1_score(all_labels, all_preds, pos_label=1, zero_division=0)

    fpr, tpr, _ = roc_curve(all_labels, all_probs)
    roc_auc = auc(fpr, tpr)

    return {
        "test_accuracy": round(acc, 5),
        "precision_human": round(prec_human, 5),
        "recall_human": round(rec_human, 5),
        "f1_human": round(f1_human, 5),
        "precision_ai": round(prec_ai, 5),
        "recall_ai": round(rec_ai, 5),
        "f1_ai": round(f1_ai, 5),
        "auc_roc": round(roc_auc, 5),
        "num_test_samples": len(all_labels),
        "num_human": int((all_labels == 0).sum()),
        "num_ai": int((all_labels == 1).sum()),
    }, fpr, tpr, roc_auc


def plot_confusion_matrix(all_labels, all_preds, output_path):
    """Save confusion matrix heatmap as PNG."""
    cm = confusion_matrix(all_labels, all_preds)
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=["Human", "AI"],
        yticklabels=["Human", "AI"],
        ax=ax,
    )
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    ax.set_title("Confusion Matrix")
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Confusion matrix saved to {output_path}")


def plot_roc_curve(fpr, tpr, roc_auc, output_path):
    """Save ROC curve as PNG."""
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot(fpr, tpr, color="darkorange", lw=2, label=f"ROC (AUC = {roc_auc:.3f})")
    ax.plot([0, 1], [0, 1], color="navy", lw=1, linestyle="--")
    ax.set_xlim([0.0, 1.0])
    ax.set_ylim([0.0, 1.05])
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("ROC Curve")
    ax.legend(loc="lower right")
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"ROC curve saved to {output_path}")


def run_full_evaluation(args):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    os.makedirs(args.output_dir, exist_ok=True)

    # --- Load test manifest --------------------------------------------
    with open(args.manifest) as f:
        manifest = json.load(f)
    test_paths = manifest["paths"]
    test_labels = manifest["labels"]
    print(f"Test set: {len(test_paths)} samples ({test_labels.count(0)} human, {test_labels.count(1)} AI)")

    # --- Load model ----------------------------------------------------
    model = AudioCNN().to(device)
    checkpoint = torch.load(args.model, map_location=device, weights_only=False)
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        model.load_state_dict(checkpoint)
    model.eval()
    print(f"Loaded model from {args.model}")

    # --- Inference -----------------------------------------------------
    test_ds = AudioDataset(test_paths, test_labels)
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, num_workers=0)

    all_probs, all_labels = run_inference(model, test_loader, device)
    all_preds = (all_probs >= 0.5).astype(int)

    # --- Metrics -------------------------------------------------------
    metrics, fpr, tpr, roc_auc = compute_metrics(all_labels, all_preds, all_probs)

    report = classification_report(
        all_labels, all_preds,
        target_names=["human", "ai"],
        digits=4,
    )

    print("\n" + "=" * 50)
    print("CLASSIFICATION REPORT")
    print("=" * 50)
    print(report)
    print(f"AUC-ROC: {roc_auc:.4f}")
    print(f"Test Accuracy: {metrics['test_accuracy']:.4f}")

    # --- Save metrics JSON ---------------------------------------------
    metrics_path = os.path.join(args.output_dir, "eval_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\nMetrics saved to {metrics_path}")

    # --- Plots ---------------------------------------------------------
    plot_confusion_matrix(
        all_labels, all_preds,
        os.path.join(args.output_dir, "confusion_matrix.png"),
    )
    plot_roc_curve(
        fpr, tpr, roc_auc,
        os.path.join(args.output_dir, "roc_curve.png"),
    )


def main():
    parser = argparse.ArgumentParser(description="Full evaluation of trained AudioCNN model")
    parser.add_argument("--model", type=str, default="results/best_model.pth", help="Path to model checkpoint")
    parser.add_argument("--manifest", type=str, default="results/test_manifest.json", help="Test set manifest JSON")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size")
    parser.add_argument("--output-dir", type=str, default="results", help="Output directory for plots and metrics")
    run_full_evaluation(parser.parse_args())


if __name__ == "__main__":
    main()
