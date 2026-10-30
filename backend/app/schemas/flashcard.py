"""Flashcard schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Literal


class FlashcardCreate(BaseModel):
    front: str = Field(min_length=1)
    back: str = Field(min_length=1)
    topic: str = ""
    difficulty: str = "medium"  # easy, medium, difficult
    lecture_id: str | None = None


class FlashcardUpdate(BaseModel):
    front: str | None = None
    back: str | None = None
    topic: str | None = None
    difficulty: str | None = None


class FlashcardResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    lecture_id: str | None = None
    front: str
    back: str
    topic: str
    difficulty: str
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_date: datetime
    last_reviewed: datetime | None = None
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime | None = None

    @field_validator("is_demo", mode="before")
    @classmethod
    def _coerce_bool(cls, v):
        if isinstance(v, bool):
            return v
        if v is None:
            return False
        return str(v).lower() == "true"


class FlashcardReviewRequest(BaseModel):
    rating: Literal["easy", "medium", "difficult"]
