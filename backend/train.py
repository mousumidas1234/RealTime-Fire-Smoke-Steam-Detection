"""Train the Fire, Smoke and Steam detector."""

import argparse
import os
import shutil
from pathlib import Path

import torch
from ultralytics import YOLO

from scripts.normalize_detection_labels import normalize_labels


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train the fire/smoke/steam detector")
    parser.add_argument("--epochs", type=int, default=int(os.getenv("TRAIN_EPOCHS", "50")))
    parser.add_argument("--imgsz", type=int, default=int(os.getenv("TRAIN_IMGSZ", "640")))
    parser.add_argument("--batch", type=int, default=int(os.getenv("TRAIN_BATCH", "16")))
    parser.add_argument("--workers", type=int, default=int(os.getenv("TRAIN_WORKERS", "2")))
    parser.add_argument(
        "--device",
        default=os.getenv("TRAIN_DEVICE", "0" if torch.cuda.is_available() else "cpu"),
    )
    parser.add_argument("--no-val", action="store_true", help="Skip validation each epoch for faster training")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    backend_dir = Path(__file__).resolve().parent
    weights_dir = backend_dir / "models"
    run_project = weights_dir / "runs"
    deployed_weights = weights_dir / "fire_smoke_steam.pt"

    weights_dir.mkdir(parents=True, exist_ok=True)

    # Polygon rows in a detection export are otherwise ignored by Ultralytics.
    # This dataset's affected annotations are predominantly smoke, so normalize
    # them before every training run and retain an on-disk original backup.
    label_report = normalize_labels(backend_dir / "dataset", apply=True)
    if label_report.polygons:
        print(f"Normalized {label_report.polygons} polygon labels in "
              f"{label_report.changed_files} files for detection training.")

    base_model = backend_dir / "yolov8n.pt"
    if not base_model.exists():
        base_model = backend_dir.parent / "yolov8n.pt"

    model = YOLO(str(base_model))

    result = model.train(
        data=str(backend_dir / "dataset" / "data.yaml"),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        workers=args.workers,
        device=args.device,
        val=not args.no_val,
        project=str(run_project),
        name="fire_smoke_steam",
        exist_ok=True,
        patience=20,
    )

    save_dir = Path(getattr(result, "save_dir", run_project / "fire_smoke_steam"))
    best_weights = save_dir / "weights" / "best.pt"
    if not best_weights.exists():
        raise FileNotFoundError(f"Training finished but best checkpoint was not found at {best_weights}")

    shutil.copy2(best_weights, deployed_weights)

    print(
        "Training complete.\n"
        f"Best model: {best_weights}\n"
        f"Deployed model: {deployed_weights}"
    )
