# PhishGuard

**Intelligent Phishing Detection and Blockchain-Based Threat Verification System**

> *Detect intelligently. Verify securely. Browse confidently.*  
> Your intelligent defense against digital deception.

PhishGuard is a full-stack cybersecurity platform combining supervised Scikit-learn URL classification, safe non-fetching URL inspection, multi-vector security analysis tools, and an Ethereum smart contract (`PhishGuardRegistry.sol`) for tamper-evident cryptographic audit verification.

---

## Core Modules

- **URL, Bulk, Email & QR Scanners:** Inspect individual URLs (`POST /api/scans/url`), upload `.txt`/`.csv` batches (`POST /api/scans/bulk`), analyze email snippets (`POST /api/scans/email`), or decode QR codes in-browser via `@zxing/browser` without executing or fetching remote links.
- **Machine Learning Lab (`/ml-analytics`):** Real Scikit-learn Logistic Regression and Random Forest classifiers trained on a domain-grouped split of the **UCI PhiUSIIL Phishing URL Dataset**, complete with validation selection, ROC curves, confusion matrices, and reproducible Experiments 1–10.
- **Blockchain Explorer & Integrity Verifier (`/blockchain`, `/verification`):** Anchors canonical SHA-256 `recordHash` digests via Web3.py to `PhishGuardRegistry.sol` on Hardhat (`8545`) and lets analysts verify or simulate off-chain tampering detection (`verifyRecordHash`).
- **Governance & Education:** Role-based Admin Console (`/admin`), Community Threat Intelligence (`/threat-intelligence`), Printable & CSV/JSON Security Reports (`/reports`), Client-Side `zxcvbn` Password Strength Checker (`/password-checker`), 15-Question Phishing Awareness Quiz (`/awareness`), Notifications (`/notifications`), and Profile/Settings (`/settings`).

---

## Documentation Index

- [`docs/SRS_AND_ARCHITECTURE.md`](./docs/SRS_AND_ARCHITECTURE.md) — Abstract, SRS, Architecture, DFD, Use Case, Sequence & ER Mermaid Diagrams
- [`docs/API_AND_DATABASE.md`](./docs/API_AND_DATABASE.md) — Endpoint Catalog, SQLite ORM Schema & Security Controls
- [`docs/ML_AND_BLOCKCHAIN.md`](./docs/ML_AND_BLOCKCHAIN.md) — Dataset Debiasing, Experiments 1–10 & Smart Contract Digest Spec
- [`docs/TESTING_DEMO_AND_VIVA.md`](./docs/TESTING_DEMO_AND_VIVA.md) — Automated Tests, Viva Q&A, IEEE Paper Outline & Walkthrough

---

## Setup & Running Locally

### macOS / Linux

1. **Automated Setup (Python 3.12 venv, ML models, Hardhat compile, Vite deps, SQLite init):**
   ```bash
   chmod +x scripts/setup.sh scripts/start_local.sh
   ./scripts/setup.sh
   ```
2. **Optional — Provision an Administrator Account:**
   ```bash
   PYTHONPATH=. .venv/bin/python -m backend.app.cli create-admin \
     --email admin@phishguard.local \
     --name "Security Admin"
   ```
3. **Start Full Stack (`Hardhat :8545` + `FastAPI :8000` + `Vite :5173`):**
   ```bash
   ./scripts/start_local.sh
   ```

### Windows (PowerShell)

1. Install Python 3.12+, Node.js 20+, and set up `.venv` + dependencies:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\pip.exe install -r backend\requirements.txt
   cd blockchain; npm install; npx hardhat compile; cd ..
   cd frontend; npm install; cd ..
   $env:PYTHONPATH="."; .\.venv\Scripts\python.exe -m ml.train
   .\.venv\Scripts\python.exe -m ml.evaluate
   ```
2. **Start Full Stack:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts\start_local.ps1
   ```

### Running Tests

```bash
# 1. Smart Contract Tests
cd blockchain && npx hardhat test

# 2. Backend Pytest Suite
cd .. && PYTHONPATH=. .venv/bin/pytest backend/tests/test_api.py -v

# 3. Frontend Typecheck, Vitest & Production Build
cd frontend && npm run typecheck && npm run test && npm run build
```
# phishgaurd
