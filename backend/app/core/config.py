"""Application configuration loaded from environment variables."""
import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Application
    SECRET_KEY: str = "dev-secret-key-change-in-production-min-32-chars-ok"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    DEMO_MODE: bool = True
    APP_NAME: str = "IntelliMeet AI"
    APP_VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str = "sqlite:///./intellimeet.db"

    # File upload
    UPLOAD_DIR: str = "./storage/uploads"
    MAX_UPLOAD_SIZE_MB: int = 500

    # AI Providers
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    OPENAI_WHISPER_MODEL: str = "whisper-1"
    OPENAI_BASE_URL: str = ""

    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_DEPLOYMENT: str = ""

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"

    TRANSCRIPTION_PROVIDER: str = ""  # openai_whisper, local, demo

    @property
    def is_ai_configured(self) -> bool:
        """Check if at least one LLM provider is configured."""
        return bool(
            self.OPENAI_API_KEY
            or self.AZURE_OPENAI_API_KEY
            or self.GROQ_API_KEY
            or self.ANTHROPIC_API_KEY
        )

    @property
    def is_transcription_configured(self) -> bool:
        """Check if a transcription provider is configured."""
        return bool(
            (self.TRANSCRIPTION_PROVIDER and self.TRANSCRIPTION_PROVIDER != "demo")
            and self.OPENAI_API_KEY
        )

    @property
    def upload_path(self) -> Path:
        p = Path(self.UPLOAD_DIR)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024


settings = Settings()
