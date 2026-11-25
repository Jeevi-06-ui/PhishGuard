"""Machine learning model loader, URL validator, and inference wrapper."""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import joblib
import pandas as pd

from backend.app.config import get_settings
from ml.src.features import (
    FEATURE_COLUMNS,
    extract_feature_details,
    extract_feature_vector,
    extract_url_body,
    normalize_url_string,
)


def redact_url(raw_url: str) -> str:
    """Redact query values and defang URL for safe non-clickable display."""
    parsed = urlparse(raw_url)
    host = parsed.hostname or ""
    path = parsed.path or ""
    scheme = (parsed.scheme or "http").replace("http", "hxxp")
    safe_host = host.replace(".", "[.]")
    suffix = "?[query-redacted]" if parsed.query else ""
    return f"{scheme}://{safe_host}{path}{suffix}"


def build_recommendations(prediction: str, features: list[dict[str, Any]]) -> list[str]:
    feat_map = {item["key"]: item for item in features}
    if prediction == "Phishing":
        recs = [
            "Do not open this URL or submit any credentials, OTPs, or payment details.",
            "Verify the sender organization independently via an official bookmark or manually typed domain.",
            "Anchor this scan digest on Ethereum if you need tamper-evident incident documentation.",
        ]
        if feat_map.get("has_ip_address", {}).get("value"):
            recs.append("Avoid login pages served directly over raw IP addresses.")
        return recs
    if prediction == "Suspicious":
        return [
            "Exercise caution: inspect the registrable domain immediately before the first slash.",
            "Confirm HTTPS validity and avoid signing in unless you initiated the request yourself.",
            "Compare the hostname character-for-character against the organization's known domain.",
        ]
    return [
        "No strong structural phishing indicators detected by the trained classifier.",
        "Continue verifying domain spelling and keep multi-factor authentication enabled.",
        "You may optionally record this verification digest on-chain for audit tracking.",
    ]


class MlInferenceService:
    def __init__(self, artifacts_dir: str | None = None) -> None:
        self.artifacts_dir = Path(artifacts_dir or get_settings().ml_artifacts_dir)
        self.model_bundle: dict[str, Any] | None = None
        self.analytics_report: dict[str, Any] | None = None
        self.load_error: str | None = None
        self.reload()

    def reload(self) -> None:
        model_path = self.artifacts_dir / "phishguard_model.joblib"
        report_path = self.artifacts_dir / "evaluation_report.json"

        try:
            if not model_path.exists():
                raise FileNotFoundError(f"Model artifact missing at {model_path}")
            self.model_bundle = joblib.load(model_path)
            if report_path.exists():
                self.analytics_report = json.loads(report_path.read_text(encoding="utf-8"))
            self.load_error = None
        except Exception as exc:  # noqa: BLE001
            self.model_bundle = None
            self.load_error = str(exc)

    @property
    def is_ready(self) -> bool:
        return self.model_bundle is not None

    @property
    def active_model_name(self) -> str | None:
        if self.model_bundle:
            return str(self.model_bundle.get("model_name"))
        return None

    @property
    def model_version(self) -> str:
        if self.model_bundle:
            return str(self.model_bundle.get("model_version", "1.0.0"))
        return "0.0.0"

    @property
    def trained_at(self) -> str | None:
        if self.model_bundle:
            return self.model_bundle.get("trained_at")
        return None

    @property
    def model_accuracy(self) -> float | None:
        if self.analytics_report and self.analytics_report.get("activeModel"):
            return float(self.analytics_report["activeModel"]["accuracy"])
        return None

    def get_analytics_report(self) -> dict[str, Any] | None:
        return self.analytics_report

    def analyze_url(self, raw_url: str) -> dict[str, Any]:
        if not self.model_bundle:
            raise RuntimeError(self.load_error or "ML model bundle is not loaded.")

        normalized = normalize_url_string(raw_url)
        parsed = urlparse(normalized)
        if parsed.scheme.lower() not in {"http", "https"} or not parsed.hostname:
            raise ValueError("Invalid URL: only http:// and https:// URLs with a valid host are supported.")

        feature_dict = extract_feature_vector(normalized)
        columns = self.model_bundle.get("feature_columns", FEATURE_COLUMNS)
        df_row = pd.DataFrame([[feature_dict[col] for col in columns]], columns=columns)
        if self.model_bundle.get("uses_url_body"):
            df_row["url_body"] = [extract_url_body(normalized)]

        model = self.model_bundle["model"]
        prob_phishing = float(model.predict_proba(df_row)[0][1])
        risk_score = int(round(max(0.0, min(1.0, prob_phishing)) * 100))

        if prob_phishing >= 0.70:
            prediction = "Phishing"
        elif prob_phishing >= 0.42:
            prediction = "Suspicious"
        else:
            prediction = "Legitimate"

        confidence = round(max(prob_phishing, 1.0 - prob_phishing), 4)
        url_sha256 = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        features = extract_feature_details(normalized)
        recommendations = build_recommendations(prediction, features)

        return {
            "scanId": f"pg-{uuid.uuid4().hex[:12]}",
            "url": raw_url.strip(),
            "normalizedUrl": normalized,
            "hostname": parsed.hostname.lower(),
            "redactedUrl": redact_url(normalized),
            "urlSha256": url_sha256,
            "prediction": prediction,
            "phishingProbability": round(prob_phishing, 4),
            "riskScore": risk_score,
            "confidence": confidence,
            "modelName": self.active_model_name or "Scikit-learn Classifier",
            "modelVersion": self.model_version,
            "analyzedAt": datetime.now(timezone.utc).isoformat(),
            "features": features,
            "recommendations": recommendations,
            "blockchainStatus": "not_recorded",
            "blockchainTxHash": None,
            "blockNumber": None,
        }
