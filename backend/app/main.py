import base64
import json
import os
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.auth import authenticate_user
from app.detector import DetectionEngine

app = FastAPI(title="IOCL Safety Vision Backend")
frontend_url = os.getenv("FRONTEND_URL")

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
detector_engine = DetectionEngine()
BACKEND_DIR = Path(__file__).resolve().parents[1]
DATASET_MANIFEST_PATH = BACKEND_DIR / "dataset_manifest.json"
EVIDENCE_DIR = BACKEND_DIR / "recordings"
EVENTS_PATH = EVIDENCE_DIR / "events.json"
EVIDENCE_DIR.mkdir(exist_ok=True)
app.mount("/recordings", StaticFiles(directory=EVIDENCE_DIR), name="recordings")

def read_events():
    try:
        return json.loads(EVENTS_PATH.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def write_events(events):
    EVENTS_PATH.write_text(json.dumps(events, indent=2), encoding="utf-8")

def base64_to_cv2(value):
    try:
        raw = base64.b64decode(value.split(",", 1)[-1], validate=True)
        return cv2.imdecode(np.frombuffer(raw, np.uint8), cv2.IMREAD_COLOR)
    except Exception:
        return None

def cv2_to_base64(img):
    ok, buffer = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
    return f"data:image/jpeg;base64,{base64.b64encode(buffer).decode()}" if ok else None

@app.get("/health")
def health_check():
    return {"status": "healthy", "time": time.time(), "model": detector_engine.model_status}

@app.get("/dataset")
def dataset_info():
    data = json.loads(DATASET_MANIFEST_PATH.read_text(encoding="utf-8"))
    data["model"] = detector_engine.model_status
    return data

@app.get("/events")
def events():
    return read_events()

@app.patch("/events/{event_id}")
def update_event(event_id: str, payload: dict):
    events = read_events()
    updated = None
    for event in events:
        if event.get("id") == event_id:
            if "notes" in payload:
                event["notes"] = str(payload.get("notes") or "").strip()
            if "status" in payload:
                status = str(payload.get("status") or "").strip().title()
                if status not in {"Open", "Reviewed", "Archived"}:
                    raise HTTPException(status_code=400, detail="Status must be Open, Reviewed, or Archived")
                event["status"] = status
            event["updated_at"] = datetime.now(timezone.utc).isoformat()
            updated = event
            break
    if updated is None:
        raise HTTPException(status_code=404, detail="Event not found")
    write_events(events)
    return updated

@app.delete("/events/{event_id}")
def delete_event(event_id: str):
    events = read_events()
    event = next((item for item in events if item.get("id") == event_id), None)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    remaining = [item for item in events if item.get("id") != event_id]
    image_url = str(event.get("image_url") or "")
    if image_url.startswith("/recordings/"):
        image_path = EVIDENCE_DIR / Path(image_url).name
        try:
            image_path.unlink(missing_ok=True)
        except OSError:
            pass
    write_events(remaining)
    return {"ok": True, "deleted": event_id}

@app.post("/login")
def login(payload: dict):
    username = (payload.get("username") or "").strip()
    password = (payload.get("password") or "").strip()
    user = authenticate_user(username, password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"ok": True, "user": user}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    frame_count, started, last_saved = 0, time.time(), 0.0
    try:
        while True:
            payload = json.loads(await websocket.receive_text())
            frame = base64_to_cv2(payload.get("image", ""))
            if frame is None:
                await websocket.send_json({"error": "Invalid camera frame"})
                continue
            settings = payload.get("settings", {})
            now = time.time()
            inference_started = time.perf_counter()
            annotated, detections = detector_engine.detect(
                frame, settings.get("fireSens", 50), settings.get("smokeSens", 50), settings.get("steamSens", 50)
            )
            if detections and now - last_saved >= 5:
                event_id = uuid.uuid4().hex[:12]
                filename = f"{event_id}.jpg"
                cv2.imwrite(str(EVIDENCE_DIR / filename), annotated)
                event = {"id": event_id, "timestamp": datetime.now(timezone.utc).isoformat(), "detections": detections, "image_url": f"/recordings/{filename}"}
                write_events([event, *read_events()][:500])
                last_saved = now
            frame_count += 1
            await websocket.send_json({"image": cv2_to_base64(annotated), "detections": detections, "fps": round(frame_count / max(now - started, .01), 1), "latency": round((time.perf_counter() - inference_started) * 1000, 1), "model": detector_engine.model_status})
    except WebSocketDisconnect:
        pass
