"""AssistantConversation and AssistantMessage models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class AssistantConversation(Base):
    __tablename__ = "assistant_conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), default="New Conversation")
    meeting_id: Mapped[str] = mapped_column(String(36), ForeignKey("meetings.id", ondelete="CASCADE"), nullable=True, index=True)
    lecture_id: Mapped[str] = mapped_column(String(36), ForeignKey("lectures.id", ondelete="CASCADE"), nullable=True, index=True)
    resource_type: Mapped[str] = mapped_column(String(50), default="meeting")  # meeting, lecture
    resource_id: Mapped[str] = mapped_column(String(36), nullable=True)
    is_demo: Mapped[bool] = mapped_column(String(10), default="false")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="conversations")
    meeting = relationship("Meeting", back_populates="conversations", foreign_keys=[meeting_id])
    lecture = relationship("Lecture", back_populates="conversations", foreign_keys=[lecture_id])
    messages = relationship("AssistantMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="AssistantMessage.created_at")


class AssistantMessage(Base):
    __tablename__ = "assistant_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("assistant_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # user, assistant
    content: Mapped[str] = mapped_column(Text, default="")
    references_json: Mapped[str] = mapped_column(Text, default="[]")  # JSON of source references
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    conversation = relationship("AssistantConversation", back_populates="messages")
