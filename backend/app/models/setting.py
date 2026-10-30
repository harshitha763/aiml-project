"""UserSetting model."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UserSetting(Base):
    __tablename__ = "user_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    theme: Mapped[str] = mapped_column(String(50), default="dark")  # light, dark
    language: Mapped[str] = mapped_column(String(10), default="en")
    default_transcription_language: Mapped[str] = mapped_column(String(10), default="en")
    default_summary_length: Mapped[str] = mapped_column(String(50), default="medium")  # short, medium, long
    preferred_note_format: Mapped[str] = mapped_column(String(50), default="detailed")  # short, detailed, bullet, qa
    default_explanation_level: Mapped[str] = mapped_column(String(50), default="intermediate")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="settings")
