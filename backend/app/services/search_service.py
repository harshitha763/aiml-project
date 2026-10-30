"""Search service using SQL LIKE queries across multiple resource types."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.meeting import Meeting
from app.models.lecture import Lecture
from app.models.media import MediaAsset
from app.models.transcript import Transcript, TranscriptSegment
from app.models.note import PersonalNote, Bookmark
from app.models.action_item import ActionItem
from app.models.flashcard import Flashcard
from app.schemas.search import SearchResult

LIKE_LIMIT = 200


def _preview(text: str, query: str, width: int = 160) -> str:
    if not text:
        return ""
    if not query:
        return text[:width]
    idx = text.lower().find(query.lower())
    if idx == -1:
        return text[:width]
    start = max(0, idx - width // 3)
    end = min(len(text), idx + len(query) + width * 2 // 3)
    snippet = text[start:end]
    if start > 0:
        snippet = "…" + snippet
    if end < len(text):
        snippet = snippet + "…"
    return snippet


def search(
    db: Session,
    user_id: str,
    query: str,
    content_type: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> list[SearchResult]:
    """Search across meetings, lectures, transcripts, notes, action items, flashcards."""
    q = f"%{query}%"
    results: list[SearchResult] = []

    if not content_type or content_type == "meeting":
        stmt = db.query(Meeting).filter(Meeting.user_id == user_id)
        if query:
            stmt = stmt.filter(
                or_(Meeting.title.ilike(q), Meeting.description.ilike(q), Meeting.notes.ilike(q))
            )
        if date_from:
            stmt = stmt.filter(Meeting.date >= date_from)
        if date_to:
            stmt = stmt.filter(Meeting.date <= date_to)
        for m in stmt.order_by(Meeting.created_at.desc()).limit(LIKE_LIMIT).all():
            results.append(
                SearchResult(
                    resource_type="meeting",
                    resource_id=m.id,
                    title=m.title,
                    preview=_preview(f"{m.description}\n{m.notes}", query),
                    url=f"/api/meetings/{m.id}",
                    created_at=m.created_at,
                )
            )

    if not content_type or content_type == "lecture":
        stmt = db.query(Lecture).filter(Lecture.user_id == user_id)
        if query:
            stmt = stmt.filter(
                or_(
                    Lecture.title.ilike(q),
                    Lecture.description.ilike(q),
                    Lecture.subject.ilike(q),
                    Lecture.lecturer.ilike(q),
                )
            )
        if date_from:
            stmt = stmt.filter(Lecture.date >= date_from)
        if date_to:
            stmt = stmt.filter(Lecture.date <= date_to)
        for l in stmt.order_by(Lecture.created_at.desc()).limit(LIKE_LIMIT).all():
            results.append(
                SearchResult(
                    resource_type="lecture",
                    resource_id=l.id,
                    title=l.title,
                    preview=_preview(f"{l.description}\n{l.subject}\n{l.lecturer}", query),
                    url=f"/api/lectures/{l.id}",
                    created_at=l.created_at,
                )
            )

    if not content_type or content_type == "transcript":
        seg_stmt = (
            db.query(TranscriptSegment, Transcript)
            .join(Transcript, TranscriptSegment.transcript_id == Transcript.id)
            .join(MediaAsset, Transcript.media_asset_id == MediaAsset.id)
            .filter(MediaAsset.user_id == user_id)
        )
        if query:
            seg_stmt = seg_stmt.filter(TranscriptSegment.text.ilike(q))
        for seg, transcript in seg_stmt.limit(LIKE_LIMIT).all():
            results.append(
                SearchResult(
                    resource_type="transcript",
                    resource_id=transcript.id,
                    title=f"Transcript segment ({seg.speaker})",
                    preview=_preview(seg.text, query),
                    url=f"/api/transcripts/{transcript.id}",
                    created_at=transcript.created_at,
                )
            )

    if not content_type or content_type == "note":
        stmt = db.query(PersonalNote).filter(PersonalNote.user_id == user_id)
        if query:
            stmt = stmt.filter(
                or_(PersonalNote.title.ilike(q), PersonalNote.content.ilike(q))
            )
        for n in stmt.order_by(PersonalNote.created_at.desc()).limit(LIKE_LIMIT).all():
            results.append(
                SearchResult(
                    resource_type="note",
                    resource_id=n.id,
                    title=n.title or "Untitled note",
                    preview=_preview(n.content, query),
                    url=f"/api/notes/{n.id}",
                    created_at=n.created_at,
                )
            )

    if not content_type or content_type == "action_item":
        stmt = db.query(ActionItem).filter(ActionItem.user_id == user_id)
        if query:
            stmt = stmt.filter(
                or_(ActionItem.description.ilike(q), ActionItem.owner.ilike(q))
            )
        for a in stmt.order_by(ActionItem.created_at.desc()).limit(LIKE_LIMIT).all():
            results.append(
                SearchResult(
                    resource_type="action_item",
                    resource_id=a.id,
                    title=a.description[:80],
                    preview=_preview(f"{a.description} — {a.owner}", query),
                    url=f"/api/action-items/{a.id}",
                    created_at=a.created_at,
                )
            )

    if not content_type or content_type == "flashcard":
        stmt = db.query(Flashcard).filter(Flashcard.user_id == user_id)
        if query:
            stmt = stmt.filter(
                or_(Flashcard.front.ilike(q), Flashcard.back.ilike(q), Flashcard.topic.ilike(q))
            )
        for f in stmt.order_by(Flashcard.created_at.desc()).limit(LIKE_LIMIT).all():
            results.append(
                SearchResult(
                    resource_type="flashcard",
                    resource_id=f.id,
                    title=f.front[:80],
                    preview=_preview(f"{f.front}\n{f.back}", query),
                    url=f"/api/flashcards/{f.id}",
                    created_at=f.created_at,
                )
            )

    # Sort by created_at descending when available.
    results.sort(key=lambda r: r.created_at or datetime.min, reverse=True)
    return results
