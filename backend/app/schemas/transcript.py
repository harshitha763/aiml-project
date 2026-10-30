"""Transcript schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class TranscriptSegmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    index: int
    speaker: str
    text: str
    start_time: float
    end_time: float
    confidence: float


class TranscriptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    media_asset_id: str
    full_text: str
    language: str
    duration_seconds: float
    speaker_count: int
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime | None = None
    segments: list[TranscriptSegmentResponse] = []

    @field_validator("is_demo", mode="before")
    @classmethod
    def _coerce_bool(cls, v):
        if isinstance(v, bool):
            return v
        if v is None:
            return False
        return str(v).lower() == "true"


class TranscriptSegmentUpdate(BaseModel):
    text: str | None = None
    speaker: str | None = Field(default=None, max_length=255)


class TranscriptUpdate(BaseModel):
    full_text: str
