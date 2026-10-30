"""Note and bookmark schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class NoteCreate(BaseModel):
    title: str = Field(default="", max_length=500)
    content: str = ""
    note_type: str = "general"  # general, revision, key_terms, checklist
    meeting_id: str | None = None
    lecture_id: str | None = None


class NoteUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    content: str | None = None
    note_type: str | None = None


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    meeting_id: str | None = None
    lecture_id: str | None = None
    title: str
    content: str
    note_type: str
    created_at: datetime
    updated_at: datetime | None = None


class GenerateNotesRequest(BaseModel):
    level: str = "intermediate"  # beginner, intermediate, advanced
    note_format: str = "detailed"  # short, detailed, bullet, qa


class BookmarkCreate(BaseModel):
    meeting_id: str | None = None
    lecture_id: str | None = None
    media_asset_id: str | None = None
    label: str = ""
    note: str = ""
    timestamp: float = 0


class BookmarkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    meeting_id: str | None = None
    lecture_id: str | None = None
    media_asset_id: str | None = None
    label: str
    note: str
    timestamp: float
    created_at: datetime
