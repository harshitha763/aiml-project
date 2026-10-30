"""Analytics schemas."""
from pydantic import BaseModel
from typing import Any


class DashboardStats(BaseModel):
    meeting_count: int = 0
    lecture_count: int = 0
    total_duration_minutes: float = 0
    summaries_generated: int = 0
    pending_tasks: int = 0
    completed_tasks: int = 0
    flashcards_created: int = 0
    quizzes_taken: int = 0
    avg_quiz_score: float = 0
    due_flashcards: int = 0
    media_assets: int = 0
    recent_activity: list[dict[str, Any]] = []


class AnalyticsResponse(BaseModel):
    meeting_count: int = 0
    lecture_count: int = 0
    total_duration_minutes: float = 0
    summaries_generated: int = 0
    pending_tasks: int = 0
    completed_tasks: int = 0
    flashcards_created: int = 0
    quizzes_taken: int = 0
    quiz_attempts: int = 0
    avg_quiz_score: float = 0
    media_assets: int = 0
    notes_count: int = 0
    bookmarks_count: int = 0
    recent_activity: list[dict[str, Any]] = []
    topics: list[dict[str, Any]] = []
