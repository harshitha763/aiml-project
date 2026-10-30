"""Retrieval service: text-based retrieval of relevant context for the assistant.

Uses keyword matching against transcript segments and notes rather than
vector search, returning relevant text segments with timestamps/references.
"""
from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.transcript import Transcript, TranscriptSegment
from app.models.note import PersonalNote
from app.models.media import MediaAsset


def _tokenize(text: str) -> set[str]:
    """Return a lowercased set of meaningful tokens from text."""
    if not text:
        return set()
    cleaned = "".join(c if c.isalnum() or c.isspace() else " " for c in text.lower())
    return {tok for tok in cleaned.split() if len(tok) > 2}


def _score_segment(text: str, question_tokens: set[str]) -> int:
    seg_tokens = _tokenize(text)
    if not seg_tokens:
        return 0
    return len(question_tokens & seg_tokens)


def retrieve_context(
    db: Session,
    resource_type: str,
    resource_id: str,
    question: str,
    max_segments: int = 6,
) -> dict[str, Any]:
    """Retrieve relevant text segments from transcript/notes for a resource.

    Returns a dict with:
        - context: concatenated relevant text
        - references: list of {source, preview, timestamp}
    """
    question_tokens = _tokenize(question)
    references: list[dict[str, Any]] = []
    context_chunks: list[str] = []

    # Gather transcript segments belonging to the resource.
    media_asset = None
    if resource_type == "meeting":
        from app.models.meeting import Meeting

        meeting = db.query(Meeting).filter(Meeting.id == resource_id).first()
        if meeting and meeting.media_asset_id:
            media_asset = db.query(MediaAsset).filter(MediaAsset.id == meeting.media_asset_id).first()
    elif resource_type == "lecture":
        from app.models.lecture import Lecture

        lecture = db.query(Lecture).filter(Lecture.id == resource_id).first()
        if lecture and lecture.media_asset_id:
            media_asset = db.query(MediaAsset).filter(MediaAsset.id == lecture.media_asset_id).first()

    if media_asset and media_asset.transcript:
        transcript = media_asset.transcript
        segments = (
            db.query(TranscriptSegment)
            .filter(TranscriptSegment.transcript_id == transcript.id)
            .order_by(TranscriptSegment.start_time)
            .all()
        )
        scored = [
            (seg, _score_segment(seg.text, question_tokens)) for seg in segments
        ]
        # Keep top-scoring segments but preserve chronological order.
        scored.sort(key=lambda x: x[1], reverse=True)
        top = [s for s, sc in scored[:max_segments] if sc > 0]
        top.sort(key=lambda s: s.start_time)
        if not top and segments:
            # If no keyword matches, fall back to a few representative segments.
            top = segments[:max_segments]
        for seg in top:
            preview = seg.text.strip()
            context_chunks.append(f"[{_fmt(seg.start_time)} - {_fmt(seg.end_time)}] {seg.speaker}: {preview}")
            references.append(
                {
                    "source": "transcript",
                    "preview": preview[:200],
                    "timestamp": seg.start_time,
                    "speaker": seg.speaker,
                }
            )

    # Gather notes for the resource (user-owned only handled by caller via resource lookup).
    notes_q = db.query(PersonalNote)
    if resource_type == "meeting":
        notes_q = notes_q.filter(PersonalNote.meeting_id == resource_id)
    elif resource_type == "lecture":
        notes_q = notes_q.filter(PersonalNote.lecture_id == resource_id)

    for note in notes_q.limit(20).all():
        if not note.content and not note.title:
            continue
        text = f"{note.title}\n{note.content}".strip()
        if _score_segment(text, question_tokens) > 0 or not context_chunks:
            context_chunks.append(f"Note ({note.title or 'untitled'}): {text}")
            references.append(
                {
                    "source": "note",
                    "preview": text[:200],
                    "timestamp": 0,
                    "title": note.title or "Untitled note",
                }
            )

    context = "\n\n".join(context_chunks)
    return {"context": context, "references": references}


def _fmt(seconds: float) -> str:
    seconds = float(seconds or 0)
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"
