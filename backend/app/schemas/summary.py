"""Summary schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class GenerateSummaryRequest(BaseModel):
    length: str = "medium"  # short, medium, long
    style: str = "structured"  # structured, narrative, bullets


class SummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    meeting_id: str | None = None
    lecture_id: str | None = None
    summary_text: str
    key_points: str
    decisions: str
    unresolved_questions: str
    risks: str
    next_steps: str
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime | None = None
