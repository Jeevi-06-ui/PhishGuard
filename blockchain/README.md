# Blockchain Smart Contracts (Phase 4)

This directory will house the Solidity smart contract, Hardhat configuration, deployment scripts, and ABI exports for tamper-evident URL scan verification.

Planned layout:
- `contracts/PhishGuardRegistry.sol` — On-chain registry storing URL SHA-256 hashes and risk verdicts
- `scripts/deploy.ts` — Local Hardhat / testnet deployment script
- `test/` — Contract unit tests
- `hardhat.config.ts` — Hardhat network configuration
