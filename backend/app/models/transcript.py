"""Transcript and TranscriptSegment models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Float, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Transcript(Base):
    __tablename__ = "transcripts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    media_asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("media_assets.id", ondelete="CASCADE"), nullable=False, index=True)
    full_text: Mapped[str] = mapped_column(Text, default="")
    language: Mapped[str] = mapped_column(String(10), default="en")
    duration_seconds: Mapped[float] = mapped_column(Float, default=0)
    speaker_count: Mapped[int] = mapped_column(Integer, default=0)
    is_demo: Mapped[bool] = mapped_column(String(10), default="false")  # stored as string to avoid SQLite bool issues
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    media_asset = relationship("MediaAsset", back_populates="transcript")
    segments = relationship("TranscriptSegment", back_populates="transcript", cascade="all, delete-orphan", order_by="TranscriptSegment.start_time")


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transcript_id: Mapped[str] = mapped_column(String(36), ForeignKey("transcripts.id", ondelete="CASCADE"), nullable=False, index=True)
    index: Mapped[int] = mapped_column(Integer, default=0)
    speaker: Mapped[str] = mapped_column(String(255), default="Speaker")
    text: Mapped[str] = mapped_column(Text, default="")
    start_time: Mapped[float] = mapped_column(Float, default=0)
    end_time: Mapped[float] = mapped_column(Float, default=0)
    confidence: Mapped[float] = mapped_column(Float, default=0)

    transcript = relationship("Transcript", back_populates="segments")
