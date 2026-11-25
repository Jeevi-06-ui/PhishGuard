"""Backend configuration using Pydantic Settings."""

from __future__ import annotations

from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_ROOT = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    fastapi_host: str = "0.0.0.0"
    fastapi_port: int = 8000
    database_path: str = str(BACKEND_ROOT / "phishguard.db")
    ml_artifacts_dir: str = str(REPO_ROOT / "ml" / "artifacts")
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    cors_allow_vercel_previews: bool = True

    eth_rpc_url: str = "http://127.0.0.1:8545"
    eth_network_name: str = "Hardhat Localhost"
    chain_id: int = 31337
    phishguard_contract_address: str = ""
    deployer_private_key: str = ""
    contract_artifact_path: str = str(BACKEND_ROOT / "app" / "contracts" / "PhishGuardRegistry.json")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
