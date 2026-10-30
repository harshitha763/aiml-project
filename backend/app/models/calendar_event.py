"""CalendarEvent model."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    event_type: Mapped[str] = mapped_column(String(50), default="meeting")  # meeting, study_session, deadline, revision
    start_time: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    location: Mapped[str] = mapped_column(String(500), default="")
    related_meeting_id: Mapped[str] = mapped_column(String(36), nullable=True)
    related_lecture_id: Mapped[str] = mapped_column(String(36), nullable=True)
    reminder_minutes: Mapped[int] = mapped_column(String(10), default="15")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="calendar_events")
