# Machine Learning Pipeline (Phase 2)

This directory will house dataset preparation, URL feature extraction, Scikit-learn model training, evaluation benchmarks, and serialized Joblib artifacts.

Planned layout:
- `data/` — Raw and preprocessed URL phishing datasets
- `src/features.py` — Deterministic lexical and structural feature extractor
- `src/train.py` — Model comparison (Random Forest, Gradient Boosting, Logistic Regression, etc.)
- `artifacts/` — Exported `.joblib` models and `evaluation_report.json`
