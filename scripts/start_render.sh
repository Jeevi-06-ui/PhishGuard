#!/usr/bin/env bash
set -euo pipefail

export HARDHAT_DISABLE_TELEMETRY_PROMPT=true
export PYTHONPATH="/app"

RPC_URL="${ETH_RPC_URL:-http://127.0.0.1:8545}"

# Launch local Hardhat EVM node when using embedded localhost RPC
if [[ "$RPC_URL" == "http://127.0.0.1:8545" || "$RPC_URL" == "http://localhost:8545" ]]; then
  echo "[PhishGuard] Starting Hardhat JSON-RPC node on 127.0.0.1:8545..."
  (cd /app/blockchain && NODE_OPTIONS="--max-old-space-size=256" npx hardhat node --hostname 127.0.0.1 --port 8545 > /tmp/hardhat.log 2>&1) &
  HARDHAT_PID=$!

  for i in $(seq 1 30); do
    if python3 -c "import urllib.request; req = urllib.request.Request('http://127.0.0.1:8545', data=b'{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}', headers={'Content-Type':'application/json'}); urllib.request.urlopen(req, timeout=2)" >/dev/null 2>&1; then
      echo "[PhishGuard] Hardhat JSON-RPC is ready."
      break
    fi
    sleep 1
  done

  echo "[PhishGuard] Deploying PhishGuardRegistry contract..."
  (cd /app/blockchain && npx hardhat run scripts/deploy.ts --network localhost)

  trap 'kill "$HARDHAT_PID" >/dev/null 2>&1 || true' EXIT
fi

PORT_TO_BIND="${PORT:-8000}"
echo "[PhishGuard] Starting FastAPI server on 0.0.0.0:${PORT_TO_BIND}..."
exec uvicorn backend.app.main:app --host 0.0.0.0 --port "${PORT_TO_BIND}"
