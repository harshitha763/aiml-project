"""Flashcard and FlashcardReview models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    lecture_id: Mapped[str] = mapped_column(String(36), ForeignKey("lectures.id", ondelete="CASCADE"), nullable=True, index=True)
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    topic: Mapped[str] = mapped_column(String(255), default="")
    difficulty: Mapped[str] = mapped_column(String(50), default="medium")  # easy, medium, difficult
    # SM-2 spaced repetition fields
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5)
    interval_days: Mapped[int] = mapped_column(Integer, default=0)
    repetitions: Mapped[int] = mapped_column(Integer, default=0)
    next_review_date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_reviewed: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    is_demo: Mapped[bool] = mapped_column(String(10), default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="flashcards")
    lecture = relationship("Lecture", back_populates="flashcards")
    reviews = relationship("FlashcardReview", back_populates="flashcard", cascade="all, delete-orphan")


class FlashcardReview(Base):
    __tablename__ = "flashcard_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    flashcard_id: Mapped[str] = mapped_column(String(36), ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False, index=True)
    rating: Mapped[str] = mapped_column(String(50), default="medium")  # easy, medium, difficult (SM-2 quality 5, 3, 1)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    flashcard = relationship("Flashcard", back_populates="reviews")
