"""Common shared schemas."""
from datetime import datetime
from typing import Generic, TypeVar
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ErrorResponse(BaseModel):
    detail: str


class SuccessResponse(BaseModel):
    message: str


class PaginatedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    items: list[T]
    total: int
    page: int = 1
    per_page: int = 20
    pages: int = 1


class TimestampMixin(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime
    updated_at: datetime | None = None
