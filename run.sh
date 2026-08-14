#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

cd "$ROOT_DIR"

if [[ ! -x ".venv/bin/python" ]]; then
  echo "Missing .venv. Create it and install backend dependencies first:"
  echo "  python3 -m venv .venv"
  echo "  source .venv/bin/activate"
  echo "  pip install -r backend/requirements.txt"
  exit 1
fi

if [[ ! -d "frontend/node_modules" ]]; then
  echo "Missing frontend/node_modules. Run this first:"
  echo "  cd frontend && npm install"
  exit 1
fi

if [[ ! -f "frontend/.env.local" ]]; then
  cat > "frontend/.env.local" <<EOF
NEXT_PUBLIC_API_URL=http://127.0.0.1:${BACKEND_PORT}
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:${BACKEND_PORT}/ws
EOF
  echo "Created frontend/.env.local"
fi

if [[ ! -f "backend/models/fire_smoke_steam.pt" ]]; then
  echo "Warning: backend/models/fire_smoke_steam.pt is missing."
  echo "The camera feed will run, but fire/smoke/steam detections require a trained model."
  echo "Train it with: cd backend && ../.venv/bin/python train.py"
fi

echo "Starting backend on http://127.0.0.1:${BACKEND_PORT}"
(
  cd "$ROOT_DIR/backend"
  "$ROOT_DIR/.venv/bin/python" -m uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload
) &
BACKEND_PID=$!

echo "Starting frontend on http://localhost:${FRONTEND_PORT}"
(
  cd "$ROOT_DIR/frontend"
  npm run dev -- --port "$FRONTEND_PORT"
) &
FRONTEND_PID=$!

echo
echo "Open http://localhost:${FRONTEND_PORT}"
echo "Press Ctrl+C to stop both servers."

wait "$BACKEND_PID" "$FRONTEND_PID"
