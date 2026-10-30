"""MediaAsset model for uploaded audio/video/files."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Integer, Float, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    mime_type: Mapped[str] = mapped_column(String(255), default="")
    media_type: Mapped[str] = mapped_column(String(50), default="audio")  # audio, video, document
    duration_seconds: Mapped[float] = mapped_column(Float, default=0)
    language: Mapped[str] = mapped_column(String(10), default="en")
    title: Mapped[str] = mapped_column(String(500), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(50), default="meeting")  # meeting, lecture, document
    status: Mapped[str] = mapped_column(String(50), default="uploaded")
    # uploaded, queued, transcribing, analyzing, completed, failed
    status_message: Mapped[str] = mapped_column(Text, default="")
    progress: Mapped[float] = mapped_column(Float, default=0)
    speaker_labels: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="media_assets")
    transcript = relationship("Transcript", back_populates="media_asset", uselist=False, cascade="all, delete-orphan")
    meeting = relationship("Meeting", back_populates="media_asset", uselist=False)
    lecture = relationship("Lecture", back_populates="media_asset", uselist=False)
