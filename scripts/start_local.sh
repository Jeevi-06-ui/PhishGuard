#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export PYTHONPATH="$ROOT_DIR"
export HARDHAT_DISABLE_TELEMETRY_PROMPT=true

echo "1. Starting Hardhat local Ethereum node..."
(cd "$ROOT_DIR/blockchain" && npx hardhat node --hostname 127.0.0.1 --port 8545 > /tmp/phishguard_hardhat.log 2>&1) &
HARDHAT_PID=$!

cleanup() {
  kill "$HARDHAT_PID" >/dev/null 2>&1 || true
  kill "${BACKEND_PID:-}" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in $(seq 1 30); do
  if curl -s -X POST -H "Content-Type: application/json" \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://127.0.0.1:8545 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "2. Deploying PhishGuardRegistry smart contract..."
(cd "$ROOT_DIR/blockchain" && npx hardhat run scripts/deploy.ts --network localhost)

echo "3. Starting FastAPI backend on http://localhost:8000..."
"$ROOT_DIR/.venv/bin/uvicorn" backend.app.main:app --host 0.0.0.0 --port 8000 > /tmp/phishguard_backend.log 2>&1 &
BACKEND_PID=$!

echo "4. Starting Vite frontend on http://localhost:5173..."
cd "$ROOT_DIR/frontend"
npm run dev -- --port 5173
