"""Analytics service: aggregate stats from actual DB records."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.lecture import Lecture
from app.models.summary import Summary
from app.models.action_item import ActionItem
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz, QuizAttempt
from app.models.note import PersonalNote, Bookmark
from app.models.media import MediaAsset


def get_dashboard_stats(db: Session, user_id: str) -> dict[str, Any]:
    """Aggregate dashboard stats from actual DB records for the user."""
    now = datetime.now(timezone.utc)

    meeting_count = db.query(func.count(Meeting.id)).filter(Meeting.user_id == user_id).scalar() or 0
    lecture_count = db.query(func.count(Lecture.id)).filter(Lecture.user_id == user_id).scalar() or 0
    total_duration = (
        db.query(func.coalesce(func.sum(Meeting.duration_minutes), 0)).filter(Meeting.user_id == user_id).scalar() or 0
    )
    total_lecture_duration = (
        db.query(func.coalesce(func.sum(Lecture.duration_minutes), 0)).filter(Lecture.user_id == user_id).scalar() or 0
    )
    summaries_generated = (
        db.query(func.count(Summary.id))
        .filter((Summary.meeting_id.isnot(None)) | (Summary.lecture_id.isnot(None)))
        .scalar()
    )
    # Recompute summaries owned by this user via joins.
    summaries_generated = (
        db.query(func.count(Summary.id))
        .join(Meeting, Summary.meeting_id == Meeting.id, isouter=True)
        .join(Lecture, Summary.lecture_id == Lecture.id, isouter=True)
        .filter((Meeting.user_id == user_id) | (Lecture.user_id == user_id))
        .scalar()
        or 0
    )

    pending_tasks = (
        db.query(func.count(ActionItem.id))
        .filter(ActionItem.user_id == user_id, ActionItem.completed == False)  # noqa: E712
        .scalar()
        or 0
    )
    completed_tasks = (
        db.query(func.count(ActionItem.id))
        .filter(ActionItem.user_id == user_id, ActionItem.completed == True)  # noqa: E712
        .scalar()
        or 0
    )

    flashcards_created = (
        db.query(func.count(Flashcard.id)).filter(Flashcard.user_id == user_id).scalar() or 0
    )
    due_flashcards = (
        db.query(func.count(Flashcard.id))
        .filter(Flashcard.user_id == user_id, Flashcard.next_review_date <= now)
        .scalar()
        or 0
    )

    quiz_ids_subq = db.query(Quiz.id).filter(Quiz.user_id == user_id)
    quizzes_taken = (
        db.query(func.count(QuizAttempt.id))
        .filter(QuizAttempt.quiz_id.in_(quiz_ids_subq))
        .scalar()
        or 0
    )
    avg_quiz_score = (
        db.query(func.coalesce(func.avg(QuizAttempt.score), 0.0))
        .filter(QuizAttempt.quiz_id.in_(quiz_ids_subq))
        .scalar()
        or 0.0
    )
    media_assets = db.query(func.count(MediaAsset.id)).filter(MediaAsset.user_id == user_id).scalar() or 0

    recent_activity = _recent_activity(db, user_id, limit=10)

    return {
        "meeting_count": int(meeting_count),
        "lecture_count": int(lecture_count),
        "total_duration_minutes": float(total_duration) + float(total_lecture_duration),
        "summaries_generated": int(summaries_generated),
        "pending_tasks": int(pending_tasks),
        "completed_tasks": int(completed_tasks),
        "flashcards_created": int(flashcards_created),
        "quizzes_taken": int(quizzes_taken),
        "avg_quiz_score": float(avg_quiz_score or 0),
        "due_flashcards": int(due_flashcards),
        "media_assets": int(media_assets),
        "recent_activity": recent_activity,
    }


def get_analytics(
    db: Session,
    user_id: str,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> dict[str, Any]:
    """Detailed analytics computed from actual data, optionally filtered by date."""
    dash = get_dashboard_stats(db, user_id)

    notes_count = db.query(func.count(PersonalNote.id)).filter(PersonalNote.user_id == user_id).scalar() or 0
    bookmarks_count = db.query(func.count(Bookmark.id)).filter(Bookmark.user_id == user_id).scalar() or 0
    quiz_ids_subq = db.query(Quiz.id).filter(Quiz.user_id == user_id)
    quiz_attempts = (
        db.query(func.count(QuizAttempt.id))
        .filter(QuizAttempt.quiz_id.in_(quiz_ids_subq))
        .scalar()
        or 0
    )
    avg_quiz_score = (
        db.query(func.coalesce(func.avg(QuizAttempt.score), 0.0))
        .filter(QuizAttempt.quiz_id.in_(quiz_ids_subq))
        .scalar()
        or 0.0
    )

    topics = _topic_breakdown(db, user_id)

    return {
        "meeting_count": dash["meeting_count"],
        "lecture_count": dash["lecture_count"],
        "total_duration_minutes": dash["total_duration_minutes"],
        "summaries_generated": dash["summaries_generated"],
        "pending_tasks": dash["pending_tasks"],
        "completed_tasks": dash["completed_tasks"],
        "flashcards_created": dash["flashcards_created"],
        "quizzes_taken": dash["quizzes_taken"],
        "quiz_attempts": int(quiz_attempts),
        "avg_quiz_score": float(avg_quiz_score or 0),
        "media_assets": dash["media_assets"],
        "notes_count": int(notes_count),
        "bookmarks_count": int(bookmarks_count),
        "recent_activity": dash["recent_activity"],
        "topics": topics,
    }


def _recent_activity(db: Session, user_id: str, limit: int = 10) -> list[dict[str, Any]]:
    activity: list[dict[str, Any]] = []

    for m in (
        db.query(Meeting)
        .filter(Meeting.user_id == user_id)
        .order_by(Meeting.created_at.desc())
        .limit(5)
        .all()
    ):
        activity.append(
            {
                "type": "meeting",
                "id": m.id,
                "title": m.title,
                "timestamp": m.created_at.isoformat() if m.created_at else None,
            }
        )
    for l in (
        db.query(Lecture)
        .filter(Lecture.user_id == user_id)
        .order_by(Lecture.created_at.desc())
        .limit(5)
        .all()
    ):
        activity.append(
            {
                "type": "lecture",
                "id": l.id,
                "title": l.title,
                "timestamp": l.created_at.isoformat() if l.created_at else None,
            }
        )

    activity.sort(key=lambda a: a.get("timestamp") or "", reverse=True)
    return activity[:limit]


def _topic_breakdown(db: Session, user_id: str) -> list[dict[str, Any]]:
    """Aggregate flashcard topics as a simple topic breakdown."""
    rows = (
        db.query(Flashcard.topic, func.count(Flashcard.id))
        .filter(Flashcard.user_id == user_id)
        .group_by(Flashcard.topic)
        .all()
    )
    topics: list[dict[str, Any]] = []
    for topic, count in rows:
        topics.append({"topic": topic or "General", "count": int(count or 0)})
    # Also include lecture subjects.
    subject_rows = (
        db.query(Lecture.subject, func.count(Lecture.id))
        .filter(Lecture.user_id == user_id)
        .group_by(Lecture.subject)
        .all()
    )
    for subject, count in subject_rows:
        topics.append({"topic": subject or "General", "count": int(count or 0), "kind": "lecture"})
    return topics
