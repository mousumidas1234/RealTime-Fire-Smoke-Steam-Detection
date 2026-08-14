#!/usr/bin/env python3
"""Capture webcam frames and call Roboflow inference.

Usage:
  python3 webcam_roboflow_infer.py --workspace projectworks-workspace-ab9by --workflow general-segmentation-api --classes 0

Set your Roboflow API key in the environment: `export ROBOFLOW_API_KEY=...`
"""
import argparse
import tempfile
import time
import json
import cv2
from roboflow_client import run_workflow


def draw_prediction(frame, pred):
    # Try to draw bounding box if present
    try:
        x = int(pred.get('x', 0))
        y = int(pred.get('y', 0))
        w = int(pred.get('width', 0))
        h = int(pred.get('height', 0))
        cls = pred.get('class', '')
        conf = pred.get('confidence', 0)
        x1 = int(x - w / 2)
        y1 = int(y - h / 2)
        x2 = int(x + w / 2)
        y2 = int(y + h / 2)
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(frame, f'{cls} {conf:.2f}', (x1, max(10, y1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 1)
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace', required=True)
    parser.add_argument('--workflow', required=True)
    parser.add_argument('--classes', default='0')
    parser.add_argument('--interval', type=float, default=1.0, help='Seconds between inferences')
    args = parser.parse_args()

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError('Could not open webcam')

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            cv2.imshow('webcam', frame)

            # on spacebar, run inference immediately
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            if key == ord(' '):
                with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
                    path = tmp.name
                    cv2.imwrite(path, frame)
                print('Running inference...')
                try:
                    result = run_workflow(path, args.workspace, args.workflow, parameters={'classes': args.classes})
                    print('Result:', json.dumps(result, indent=2))
                    # draw predictions if present
                    preds = None
                    if isinstance(result, dict):
                        preds = result.get('predictions') or result.get('preds') or result.get('outputs')
                    if preds and isinstance(preds, list):
                        for p in preds:
                            draw_prediction(frame, p)
                    cv2.imshow('webcam', frame)
                except Exception as e:
                    print('Inference error:', e)
                time.sleep(args.interval)
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == '__main__':
    main()
