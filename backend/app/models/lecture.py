"""Lecture model."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Lecture(Base):
    __tablename__ = "lectures"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    subject: Mapped[str] = mapped_column(String(255), default="")
    lecturer: Mapped[str] = mapped_column(String(255), default="")
    date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    duration_minutes: Mapped[float] = mapped_column(Float, default=0)
    media_asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("media_assets.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="created")
    explanation_level: Mapped[str] = mapped_column(String(50), default="intermediate")  # beginner, intermediate, advanced
    revision_status: Mapped[str] = mapped_column(String(50), default="not_started")  # not_started, in_progress, reviewed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="lectures")
    media_asset = relationship("MediaAsset", back_populates="lecture")
    summary = relationship("Summary", back_populates="lecture", uselist=False, cascade="all, delete-orphan")
    notes_items = relationship("PersonalNote", back_populates="lecture", foreign_keys="PersonalNote.lecture_id")
    bookmarks = relationship("Bookmark", back_populates="lecture", foreign_keys="Bookmark.lecture_id")
    flashcards = relationship("Flashcard", back_populates="lecture", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="lecture", cascade="all, delete-orphan")
    conversations = relationship("AssistantConversation", back_populates="lecture", foreign_keys="AssistantConversation.lecture_id")
