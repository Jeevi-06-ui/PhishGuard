"""PhishGuard FastAPI application entrypoint."""

from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import get_settings
from backend.app.database import DatabaseManager
from backend.app.routers.api import create_api_router
from backend.app.services.blockchain_service import BlockchainService
from backend.app.services.ml_service import MlInferenceService


def create_app(
    *,
    db_path: str | None = None,
    ml_artifacts_dir: str | None = None,
    blockchain_service: BlockchainService | None = None,
) -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="PhishGuard API",
        description="Intelligent Phishing URL Detection Using Machine Learning and Blockchain",
        version="1.0.0",
    )

    allow_origin_regex = (
        r"https://.*\.vercel\.app" if settings.cors_allow_vercel_previews else None
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_origin_regex=allow_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    db = DatabaseManager(db_path=db_path)
    ml_service = MlInferenceService(artifacts_dir=ml_artifacts_dir)
    bc_service = blockchain_service or BlockchainService()

    app.include_router(create_api_router(db, ml_service, bc_service))

    @app.get("/")
    def root():
        return {
            "service": "PhishGuard API",
            "status": "running",
            "docs": "/docs",
            "health": "/api/v1/health",
        }

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", get_settings().fastapi_port))
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=port, reload=False)
