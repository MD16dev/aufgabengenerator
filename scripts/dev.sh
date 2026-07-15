#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cleanup() {
  echo ""
  echo "Server und Client werden beendet..."
  jobs -p | xargs -r kill 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

echo "Backend startet auf http://localhost:5000"
npm run dev:server &

echo "Frontend startet auf http://localhost:5173"
npm run dev:client &

wait
