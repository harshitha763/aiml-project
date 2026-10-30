"""Calendar event schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class CalendarEventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = ""
    event_type: str = "meeting"  # meeting, study_session, deadline, revision
    start_time: datetime
    end_time: datetime | None = None
    location: str = ""
    related_meeting_id: str | None = None
    related_lecture_id: str | None = None
    reminder_minutes: int = 15


class CalendarEventUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    description: str | None = None
    event_type: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    location: str | None = None
    reminder_minutes: int | None = None


class CalendarEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    description: str
    event_type: str
    start_time: datetime
    end_time: datetime | None = None
    location: str
    related_meeting_id: str | None = None
    related_lecture_id: str | None = None
    reminder_minutes: int = 15
    created_at: datetime

    @field_validator("reminder_minutes", mode="before")
    @classmethod
    def _coerce_reminder(cls, v):
        if v is None or v == "":
            return 15
        try:
            return int(v)
        except (TypeError, ValueError):
            return 15
