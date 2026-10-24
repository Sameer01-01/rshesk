"""Application configuration settings."""

from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Wind Forecast Monitor"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["*"]
    DEFAULT_CUTOFF_HOUR: int = 9
    DATA_DIR: Path = Path(__file__).resolve().parent.parent / "data"
    FRONTEND_DIR: Path = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

    # Evaluation bounds: strictly January 2026
    JAN_START_UTC: str = "2026-01-01T00:00:00Z"
    JAN_END_UTC: str = "2026-01-31T23:59:59Z"


settings = Settings()
