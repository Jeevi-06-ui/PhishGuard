"""Download and cache the academic URL phishing corpora into ml/data/."""

from __future__ import annotations

import io
import zipfile
from pathlib import Path

import requests

UCI_PHIUSIIL_ZIP_URL = (
    "https://archive.ics.uci.edu/static/public/967/phiusiil+phishing+url+dataset.zip"
)
MALICIOUS_URLS_CSV_URL = (
    "https://raw.githubusercontent.com/faizann24/Using-machine-learning-to-detect-malicious-URLs/master/data/data.csv"
)


def download_datasets(data_dir: Path) -> tuple[Path, Path]:
    data_dir.mkdir(parents=True, exist_ok=True)
    phiusiil_path = data_dir / "phiusiil_raw.csv"
    malicious_path = data_dir / "malicious_urls_raw.csv"

    if not phiusiil_path.exists():
        print(f"Downloading UCI PhiUSIIL dataset from {UCI_PHIUSIIL_ZIP_URL} ...")
        r = requests.get(UCI_PHIUSIIL_ZIP_URL, timeout=60)
        r.raise_for_status()
        with zipfile.ZipFile(io.BytesIO(r.content)) as archive:
            csv_candidates = [n for n in archive.namelist() if n.lower().endswith(".csv")]
            if not csv_candidates:
                raise RuntimeError("No CSV found inside UCI PhiUSIIL zip archive.")
            with archive.open(csv_candidates[0]) as src, phiusiil_path.open("wb") as out:
                out.write(src.read())

    if not malicious_path.exists():
        print(f"Downloading Malicious URLs corpus from {MALICIOUS_URLS_CSV_URL} ...")
        r2 = requests.get(MALICIOUS_URLS_CSV_URL, timeout=60)
        r2.raise_for_status()
        malicious_path.write_bytes(r2.content)

    return phiusiil_path, malicious_path


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1]
    download_datasets(root / "data")
