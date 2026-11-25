"""SQLite persistence layer for PhishGuard scan history and blockchain receipts."""

from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from backend.app.config import get_settings


class DatabaseManager:
    def __init__(self, db_path: str | None = None) -> None:
        self.db_path = db_path or get_settings().database_path
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self._init_schema()

    @contextmanager
    def connection(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def _init_schema(self) -> None:
        with self.connection() as conn:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS scans (
                    scan_id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    normalized_url TEXT NOT NULL,
                    hostname TEXT NOT NULL,
                    redacted_url TEXT NOT NULL,
                    url_sha256 TEXT NOT NULL,
                    prediction TEXT NOT NULL,
                    phishing_probability REAL NOT NULL,
                    risk_score INTEGER NOT NULL,
                    confidence REAL NOT NULL,
                    model_name TEXT NOT NULL,
                    model_version TEXT NOT NULL,
                    analyzed_at TEXT NOT NULL,
                    features_json TEXT NOT NULL,
                    recommendations_json TEXT NOT NULL,
                    blockchain_status TEXT NOT NULL DEFAULT 'not_recorded',
                    blockchain_tx_hash TEXT,
                    block_number INTEGER
                );
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_scans_analyzed_at ON scans(analyzed_at DESC);"
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_scans_url_sha256 ON scans(url_sha256);"
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS blockchain_records (
                    record_id TEXT PRIMARY KEY,
                    scan_id TEXT NOT NULL,
                    tx_hash TEXT NOT NULL UNIQUE,
                    block_number INTEGER NOT NULL,
                    timestamp TEXT NOT NULL,
                    url_hash TEXT NOT NULL,
                    hostname TEXT NOT NULL,
                    prediction TEXT NOT NULL,
                    risk_score INTEGER NOT NULL,
                    model_version TEXT NOT NULL,
                    contract_address TEXT NOT NULL,
                    gas_used INTEGER,
                    verified INTEGER NOT NULL DEFAULT 1
                );
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_bc_timestamp ON blockchain_records(timestamp DESC);"
            )

    @staticmethod
    def _row_to_scan(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "scanId": row["scan_id"],
            "url": row["url"],
            "normalizedUrl": row["normalized_url"],
            "hostname": row["hostname"],
            "redactedUrl": row["redacted_url"],
            "urlSha256": row["url_sha256"],
            "prediction": row["prediction"],
            "phishingProbability": row["phishing_probability"],
            "riskScore": row["risk_score"],
            "confidence": row["confidence"],
            "modelName": row["model_name"],
            "modelVersion": row["model_version"],
            "analyzedAt": row["analyzed_at"],
            "features": json.loads(row["features_json"]),
            "recommendations": json.loads(row["recommendations_json"]),
            "blockchainStatus": row["blockchain_status"],
            "blockchainTxHash": row["blockchain_tx_hash"],
            "blockNumber": row["block_number"],
        }

    @staticmethod
    def _row_to_bc_record(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "recordId": row["record_id"],
            "scanId": row["scan_id"],
            "txHash": row["tx_hash"],
            "blockNumber": row["block_number"],
            "timestamp": row["timestamp"],
            "urlHash": row["url_hash"],
            "hostname": row["hostname"],
            "prediction": row["prediction"],
            "riskScore": row["risk_score"],
            "modelVersion": row["model_version"],
            "contractAddress": row["contract_address"],
            "gasUsed": row["gas_used"],
            "verified": bool(row["verified"]),
        }

    def insert_scan(self, scan: dict[str, Any]) -> dict[str, Any]:
        with self.connection() as conn:
            conn.execute(
                """
                INSERT INTO scans (
                    scan_id, url, normalized_url, hostname, redacted_url, url_sha256,
                    prediction, phishing_probability, risk_score, confidence,
                    model_name, model_version, analyzed_at, features_json,
                    recommendations_json, blockchain_status, blockchain_tx_hash, block_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    scan["scanId"],
                    scan["url"],
                    scan["normalizedUrl"],
                    scan["hostname"],
                    scan["redactedUrl"],
                    scan["urlSha256"],
                    scan["prediction"],
                    scan["phishingProbability"],
                    scan["riskScore"],
                    scan["confidence"],
                    scan["modelName"],
                    scan["modelVersion"],
                    scan["analyzedAt"],
                    json.dumps(scan["features"]),
                    json.dumps(scan["recommendations"]),
                    scan["blockchainStatus"],
                    scan.get("blockchainTxHash"),
                    scan.get("blockNumber"),
                ),
            )
        return scan

    def get_scan(self, scan_id: str) -> dict[str, Any] | None:
        with self.connection() as conn:
            row = conn.execute(
                "SELECT * FROM scans WHERE scan_id = ?", (scan_id,)
            ).fetchone()
        return self._row_to_scan(row) if row else None

    def list_scans(
        self,
        *,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        prediction: str | None = None,
        blockchain_status: str | None = None,
        sort_by: str = "analyzedAt",
        sort_order: str = "desc",
    ) -> dict[str, Any]:
        clauses: list[str] = []
        params: list[Any] = []

        if search:
            clauses.append("(scan_id LIKE ? OR hostname LIKE ? OR redacted_url LIKE ?)")
            like = f"%{search}%"
            params.extend([like, like, like])
        if prediction:
            clauses.append("prediction = ?")
            params.append(prediction)
        if blockchain_status:
            clauses.append("blockchain_status = ?")
            params.append(blockchain_status)

        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        order_col = "risk_score" if sort_by == "riskScore" else "analyzed_at"
        order_dir = "ASC" if sort_order.lower() == "asc" else "DESC"

        with self.connection() as conn:
            total_row = conn.execute(
                f"SELECT COUNT(*) AS cnt FROM scans {where_sql}", params
            ).fetchone()
            total = int(total_row["cnt"]) if total_row else 0
            offset = (page - 1) * page_size
            rows = conn.execute(
                f"""
                SELECT * FROM scans {where_sql}
                ORDER BY {order_col} {order_dir}
                LIMIT ? OFFSET ?
                """,
                [*params, page_size, offset],
            ).fetchall()

        total_pages = max(1, (total + page_size - 1) // page_size)
        return {
            "items": [self._row_to_scan(r) for r in rows],
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages,
        }

    def update_scan_blockchain(
        self,
        scan_id: str,
        *,
        status: str,
        tx_hash: str | None,
        block_number: int | None,
    ) -> None:
        with self.connection() as conn:
            conn.execute(
                """
                UPDATE scans
                SET blockchain_status = ?, blockchain_tx_hash = ?, block_number = ?
                WHERE scan_id = ?
                """,
                (status, tx_hash, block_number, scan_id),
            )

    def insert_blockchain_record(self, record: dict[str, Any]) -> dict[str, Any]:
        with self.connection() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO blockchain_records (
                    record_id, scan_id, tx_hash, block_number, timestamp,
                    url_hash, hostname, prediction, risk_score, model_version,
                    contract_address, gas_used, verified
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record["recordId"],
                    record["scanId"],
                    record["txHash"],
                    record["blockNumber"],
                    record["timestamp"],
                    record["urlHash"],
                    record["hostname"],
                    record["prediction"],
                    record["riskScore"],
                    record["modelVersion"],
                    record["contractAddress"],
                    record.get("gasUsed"),
                    1 if record["verified"] else 0,
                ),
            )
        return record

    def list_blockchain_records(self, page: int = 1, page_size: int = 20) -> dict[str, Any]:
        with self.connection() as conn:
            total_row = conn.execute("SELECT COUNT(*) AS cnt FROM blockchain_records").fetchone()
            total = int(total_row["cnt"]) if total_row else 0
            offset = (page - 1) * page_size
            rows = conn.execute(
                """
                SELECT * FROM blockchain_records
                ORDER BY block_number DESC, timestamp DESC
                LIMIT ? OFFSET ?
                """,
                (page_size, offset),
            ).fetchall()
        total_pages = max(1, (total + page_size - 1) // page_size)
        return {
            "items": [self._row_to_bc_record(r) for r in rows],
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages,
        }

    def find_blockchain_record(
        self, *, tx_hash: str | None = None, url_hash: str | None = None
    ) -> dict[str, Any] | None:
        with self.connection() as conn:
            if tx_hash:
                row = conn.execute(
                    "SELECT * FROM blockchain_records WHERE LOWER(tx_hash) = LOWER(?)",
                    (tx_hash,),
                ).fetchone()
                if row:
                    return self._row_to_bc_record(row)
            if url_hash:
                row = conn.execute(
                    """
                    SELECT * FROM blockchain_records
                    WHERE LOWER(url_hash) = LOWER(?)
                    ORDER BY block_number DESC LIMIT 1
                    """,
                    (url_hash,),
                ).fetchone()
                if row:
                    return self._row_to_bc_record(row)
        return None

    def get_dashboard_summary(self, model_accuracy: float | None) -> dict[str, Any]:
        with self.connection() as conn:
            counts = conn.execute(
                """
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN prediction = 'Phishing' THEN 1 ELSE 0 END) AS phishing,
                    SUM(CASE WHEN prediction = 'Suspicious' THEN 1 ELSE 0 END) AS suspicious,
                    SUM(CASE WHEN prediction = 'Legitimate' THEN 1 ELSE 0 END) AS legitimate
                FROM scans
                """
            ).fetchone()
            bc_row = conn.execute(
                "SELECT COUNT(*) AS verified_count FROM blockchain_records WHERE verified = 1"
            ).fetchone()

            daily_rows = conn.execute(
                """
                SELECT
                    SUBSTR(analyzed_at, 1, 10) AS day,
                    COUNT(*) AS total,
                    SUM(CASE WHEN prediction = 'Phishing' THEN 1 ELSE 0 END) AS phishing,
                    SUM(CASE WHEN prediction = 'Legitimate' THEN 1 ELSE 0 END) AS legitimate
                FROM scans
                GROUP BY SUBSTR(analyzed_at, 1, 10)
                ORDER BY day ASC
                LIMIT 14
                """
            ).fetchall()

            recent_scan_rows = conn.execute(
                "SELECT * FROM scans ORDER BY analyzed_at DESC LIMIT 5"
            ).fetchall()
            recent_tx_rows = conn.execute(
                "SELECT * FROM blockchain_records ORDER BY block_number DESC, timestamp DESC LIMIT 5"
            ).fetchall()

        total = int(counts["total"] or 0)
        phishing = int(counts["phishing"] or 0)
        suspicious = int(counts["suspicious"] or 0)
        legitimate = int(counts["legitimate"] or 0)
        bc_verified = int(bc_row["verified_count"] or 0)

        distribution = []
        if total > 0:
            distribution = [
                {"name": "Phishing", "value": phishing, "color": "#EF4444"},
                {"name": "Suspicious", "value": suspicious, "color": "#F59E0B"},
                {"name": "Legitimate", "value": legitimate, "color": "#22C55E"},
            ]
            distribution = [d for d in distribution if d["value"] > 0]

        activity = [
            {
                "date": r["day"],
                "total": int(r["total"] or 0),
                "phishing": int(r["phishing"] or 0),
                "legitimate": int(r["legitimate"] or 0),
            }
            for r in daily_rows
        ]

        return {
            "totalScans": total,
            "phishingDetected": phishing,
            "legitimatePredictions": legitimate,
            "blockchainRecordsVerified": bc_verified,
            "modelAccuracy": model_accuracy,
            "threatDistribution": distribution,
            "scanningActivity": activity,
            "recentScans": [self._row_to_scan(r) for r in recent_scan_rows],
            "recentTransactions": [self._row_to_bc_record(r) for r in recent_tx_rows],
        }
