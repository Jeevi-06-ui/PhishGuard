"""Train and evaluate hybrid Scikit-learn phishing URL classifiers (TF-IDF + Lexical)."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    ExtraTreesClassifier,
    GradientBoostingClassifier,
    RandomForestClassifier,
)
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from ml.src.features import (
    FEATURE_COLUMNS,
    FEATURE_LABELS,
    extract_feature_vector,
    extract_url_body,
)
from ml.src.fetch_dataset import download_datasets

MODEL_VERSION = "1.1.0"
RANDOM_STATE = 42


def load_corpus(data_dir: Path) -> tuple[pd.DataFrame, str, str]:
    """Load stratified real full-path URLs from the Malicious URLs corpus + PhiUSIIL corpus."""
    phi_path, mal_path = download_datasets(data_dir)

    mal_df = pd.read_csv(mal_path, usecols=["url", "label"]).dropna()
    mal_df["url"] = mal_df["url"].astype(str).str.strip()
    mal_df["target"] = (mal_df["label"].str.lower() == "bad").astype(int)

    mal_pos = mal_df[mal_df["target"] == 1].sample(n=25000, random_state=RANDOM_STATE)
    mal_neg = mal_df[mal_df["target"] == 0].sample(n=25000, random_state=RANDOM_STATE)

    phi_df = pd.read_csv(phi_path, usecols=["URL", "label"]).dropna()
    phi_df["url"] = phi_df["URL"].astype(str).str.strip()
    phi_df["target"] = (phi_df["label"] == 0).astype(int)
    phi_pos = phi_df[phi_df["target"] == 1].sample(n=5000, random_state=RANDOM_STATE)
    phi_neg = phi_df[phi_df["target"] == 0].sample(n=5000, random_state=RANDOM_STATE)

    combined = pd.concat(
        [
            mal_pos[["url", "target"]],
            mal_neg[["url", "target"]],
            phi_pos[["url", "target"]],
            phi_neg[["url", "target"]],
        ],
        ignore_index=True,
    )
    combined = (
        combined.drop_duplicates(subset=["url"])
        .sample(frac=1.0, random_state=RANDOM_STATE)
        .reset_index(drop=True)
    )

    return (
        combined,
        "Academic Malicious URLs + UCI PhiUSIIL Phishing Corpus",
        "Malicious URLs Benchmark Dataset & UCI Machine Learning Repository (ID 967)",
    )


def build_feature_dataframe(urls: list[str]) -> pd.DataFrame:
    rows = [extract_feature_vector(url) for url in urls]
    df = pd.DataFrame(rows, columns=FEATURE_COLUMNS)
    df["url_body"] = [extract_url_body(url) for url in urls]
    return df


def _make_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            (
                "tfidf",
                TfidfVectorizer(
                    analyzer="char_wb",
                    ngram_range=(3, 5),
                    max_features=2000,
                    sublinear_tf=True,
                ),
                "url_body",
            ),
            ("lexical", StandardScaler(), FEATURE_COLUMNS),
        ],
        sparse_threshold=0.3,
    )


def train_and_evaluate(root_dir: Path | None = None) -> dict[str, Any]:
    ml_root = root_dir or Path(__file__).resolve().parents[1]
    data_dir = ml_root / "data"
    artifacts_dir = ml_root / "artifacts"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    df, dataset_name, dataset_source = load_corpus(data_dir)
    print(f"Building hybrid feature matrix for {len(df)} unique URLs...")
    X = build_feature_dataframe(df["url"].tolist())
    y = df["target"].to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        stratify=y,
        random_state=RANDOM_STATE,
    )

    candidates: dict[str, Pipeline] = {
        "Random Forest": Pipeline(
            [
                ("prep", _make_preprocessor()),
                (
                    "clf",
                    RandomForestClassifier(
                        n_estimators=80,
                        max_depth=22,
                        min_samples_leaf=2,
                        random_state=RANDOM_STATE,
                        n_jobs=-1,
                    ),
                ),
            ]
        ),
        "Extra Trees": Pipeline(
            [
                ("prep", _make_preprocessor()),
                (
                    "clf",
                    ExtraTreesClassifier(
                        n_estimators=80,
                        max_depth=22,
                        min_samples_leaf=2,
                        random_state=RANDOM_STATE,
                        n_jobs=-1,
                    ),
                ),
            ]
        ),
        "Gradient Boosting": Pipeline(
            [
                ("prep", _make_preprocessor()),
                (
                    "clf",
                    GradientBoostingClassifier(
                        n_estimators=80,
                        learning_rate=0.1,
                        max_depth=4,
                        random_state=RANDOM_STATE,
                    ),
                ),
            ]
        ),
        "Logistic Regression": Pipeline(
            [
                ("prep", _make_preprocessor()),
                (
                    "clf",
                    LogisticRegression(max_iter=1000, C=2.0, random_state=RANDOM_STATE),
                ),
            ]
        ),
    }

    trained_models: dict[str, Pipeline] = {}
    metrics_rows: list[dict[str, Any]] = []
    confusion_matrices: dict[str, dict[str, int]] = {}

    for name, model in candidates.items():
        print(f"Training {name}...")
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        auc = float(roc_auc_score(y_test, y_prob))
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

        trained_models[name] = model
        confusion_matrices[name] = {
            "truePositive": int(tp),
            "falsePositive": int(fp),
            "trueNegative": int(tn),
            "falseNegative": int(fn),
        }
        metrics_rows.append(
            {
                "modelName": name,
                "accuracy": round(acc, 4),
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1Score": round(f1, 4),
                "rocAuc": round(auc, 4),
                "isProduction": False,
            }
        )

    best_row = max(metrics_rows, key=lambda r: (r["f1Score"], r["rocAuc"]))
    best_name = best_row["modelName"]
    for row in metrics_rows:
        row["isProduction"] = row["modelName"] == best_name

    best_pipeline = trained_models[best_name]
    clf_step = best_pipeline.named_steps["clf"]
    prep_step: ColumnTransformer = best_pipeline.named_steps["prep"]

    feature_importance: list[dict[str, Any]] = []
    raw_importances = None
    if hasattr(clf_step, "feature_importances_"):
        raw_importances = clf_step.feature_importances_
    elif hasattr(clf_step, "coef_"):
        abs_coef = np.abs(clf_step.coef_[0])
        total_coef = float(np.sum(abs_coef)) or 1.0
        raw_importances = abs_coef / total_coef

    supports_fi = raw_importances is not None
    if raw_importances is not None:
        all_names = prep_step.get_feature_names_out()
        lexical_scores: list[tuple[str, str, float]] = []
        tfidf_total = 0.0
        for feat_name, score in zip(all_names, raw_importances):
            if str(feat_name).startswith("lexical__"):
                raw_col = str(feat_name).removeprefix("lexical__")
                lexical_scores.append(
                    (raw_col, FEATURE_LABELS.get(raw_col, raw_col), float(score))
                )
            else:
                tfidf_total += float(score)

        combined_scores = [
            ("char_ngrams_tfidf", "URL Character N-Gram Patterns", tfidf_total),
            *lexical_scores,
        ]
        combined_scores.sort(key=lambda item: item[2], reverse=True)
        feature_importance = [
            {
                "feature": feat,
                "label": label,
                "importance": round(score, 4),
            }
            for feat, label, score in combined_scores[:12]
        ]

    trained_at = datetime.now(timezone.utc).isoformat()
    report: dict[str, Any] = {
        "dataset": {
            "name": dataset_name,
            "source": dataset_source,
            "totalSamples": int(len(df)),
            "trainingSamples": int(len(X_train)),
            "testingSamples": int(len(X_test)),
            "featureCount": len(FEATURE_COLUMNS),
            "phishingRatio": round(float(np.mean(y)), 4),
        },
        "activeModel": {
            "name": best_name,
            "version": MODEL_VERSION,
            "trainedAt": trained_at,
            "accuracy": best_row["accuracy"],
            "precision": best_row["precision"],
            "recall": best_row["recall"],
            "f1Score": best_row["f1Score"],
        },
        "models": metrics_rows,
        "confusionMatrix": confusion_matrices[best_name],
        "featureImportance": feature_importance,
        "supportsFeatureImportance": supports_fi,
    }

    model_bundle = {
        "model": best_pipeline,
        "model_name": best_name,
        "model_version": MODEL_VERSION,
        "feature_columns": FEATURE_COLUMNS,
        "uses_url_body": True,
        "trained_at": trained_at,
    }

    model_path = artifacts_dir / "phishguard_model.joblib"
    report_path = artifacts_dir / "evaluation_report.json"

    joblib.dump(model_bundle, model_path, compress=3)
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(
        f"Saved model bundle ({best_name}) -> {model_path} "
        f"({model_path.stat().st_size / 1024:.1f} KB)"
    )
    print(f"Saved evaluation report -> {report_path}")
    return report


if __name__ == "__main__":
    summary = train_and_evaluate()
    print(json.dumps(summary["activeModel"], indent=2))
