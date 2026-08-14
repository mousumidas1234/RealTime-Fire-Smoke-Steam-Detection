#!/usr/bin/env python3
"""Make YOLO labels safe for bounding-box detection training.

Some exports mix detection rows (``class x_center y_center width height``)
with segmentation polygons.  Ultralytics discards the polygon rows when a
detect model is trained against such a mixed export.  Convert polygons to the
tightest normalized bounding box before training instead.
"""
from __future__ import annotations

import argparse
from collections import Counter
from dataclasses import dataclass
from pathlib import Path


@dataclass
class LabelReport:
    boxes: int = 0
    polygons: int = 0
    invalid: int = 0
    changed_files: int = 0


def _box_from_polygon(values: list[float]) -> tuple[float, float, float, float]:
    xs = values[0::2]
    ys = values[1::2]
    left, right = max(0.0, min(xs)), min(1.0, max(xs))
    top, bottom = max(0.0, min(ys)), min(1.0, max(ys))
    return ((left + right) / 2, (top + bottom) / 2, right - left, bottom - top)


def normalize_labels(dataset_dir: Path, apply: bool = False) -> LabelReport:
    """Inspect labels and optionally convert polygon annotations to boxes.

    Original files are copied to ``.label_backups/converted-segments`` before
    the first change, so conversion is reversible.
    """
    report = LabelReport()
    backups = dataset_dir / ".label_backups" / "converted-segments"
    for split in ("train", "valid", "test"):
        labels_dir = dataset_dir / split / "labels"
        if not labels_dir.exists():
            continue
        for label_path in sorted(labels_dir.glob("*.txt")):
            replacement: list[str] = []
            changed = False
            for line_number, line in enumerate(label_path.read_text(encoding="utf-8").splitlines(), 1):
                parts = line.split()
                if not parts:
                    continue
                try:
                    class_id = int(parts[0])
                    coords = [float(value) for value in parts[1:]]
                except ValueError as exc:
                    raise ValueError(f"{label_path}:{line_number}: non-numeric YOLO label") from exc
                if class_id < 0 or len(coords) < 4 or len(coords) % 2:
                    report.invalid += 1
                    raise ValueError(f"{label_path}:{line_number}: invalid YOLO label shape")
                if any(value < 0 or value > 1 for value in coords):
                    report.invalid += 1
                    raise ValueError(f"{label_path}:{line_number}: coordinates must be normalized to 0..1")
                if len(coords) == 4:
                    report.boxes += 1
                    replacement.append(line.strip())
                    continue
                report.polygons += 1
                changed = True
                x_center, y_center, width, height = _box_from_polygon(coords)
                if width <= 0 or height <= 0:
                    report.invalid += 1
                    raise ValueError(f"{label_path}:{line_number}: polygon has no area")
                replacement.append(f"{class_id} {x_center:.8f} {y_center:.8f} {width:.8f} {height:.8f}")
            if changed:
                report.changed_files += 1
                if apply:
                    backup_path = backups / split / "labels" / label_path.name
                    backup_path.parent.mkdir(parents=True, exist_ok=True)
                    if not backup_path.exists():
                        backup_path.write_text(label_path.read_text(encoding="utf-8"), encoding="utf-8")
                    label_path.write_text("\n".join(replacement) + "\n", encoding="utf-8")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Normalize mixed YOLO polygon labels for detection training")
    parser.add_argument("--dataset", type=Path, default=Path(__file__).resolve().parents[1] / "dataset")
    parser.add_argument("--apply", action="store_true", help="Convert polygon rows; otherwise only report them")
    args = parser.parse_args()
    report = normalize_labels(args.dataset, apply=args.apply)
    action = "Converted" if args.apply else "Found"
    print(f"{action} {report.polygons} polygon rows in {report.changed_files} files; "
          f"{report.boxes} bounding-box rows are already valid.")
    if report.polygons and not args.apply:
        raise SystemExit("Run again with --apply before training a detection model.")


if __name__ == "__main__":
    main()
