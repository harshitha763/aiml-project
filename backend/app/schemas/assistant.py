"""Assistant schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Any


class AssistantAskRequest(BaseModel):
    resource_type: str = "meeting"  # meeting, lecture
    resource_id: str
    question: str = Field(min_length=1)
    conversation_id: str | None = None


class AssistantAskResponse(BaseModel):
    answer: str
    references: list[dict[str, Any]] = []
    conversation_id: str
    message_id: str
    is_demo: bool = False


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    references_json: str = "[]"
    created_at: datetime


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    meeting_id: str | None = None
    lecture_id: str | None = None
    resource_type: str
    resource_id: str | None = None
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime | None = None
    messages: list[MessageResponse] = []

    @field_validator("is_demo", mode="before")
    @classmethod
    def _coerce_bool(cls, v):
        if isinstance(v, bool):
            return v
        if v is None:
            return False
        return str(v).lower() == "true"
