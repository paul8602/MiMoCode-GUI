#!/bin/bash
set -e

# MiMo Code GUI 一键启动脚本
# Usage: ./start.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=4096
FRONTEND_PORT=4444

export PATH="$HOME/.bun/bin:$PATH"

cleanup() {
  echo ""
  echo "Stopping services..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  echo "Done."
}

trap cleanup EXIT INT TERM

echo "========================================="
echo "  MiMo Code GUI - Starting..."
echo "========================================="
echo ""

# Start backend
echo "[1/3] Starting backend server (port $BACKEND_PORT)..."
cd "$SCRIPT_DIR/packages/opencode"
bun run --conditions=browser ./src/index.ts serve --port $BACKEND_PORT &
BACKEND_PID=$!

# Wait for backend to be ready
echo "       Waiting for backend..."
for i in $(seq 1 30); do
  if curl -s "http://127.0.0.1:$BACKEND_PORT/global/health" > /dev/null 2>&1; then
    echo "       Backend ready!"
    break
  fi
  sleep 1
done

# Start frontend
echo "[2/3] Starting frontend (port $FRONTEND_PORT)..."
cd "$SCRIPT_DIR/packages/app"
bun dev -- --port $FRONTEND_PORT &
FRONTEND_PID=$!

# Wait for frontend to be ready
echo "       Waiting for frontend..."
for i in $(seq 1 30); do
  if curl -s "http://127.0.0.1:$FRONTEND_PORT" > /dev/null 2>&1; then
    echo "       Frontend ready!"
    break
  fi
  sleep 1
done

# Open browser
echo "[3/3] Opening browser..."
if command -v open &> /dev/null; then
  open "http://localhost:$FRONTEND_PORT"
elif command -v xdg-open &> /dev/null; then
  xdg-open "http://localhost:$FRONTEND_PORT"
else
  echo "       Please open: http://localhost:$FRONTEND_PORT"
fi

echo ""
echo "========================================="
echo "  MiMo Code GUI is running!"
echo "  URL: http://localhost:$FRONTEND_PORT"
echo "  Press Ctrl+C to stop"
echo "========================================="
echo ""

# Wait for processes
wait
