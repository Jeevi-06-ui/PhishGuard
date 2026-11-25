"""FastAPI route handlers for PhishGuard API v1."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from backend.app.database import DatabaseManager
from backend.app.services.blockchain_service import BlockchainService
from backend.app.services.ml_service import MlInferenceService
from ml.src.features import normalize_url_string

router = APIRouter(prefix="/api/v1", tags=["PhishGuard API"])


class ScanAnalyzeBody(BaseModel):
    url: str = Field(..., min_length=4, max_length=2048)


class BlockchainAnchorBody(BaseModel):
    scanId: str = Field(..., min_length=3, max_length=128)


class BlockchainVerifyBody(BaseModel):
    txHash: str | None = None
    urlHash: str | None = None
    url: str | None = None


def create_api_router(
    db: DatabaseManager,
    ml_service: MlInferenceService,
    blockchain_service: BlockchainService,
) -> APIRouter:
    api = APIRouter(prefix="/api/v1", tags=["PhishGuard API"])

    @api.get("/health")
    def get_health():
        bc_status = blockchain_service.get_status()
        return {
            "backend": {
                "status": "online",
                "message": "FastAPI backend and SQLite database operational.",
                "version": "1.0.0",
            },
            "mlModel": {
                "status": "online" if ml_service.is_ready else "offline",
                "message": (
                    f"Loaded {ml_service.active_model_name} (v{ml_service.model_version})"
                    if ml_service.is_ready
                    else (ml_service.load_error or "ML model artifact not loaded.")
                ),
                "activeModel": ml_service.active_model_name,
                "trainedAt": ml_service.trained_at,
            },
            "blockchain": {
                "status": "online" if bc_status["connected"] else "offline",
                "message": bc_status["message"],
                "networkName": bc_status["networkName"],
                "chainId": bc_status["chainId"],
                "contractAddress": bc_status["contractAddress"],
                "latestBlock": bc_status["latestBlock"],
            },
            "checkedAt": datetime.now(timezone.utc).isoformat(),
        }

    @api.get("/dashboard/summary")
    def get_dashboard_summary():
        return db.get_dashboard_summary(model_accuracy=ml_service.model_accuracy)

    @api.post("/scans/analyze")
    def analyze_url(body: ScanAnalyzeBody):
        try:
            result = ml_service.analyze_url(body.url)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

        return db.insert_scan(result)

    @api.get("/scans")
    def list_scans(
        page: int = Query(1, ge=1),
        pageSize: int = Query(10, ge=1, le=100),
        search: str | None = None,
        prediction: Literal["Phishing", "Legitimate", "Suspicious"] | None = None,
        blockchainStatus: Literal["verified", "pending", "not_recorded", "failed"] | None = None,
        sortBy: Literal["analyzedAt", "riskScore"] = "analyzedAt",
        sortOrder: Literal["asc", "desc"] = "desc",
    ):
        return db.list_scans(
            page=page,
            page_size=pageSize,
            search=search,
            prediction=prediction,
            blockchain_status=blockchainStatus,
            sort_by=sortBy,
            sort_order=sortOrder,
        )

    @api.get("/scans/{scan_id}")
    def get_scan(scan_id: str):
        scan = db.get_scan(scan_id)
        if not scan:
            raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found.")
        return scan

    @api.get("/ml/analytics")
    def get_ml_analytics():
        report = ml_service.get_analytics_report()
        if not report:
            raise HTTPException(
                status_code=503,
                detail="Model evaluation report is not available yet.",
            )
        return report

    @api.get("/blockchain/status")
    def get_blockchain_status():
        status = blockchain_service.get_status()
        status.pop("message", None)
        return status

    @api.get("/blockchain/records")
    def list_blockchain_records(
        page: int = Query(1, ge=1),
        pageSize: int = Query(20, ge=1, le=100),
    ):
        return db.list_blockchain_records(page=page, page_size=pageSize)

    @api.post("/blockchain/record")
    def record_scan_on_chain(body: BlockchainAnchorBody):
        scan = db.get_scan(body.scanId)
        if not scan:
            raise HTTPException(status_code=404, detail=f"Scan '{body.scanId}' not found.")

        existing = db.find_blockchain_record(url_hash=f"0x{scan['urlSha256']}")
        if scan["blockchainStatus"] == "verified" and existing:
            return existing

        try:
            record = blockchain_service.record_scan(scan)
        except ConnectionError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except Exception as exc:  # noqa: BLE001
            db.update_scan_blockchain(
                scan["scanId"], status="failed", tx_hash=None, block_number=None
            )
            raise HTTPException(status_code=502, detail=str(exc)) from exc

        db.insert_blockchain_record(record)
        db.update_scan_blockchain(
            scan["scanId"],
            status="verified" if record["verified"] else "pending",
            tx_hash=record["txHash"],
            block_number=record["blockNumber"],
        )
        return record

    @api.post("/blockchain/verify")
    def verify_on_chain(body: BlockchainVerifyBody):
        target_hash = body.urlHash
        if body.url and not target_hash:
            norm = normalize_url_string(body.url)
            target_hash = hashlib.sha256(norm.encode("utf-8")).hexdigest()

        db_lookup = db.find_blockchain_record(
            tx_hash=body.txHash,
            url_hash=f"0x{target_hash.lower().removeprefix('0x')}" if target_hash else None,
        )
        try:
            return blockchain_service.verify_on_chain(
                tx_hash=body.txHash,
                url_hash=body.urlHash,
                url=body.url,
                db_lookup=db_lookup,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except ConnectionError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    return api
