"""YOLO inference for the three site-safety classes.

The model is intentionally loaded once per process.  Train it with
``python train.py`` after putting the labelled Kaggle export in ``dataset/``.
"""
from __future__ import annotations

import os
import shutil
from pathlib import Path
from typing import Any

import cv2


class DetectionEngine:
    CLASSES = ("fire", "smoke", "steam")
    COLORS = {"fire": (0, 0, 255), "smoke": (128, 128, 128), "steam": (255, 255, 0)}

    def __init__(self) -> None:
        self.backend_dir = Path(__file__).resolve().parents[1]
        self.checked_paths: list[str] = []
        self.weights_path = self._resolve_weights_path()
        self.model: Any | None = None
        self.error: str | None = None
        try:
            from ultralytics import YOLO
            if not self.weights_path.exists():
                self.error = (
                    "Trained model weights not found. Run backend/train.py or set MODEL_PATH "
                    "to a trained fire/smoke/steam .pt checkpoint."
                )
            else:
                self.model = YOLO(str(self.weights_path))
                model_names = {str(name).lower().strip() for name in self._model_names().values()}
                missing = [label for label in self.CLASSES if label not in model_names]
                if missing:
                    self.model = None
                    self.error = (
                        f"Loaded weights do not contain required class(es): {', '.join(missing)}. "
                        f"Model classes: {', '.join(sorted(model_names)) or 'none'}."
                    )
        except Exception as exc:
            self.error = f"YOLO unavailable: {exc}"

    def _resolve_weights_path(self) -> Path:
        configured = os.getenv("MODEL_PATH")
        if configured:
            path = Path(configured).expanduser()
            self.checked_paths.append(str(path))
            return path

        candidates = [
            self.backend_dir / "models" / "fire_smoke_steam.pt",
            self.backend_dir / "models" / "runs" / "fire_smoke_steam" / "weights" / "best.pt",
            self.backend_dir / "runs" / "detect" / "models" / "runs" / "fire_smoke_steam" / "weights" / "best.pt",
        ]
        self.checked_paths = [str(path) for path in candidates]
        for path in candidates:
            if path.exists():
                deploy_path = candidates[0]
                if path != deploy_path:
                    deploy_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(path, deploy_path)
                    return deploy_path
                return path
        return candidates[0]

    def _model_names(self) -> dict[int, str]:
        if self.model is None:
            return {}
        names = self.model.names
        if isinstance(names, dict):
            return {int(key): str(value) for key, value in names.items()}
        return {index: str(value) for index, value in enumerate(names)}

    @property
    def model_status(self) -> dict[str, Any]:
        names = None
        if self.model is not None:
            names = self._model_names()
        return {
            "ready": self.model is not None,
            "architecture": "Ultralytics YOLO detection",
            "weights": str(self.weights_path),
            "checked_paths": self.checked_paths,
            "classes": names,
            "error": self.error,
        }

    def detect(self, frame, fire_sens=50, smoke_sens=50, steam_sens=50):
        """Return annotated frame and class-filtered YOLO predictions."""
        annotated = frame.copy()
        if self.model is None:
            cv2.putText(annotated, "MODEL NOT READY - see backend/dataset/README.md", (16, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 180, 255), 2)
            return annotated, []

        def sensitivity_to_threshold(value, floor=0.05):
            value = max(0, min(100, int(value)))
            # Smoke and steam are visually diffuse in webcam frames. Keep the
            # UI scale intuitive while avoiding a default 50% confidence gate.
            return max(floor, min(0.65, 0.58 - (value / 100) * 0.45))

        thresholds = {
            "fire": sensitivity_to_threshold(fire_sens, 0.05),
            "smoke": sensitivity_to_threshold(smoke_sens, 0.03),
            "steam": sensitivity_to_threshold(steam_sens, 0.03),
        }
        # Predict broadly, then apply each class's independently adjustable threshold.
        result = self.model.predict(frame, conf=0.01, imgsz=960, verbose=False)[0]
        names = result.names
        detections = []
        for box in result.boxes:
            class_id = int(box.cls.item())
            label = str(names[class_id]).lower().strip()
            confidence = float(box.conf.item())
            if label not in self.CLASSES or confidence < thresholds[label]:
                continue
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0].tolist())
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(frame.shape[1], x2), min(frame.shape[0], y2)
            if x2 <= x1 or y2 <= y1:
                continue
            color = self.COLORS[label]
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            cv2.putText(annotated, f"{label.upper()} {confidence:.0%}", (x1, max(22, y1 - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
            detections.append({"type": label, "confidence": round(confidence, 3), "bbox": [x1, y1, x2 - x1, y2 - y1]})
        return annotated, detections
