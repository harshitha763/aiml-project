"""Lecture schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class LectureCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = ""
    subject: str = ""
    lecturer: str = ""
    date: datetime | None = None
    duration_minutes: float = 0
    media_asset_id: str | None = None
    explanation_level: str = "intermediate"


class LectureUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    description: str | None = None
    subject: str | None = None
    lecturer: str | None = None
    date: datetime | None = None
    duration_minutes: float | None = None
    explanation_level: str | None = None
    revision_status: str | None = None
    status: str | None = None


class LectureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    description: str
    subject: str
    lecturer: str
    date: datetime
    duration_minutes: float
    media_asset_id: str | None = None
    status: str
    explanation_level: str
    revision_status: str
    created_at: datetime
    updated_at: datetime | None = None

    has_summary: bool = False
    media_filename: str | None = None
