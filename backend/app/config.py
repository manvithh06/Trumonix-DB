from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://trumonix:trumonix123@localhost:5432/trumonix_db"

    # Security
    SECRET_KEY: str = "trumonix-super-secret-key-change-in-production-2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # App
    APP_NAME: str = "TruMonix"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Risk thresholds
    RISK_BLOCK_THRESHOLD: float = 70.0
    RISK_FLAG_THRESHOLD: float = 30.0

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
