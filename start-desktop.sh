#!/bin/bash
set -e

# MiMo Code Desktop 一键启动脚本
# Usage: ./start-desktop.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=4096

export PATH="$HOME/.bun/bin:$PATH"

cleanup() {
  echo ""
  echo "Stopping services..."
  kill $BACKEND_PID 2>/dev/null || true
  wait $BACKEND_PID 2>/dev/null || true
  echo "Done."
}

trap cleanup EXIT INT TERM

echo "========================================="
echo "  MiMo Code Desktop - Starting..."
echo "========================================="
echo ""

# Start backend
echo "[1/2] Starting backend server (port $BACKEND_PORT)..."
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

# Start Electron desktop app
echo "[2/2] Starting Electron desktop app..."
cd "$SCRIPT_DIR/packages/desktop"
bun dev

# Cleanup when Electron exits
cleanup
