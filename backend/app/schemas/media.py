"""Media asset schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class MediaAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    file_size: int
    mime_type: str
    media_type: str
    duration_seconds: float
    language: str
    title: str
    description: str
    category: str
    status: str
    status_message: str
    progress: float
    speaker_labels: bool
    created_at: datetime
    updated_at: datetime | None = None


class MediaAssetUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=500)
    description: str | None = None
    category: str | None = Field(default=None, max_length=50)
    language: str | None = Field(default=None, max_length=10)


class UploadResponse(BaseModel):
    id: str
    filename: str
    media_type: str
    file_size: int
    status: str
    message: str = "Upload successful"
