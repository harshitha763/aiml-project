"""Meeting schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.action_item import ActionItemResponse


class MeetingCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = ""
    date: datetime | None = None
    duration_minutes: float = 0
    participants: str = ""
    location: str = ""
    notes: str = ""
    media_asset_id: str | None = None


class MeetingUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    description: str | None = None
    date: datetime | None = None
    duration_minutes: float | None = None
    participants: str | None = None
    location: str | None = None
    notes: str | None = None
    status: str | None = None


class MeetingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    date: datetime
    duration_minutes: float
    participants: str
    location: str
    status: str
    notes: str
    media_asset_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    # Computed extras
    has_summary: bool = False
    action_item_count: int = 0
    media_filename: str | None = None


class MeetingReport(BaseModel):
    meeting_id: str
    title: str
    date: datetime
    duration_minutes: float
    participants: str
    executive_summary: str
    purpose: str
    main_topics: list[str]
    decisions: list[str]
    action_items: list[ActionItemResponse]
    responsible_people: list[str]
    deadlines: list[str]
    unresolved_questions: list[str]
    next_steps: list[str]


class FollowUpDraftResponse(BaseModel):
    subject: str
    body: str
    is_demo: bool = False
