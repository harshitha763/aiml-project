"""Action item schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ActionItemCreate(BaseModel):
    description: str = Field(min_length=1)
    owner: str = "Unspecified"
    due_date: datetime | None = None
    priority: str = "medium"  # low, medium, high


class ActionItemUpdate(BaseModel):
    description: str | None = None
    owner: str | None = None
    due_date: datetime | None = None
    priority: str | None = None
    completed: bool | None = None
    status: str | None = None


class ActionItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str
    description: str
    owner: str
    due_date: datetime | None = None
    priority: str
    status: str
    completed: bool
    created_at: datetime
    updated_at: datetime | None = None
