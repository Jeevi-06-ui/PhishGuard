# PhishGuard

**Intelligent Phishing URL Detection Using Machine Learning and Blockchain**

> *Detect intelligently. Verify securely. Browse confidently.*

PhishGuard is a full-stack academic cybersecurity web application that analyzes suspicious URLs using trained Scikit-learn machine learning classifiers and anchors cryptographic SHA-256 verification digests onto an Ethereum smart contract for tamper-evident auditability.

---

## Architecture Overview

| Layer | Technology | Directory |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React, Recharts | [`frontend/`](./frontend) |
| **Backend API** | Python FastAPI, Pydantic, SQLite, Web3.py | [`backend/`](./backend) |
| **Machine Learning** | Scikit-learn, Pandas, NumPy, Joblib | [`ml/`](./ml) |
| **Blockchain** | Ethereum, Solidity (`PhishGuardRegistry`), Hardhat | [`blockchain/`](./blockchain) |
| **Documentation** | Architecture notes & API contracts | [`docs/`](./docs) |
| **Automation** | Local stack & Render container startup scripts | [`scripts/`](./scripts) |

---

## Quick Start (Full Local Stack)

### 1. Machine Learning Training (Optional — Pre-trained Artifacts Included)
```bash
uv venv .venv --python 3.12
uv pip install --python .venv/bin/python -r backend/requirements.txt
PYTHONPATH=. .venv/bin/python -m ml.src.train
```

### 2. Blockchain Smart Contract (Hardhat)
```bash
cd blockchain
npm install
npx hardhat compile
npx hardhat test
npx hardhat node --hostname 127.0.0.1 --port 8545
# In another terminal:
npx hardhat run scripts/deploy.ts --network localhost
```

### 3. FastAPI Backend
```bash
cd /path/to/PhishGuard
PYTHONPATH=. .venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

### 4. React Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Or launch the complete Hardhat + FastAPI + Vite stack at once:
```bash
./scripts/start_local.sh
```

---

## Deployment

### Frontend on Vercel
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- SPA Routing Config: [`frontend/vercel.json`](./frontend/vercel.json)
- Environment Variable: `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api/v1`

### Backend + ML + Hardhat on Render
- Blueprint: [`render.yaml`](./render.yaml)
- Container: [`Dockerfile`](./Dockerfile) + [`scripts/start_render.sh`](./scripts/start_render.sh)
- Health Check Path: `/api/v1/health`
- Runs Python 3.12 FastAPI, Scikit-learn inference artifacts, SQLite persistence, and an embedded Hardhat Ethereum node (or connects to an external `ETH_RPC_URL` + `PHISHGUARD_CONTRACT_ADDRESS` + `DEPLOYER_PRIVATE_KEY` such as Ethereum Sepolia if configured).
