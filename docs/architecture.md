# PhishGuard System Architecture (Phase 1 Reference)

## Data Flow

1. **Client Interface (`frontend/`)**: Validates URL syntax, sends scan requests to FastAPI via typed HTTP services (`src/services/`), renders ML telemetry, and initiates blockchain anchoring.
2. **Inference & API Gateway (`backend/`)**: FastAPI validates incoming payloads, invokes the feature extractor and trained Scikit-learn artifacts (`ml/`), persists scans in SQLite, and delegates anchoring to Web3.py.
3. **Machine Learning Pipeline (`ml/`)**: Extracts lexical, domain-structural, and statistical features (URL length, entropy, subdomain depth, IP literal presence, suspicious tokens) and exports trained model + evaluation metrics JSON.
4. **Blockchain Verification (`blockchain/`)**: Solidity smart contract deployed via Hardhat stores immutable tuples of `(urlHash, riskScore, isPhishing, modelVersion, timestamp)` and emits verifiable events.

## Phase 1 API Contract Summary

- `GET /api/v1/health` — Backend, ML model, and blockchain RPC status
- `GET /api/v1/dashboard/summary` — Aggregate metrics, distribution, activity series, recent transactions
- `POST /api/v1/scans/analyze` — Run ML inference on a submitted URL
- `GET /api/v1/scans` — Paginated, filterable scan history
- `GET /api/v1/scans/{scan_id}` — Detailed scan breakdown
- `GET /api/v1/ml/analytics` — Real model evaluation metrics, confusion matrix, feature importance
- `GET /api/v1/blockchain/status` — Network name, chain ID, contract address, total records
- `GET /api/v1/blockchain/records` — On-chain anchored URL detection records
- `POST /api/v1/blockchain/record` — Anchor an analyzed scan onto the Ethereum contract
- `POST /api/v1/blockchain/verify` — Verify an existing URL hash or transaction hash on-chain
