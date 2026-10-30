"""User settings schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserSettingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    theme: str
    language: str
    default_transcription_language: str
    default_summary_length: str
    preferred_note_format: str
    default_explanation_level: str
    created_at: datetime
    updated_at: datetime | None = None


class UserSettingUpdate(BaseModel):
    theme: str | None = None  # light, dark
    language: str | None = None
    default_transcription_language: str | None = None
    default_summary_length: str | None = None  # short, medium, long
    preferred_note_format: str | None = None  # short, detailed, bullet, qa
    default_explanation_level: str | None = None
