"""Automated API and ML inference tests for PhishGuard FastAPI backend."""

from __future__ import annotations

import hashlib
from pathlib import Path

from fastapi.testclient import TestClient

from backend.app.main import create_app


class FakeBlockchainOffline:
    def get_status(self):
        return {
            "connected": False,
            "networkName": None,
            "chainId": None,
            "contractAddress": None,
            "totalRecordedScans": None,
            "latestBlock": None,
            "message": "Simulated offline node for unit test",
        }


def test_health_analytics_and_scan_flow(tmp_path: Path):
    db_file = str(tmp_path / "test_phishguard.db")
    app = create_app(db_path=db_file, blockchain_service=FakeBlockchainOffline())
    client = TestClient(app)

    # 1. Health endpoint
    health_res = client.get("/api/v1/health")
    assert health_res.status_code == 200
    health_data = health_res.json()
    assert health_data["backend"]["status"] == "online"
    assert health_data["mlModel"]["status"] == "online"

    # 2. ML Analytics endpoint loads genuine evaluation metrics
    ml_res = client.get("/api/v1/ml/analytics")
    assert ml_res.status_code == 200
    ml_data = ml_res.json()
    assert ml_data["dataset"]["totalSamples"] > 1000
    assert len(ml_data["models"]) >= 3
    assert ml_data["confusionMatrix"] is not None

    # 3. Scan URL analysis
    scan_res = client.post(
        "/api/v1/scans/analyze",
        json={"url": "https://docs.python.org/3/library/urllib.parse.html"},
    )
    assert scan_res.status_code == 200
    scan_data = scan_res.json()
    assert scan_data["prediction"] in {"Legitimate", "Suspicious", "Phishing"}
    assert 0 <= scan_data["riskScore"] <= 100
    assert scan_data["urlSha256"] == hashlib.sha256(
        b"https://docs.python.org/3/library/urllib.parse.html"
    ).hexdigest()
    assert len(scan_data["features"]) >= 6

    # 4. Scan History pagination & search
    hist_res = client.get("/api/v1/scans?search=docs.python.org")
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    assert hist_data["total"] == 1
    assert hist_data["items"][0]["scanId"] == scan_data["scanId"]

    # 5. Dashboard summary reflects SQLite scan count
    dash_res = client.get("/api/v1/dashboard/summary")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["totalScans"] == 1
    assert dash_data["modelAccuracy"] is not None
