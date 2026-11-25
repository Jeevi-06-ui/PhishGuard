FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    HARDHAT_DISABLE_TELEMETRY_PROMPT=true

WORKDIR /app

# Install Node.js 20 LTS for Hardhat EVM node & Solidity contract deployment
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Install Hardhat & compile Solidity smart contract
COPY blockchain/package.json blockchain/package-lock.json* /app/blockchain/
RUN cd /app/blockchain && npm install --no-audit --no-fund
COPY blockchain /app/blockchain
RUN cd /app/blockchain && npx hardhat compile

# Copy ML inference code & pre-trained artifacts, Backend API, and startup script
COPY ml/__init__.py /app/ml/__init__.py
COPY ml/src /app/ml/src
COPY ml/artifacts /app/ml/artifacts
COPY backend /app/backend
COPY scripts/start_render.sh /app/scripts/start_render.sh
RUN chmod +x /app/scripts/start_render.sh

EXPOSE 8000

CMD ["/app/scripts/start_render.sh"]
