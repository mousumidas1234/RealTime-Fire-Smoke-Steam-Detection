# IOCL Safety Vision — Fire, Smoke & Steam Detection

IOCL Safety Vision is an operator-assisted industrial-safety monitoring application. It uses a custom Ultralytics YOLO model to analyse webcam frames or uploaded images for **fire**, **smoke**, and **steam**, then presents annotated results, live alerts, analytics, and incident evidence in a web dashboard.

> This project is not a certified fire-alarm system. Validate the model against held-out cameras and site-specific operating conditions before using it to inform safety decisions.

## Features

- Real-time webcam monitoring through a browser-to-backend WebSocket stream.
- Single-image upload and inference when a webcam is not available.
- YOLO-based fire, smoke, and steam detection with class-specific bounding-box colours and confidence values.
- Individually adjustable fire, smoke, and steam sensitivity controls.
- Live connection, model-readiness, FPS, latency, and active-detection indicators.
- Browser audio alarms, with different tones by highest-priority detected threat and a mute control.
- Live incident monitor with duplicate-alert suppression, resolve actions, notes, and clear controls.
- Detection analytics including threat breakdowns, alert status, recent activity, and confidence information.
- Automatic incident-evidence capture: annotated detection frames are retained by the backend (at most once every five seconds while detections persist).
- Evidence review page with full-size image preview, investigation notes, and `Open`, `Reviewed`, or `Archived` status.
- Evidence deletion removes both the event record and its saved annotated image.
- Safety-response team and emergency-contact reference pages (demo data).
- Health, dataset-information, event-management, and WebSocket endpoints exposed by the FastAPI backend.
- Docker Compose support for running the frontend and backend together.

## Detection Output

| Threat | Detection method | Visual cue |
| --- | --- | --- |
| Fire | Custom YOLO object detector | Red bounding box |
| Smoke | Custom YOLO object detector | Gray bounding box |
| Steam | Custom YOLO object detector | Cyan bounding box |

The model may include an `other` training class to improve discrimination. The monitoring interface returns and alerts only on fire, smoke, and steam detections.

## Architecture

```text
iocl-cv-detection/
├── backend/                  # FastAPI + YOLO inference service
│   ├── app/                  # API, WebSocket, detector, and local authentication
│   ├── dataset/              # YOLO dataset, data configuration, and training notes
│   ├── models/               # Trained model checkpoint
│   ├── recordings/           # Saved annotated incident evidence and event metadata
│   ├── scripts/              # Dataset and inference utilities
│   └── train.py              # Custom YOLO training entry point
├── frontend/                 # Next.js, React, TypeScript, and Tailwind dashboard
│   ├── src/app/(portal)/     # Dashboard, analytics, evidence, and team pages
│   └── src/components/       # Camera stream, alerts, and navigation
├── docker-compose.yml
└── run.sh
```

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Webcam access (for live monitoring)

### 1. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend loads `backend/models/fire_smoke_steam.pt` by default. You can set `MODEL_PATH` to use another trained checkpoint. If no compatible model is available, the UI continues to show the source camera but displays a clear model-readiness warning and does not claim detections.

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with the configured local account, and select **Start Monitoring**. Allow browser camera permission when prompted. You can also choose **Upload Image** to analyse a still image.

### Camera and deployment notes

- Webcam access works on `localhost` during development. On another hostname, serve the frontend over HTTPS because browsers block camera access from insecure pages.
- The frontend defaults to `ws://<page-host>:8000/ws` (or `wss` when served over HTTPS). Set `NEXT_PUBLIC_WS_URL` in `frontend/.env.local` to point at a different CV backend, then restart Next.js.
- Saved evidence is available from the Recordings page and is stored in `backend/recordings`.

### Docker

```bash
docker-compose up --build
```

## Training Data, Acknowledgements, and References

This project uses publicly available datasets from Roboflow Universe. The training dataset was created by merging the following datasets and training a custom YOLO model for fire, smoke, and steam detection. Dataset use remains subject to the applicable Roboflow and dataset licences.

1. **Fire and Smoke Dataset** — Roboflow Universe
   <https://universe.roboflow.com/fire-and-smoke-detection-ktjbv/fire-and-smoke-9utf0>
2. **Steam Dataset** — Roboflow Universe
   <https://universe.roboflow.com/test-tdfub/steam-zwaef>

See [backend/dataset/README.md](backend/dataset/README.md) for the local dataset layout, label normalisation, and training workflow. The training script copies the generated `best.pt` checkpoint to `backend/models/fire_smoke_steam.pt`.

## Technology Stack

- **Backend:** Python, FastAPI, Ultralytics YOLO, OpenCV, NumPy, WebSockets
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide React
- **Deployment:** Docker and Docker Compose

## License

Internal use — IOCL Safety Division
