"""Search schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SearchResult(BaseModel):
    resource_type: str
    resource_id: str
    title: str
    preview: str
    url: str = ""
    created_at: datetime | None = None


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
    page: int = 1
    per_page: int = 20
    pages: int = 1
