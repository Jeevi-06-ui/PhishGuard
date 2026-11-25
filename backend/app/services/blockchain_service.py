"""Web3.py integration with the PhishGuardRegistry Solidity smart contract."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from web3 import Web3

from backend.app.config import get_settings
from ml.src.features import normalize_url_string


class BlockchainService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._abi: list[dict[str, Any]] | None = None
        self._contract_address: str | None = None
        self._load_contract_metadata()

    def _load_contract_metadata(self) -> None:
        artifact_path = Path(self.settings.contract_artifact_path)
        env_address = self.settings.phishguard_contract_address.strip()

        if artifact_path.exists():
            data = json.loads(artifact_path.read_text(encoding="utf-8"))
            self._abi = data.get("abi")
            self._contract_address = env_address or data.get("address")
        else:
            self._contract_address = env_address or None

    def _get_web3(self) -> Web3:
        rpc_url = self.settings.eth_rpc_url.strip()
        if not rpc_url:
            raise ConnectionError("ETH_RPC_URL is not configured.")
        return Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 5}))

    def _get_contract(self, w3: Web3):
        self._load_contract_metadata()
        if not self._abi or not self._contract_address:
            raise RuntimeError(
                "Smart contract ABI or address is unavailable. Deploy PhishGuardRegistry first."
            )
        checksum_addr = Web3.to_checksum_address(self._contract_address)
        code = w3.eth.get_code(checksum_addr)
        if not code or code == b"\x00" or len(code) == 0:
            raise RuntimeError(
                f"No contract bytecode found at {checksum_addr} on connected Ethereum node."
            )
        return w3.eth.contract(address=checksum_addr, abi=self._abi)

    def get_status(self) -> dict[str, Any]:
        try:
            w3 = self._get_web3()
            if not w3.is_connected():
                raise ConnectionError("Ethereum JSON-RPC node is unreachable.")
            chain_id = int(w3.eth.chain_id)
            latest_block = int(w3.eth.block_number)
            contract = self._get_contract(w3)
            total_records = int(contract.functions.getRecordCount().call())
            return {
                "connected": True,
                "networkName": self.settings.eth_network_name,
                "chainId": chain_id,
                "contractAddress": contract.address,
                "totalRecordedScans": total_records,
                "latestBlock": latest_block,
                "message": "Connected to Ethereum RPC and PhishGuardRegistry contract.",
            }
        except Exception as exc:  # noqa: BLE001
            self._load_contract_metadata()
            return {
                "connected": False,
                "networkName": None,
                "chainId": None,
                "contractAddress": self._contract_address,
                "totalRecordedScans": None,
                "latestBlock": None,
                "message": str(exc),
            }

    @staticmethod
    def _sha256_bytes32(hex_hash: str) -> bytes:
        clean = hex_hash.lower().removeprefix("0x")
        if len(clean) != 64:
            raise ValueError("URL SHA-256 hash must be exactly 64 hex characters.")
        return bytes.fromhex(clean)

    def record_scan(self, scan: dict[str, Any]) -> dict[str, Any]:
        w3 = self._get_web3()
        if not w3.is_connected():
            raise ConnectionError("Ethereum RPC node is offline.")
        contract = self._get_contract(w3)

        url_hash_bytes = self._sha256_bytes32(scan["urlSha256"])
        fn_call = contract.functions.recordScan(
            scan["scanId"],
            url_hash_bytes,
            scan["prediction"],
            int(scan["riskScore"]),
            str(scan["modelVersion"]),
        )

        private_key = self.settings.deployer_private_key.strip()
        if private_key:
            account = w3.eth.account.from_key(private_key)
            tx = fn_call.build_transaction(
                {
                    "from": account.address,
                    "nonce": w3.eth.get_transaction_count(account.address),
                    "chainId": w3.eth.chain_id,
                }
            )
            signed = w3.eth.account.sign_transaction(tx, private_key=private_key)
            tx_hash_bytes = w3.eth.send_raw_transaction(signed.raw_transaction)
        else:
            accounts = w3.eth.accounts
            if not accounts:
                raise RuntimeError(
                    "No unlocked Ethereum account or DEPLOYER_PRIVATE_KEY available to sign transaction."
                )
            tx_hash_bytes = fn_call.transact({"from": accounts[0]})

        receipt = w3.eth.wait_for_transaction_receipt(tx_hash_bytes, timeout=30)
        tx_hash_hex = receipt["transactionHash"].hex()
        if not tx_hash_hex.startswith("0x"):
            tx_hash_hex = f"0x{tx_hash_hex}"

        block = w3.eth.get_block(receipt["blockNumber"])
        block_ts = datetime.fromtimestamp(int(block["timestamp"]), tz=timezone.utc).isoformat()
        total_records = int(contract.functions.getRecordCount().call())

        return {
            "recordId": f"chain-{total_records}-{scan['scanId']}",
            "scanId": scan["scanId"],
            "txHash": tx_hash_hex,
            "blockNumber": int(receipt["blockNumber"]),
            "timestamp": block_ts,
            "urlHash": f"0x{scan['urlSha256']}",
            "hostname": scan["hostname"],
            "prediction": scan["prediction"],
            "riskScore": int(scan["riskScore"]),
            "modelVersion": str(scan["modelVersion"]),
            "contractAddress": contract.address,
            "gasUsed": int(receipt["gasUsed"]),
            "verified": bool(receipt["status"] == 1),
        }

    def verify_on_chain(
        self,
        *,
        tx_hash: str | None = None,
        url_hash: str | None = None,
        url: str | None = None,
        db_lookup: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        w3 = self._get_web3()
        if not w3.is_connected():
            raise ConnectionError("Ethereum RPC node is offline.")
        contract = self._get_contract(w3)

        target_hash = url_hash
        if url and not target_hash:
            normalized = normalize_url_string(url)
            target_hash = hashlib.sha256(normalized.encode("utf-8")).hexdigest()

        if tx_hash:
            receipt = w3.eth.get_transaction_receipt(tx_hash)
            if not receipt or receipt["status"] != 1:
                return {
                    "verified": False,
                    "existsOnChain": False,
                    "txHash": tx_hash,
                    "message": "Transaction receipt not found or transaction reverted on-chain.",
                }
            logs = contract.events.ScanRecorded().process_receipt(receipt)
            if not logs:
                return {
                    "verified": False,
                    "existsOnChain": False,
                    "txHash": tx_hash,
                    "blockNumber": int(receipt["blockNumber"]),
                    "message": "Transaction exists, but did not emit a PhishGuardRegistry ScanRecorded event.",
                }
            args = logs[0]["args"]
            ts_iso = datetime.fromtimestamp(int(args["timestamp"]), tz=timezone.utc).isoformat()
            stored_hex = "0x" + bytes(args["urlHash"]).hex()
            return {
                "verified": True,
                "existsOnChain": True,
                "txHash": tx_hash,
                "blockNumber": int(receipt["blockNumber"]),
                "timestamp": ts_iso,
                "storedUrlHash": stored_hex,
                "prediction": str(args["prediction"]),
                "riskScore": int(args["riskScore"]),
                "message": (
                    f"Verified on-chain in Block #{receipt['blockNumber']}: "
                    f"{args['prediction']} (Risk {args['riskScore']}/100)."
                ),
            }

        if target_hash:
            bytes32_hash = self._sha256_bytes32(target_hash)
            exists, latest_id, risk_score, prediction, ts_sec, _model_ver = (
                contract.functions.verifyByUrlHash(bytes32_hash).call()
            )
            if not exists:
                return {
                    "verified": False,
                    "existsOnChain": False,
                    "storedUrlHash": f"0x{target_hash.lower().removeprefix('0x')}",
                    "message": "No record matching that URL SHA-256 hash exists on the smart contract.",
                }
            ts_iso = datetime.fromtimestamp(int(ts_sec), tz=timezone.utc).isoformat()
            return {
                "verified": True,
                "existsOnChain": True,
                "txHash": db_lookup["txHash"] if db_lookup else None,
                "blockNumber": db_lookup["blockNumber"] if db_lookup else None,
                "timestamp": ts_iso,
                "storedUrlHash": f"0x{target_hash.lower().removeprefix('0x')}",
                "prediction": str(prediction),
                "riskScore": int(risk_score),
                "message": (
                    f"Verified smart contract record #{latest_id}: "
                    f"{prediction} (Risk {risk_score}/100)."
                ),
            }

        raise ValueError("Provide a transaction hash, URL SHA-256 hash, or URL to verify.")
