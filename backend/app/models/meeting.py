"""Meeting model."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    date: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    duration_minutes: Mapped[float] = mapped_column(Float, default=0)
    participants: Mapped[str] = mapped_column(Text, default="")  # comma-separated
    location: Mapped[str] = mapped_column(String(500), default="")
    media_asset_id: Mapped[str] = mapped_column(String(36), ForeignKey("media_assets.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="created")  # created, processing, completed
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="meetings")
    media_asset = relationship("MediaAsset", back_populates="meeting")
    summary = relationship("Summary", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    notes_items = relationship("PersonalNote", back_populates="meeting", foreign_keys="PersonalNote.meeting_id")
    bookmarks = relationship("Bookmark", back_populates="meeting", foreign_keys="Bookmark.meeting_id")
    conversations = relationship("AssistantConversation", back_populates="meeting", foreign_keys="AssistantConversation.meeting_id")
