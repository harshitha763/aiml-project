"""Export routes: download transcripts, notes, and meeting reports as txt or PDF."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.media import MediaAsset
from app.models.transcript import Transcript
from app.models.note import PersonalNote
from app.models.meeting import Meeting
from app.models.summary import Summary
from app.models.action_item import ActionItem
from app.models.user import User
from app.services.export_service import (
    export_transcript_txt, export_notes_txt, export_notes_pdf,
    export_meeting_report_txt, export_meeting_report_pdf,
)
import json

router = APIRouter(prefix="/api/export", tags=["exports"])


def _owned_transcript(transcript_id: str, user: User, db: Session) -> Transcript:
    transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
    if not transcript:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found.")
    asset = db.query(MediaAsset).filter(MediaAsset.id == transcript.media_asset_id).first()
    if not asset or asset.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found.")
    return transcript


def _owned_note(note_id: str, user: User, db: Session) -> PersonalNote:
    note = db.query(PersonalNote).filter(PersonalNote.id == note_id).first()
    if not note or note.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    return note


def _owned_meeting(meeting_id: str, user: User, db: Session) -> Meeting:
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    return meeting


def _build_report_data(db: Session, meeting: Meeting) -> dict:
    summary = db.query(Summary).filter(Summary.meeting_id == meeting.id).first()
    action_items = db.query(ActionItem).filter(ActionItem.meeting_id == meeting.id).all()

    def _list(value: str) -> list[str]:
        if not value:
            return []
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(x) for x in parsed]
        except (json.JSONDecodeError, TypeError):
            pass
        return [line.strip() for line in value.splitlines() if line.strip()]

    if summary:
        executive_summary = summary.summary_text
        main_topics = _list(summary.key_points)
        decisions = _list(summary.decisions)
        unresolved_questions = _list(summary.unresolved_questions)
        next_steps = _list(summary.next_steps)
    else:
        executive_summary = meeting.description or ""
        main_topics, decisions, unresolved_questions, next_steps = [], [], [], []

    return {
        "executive_summary": executive_summary,
        "purpose": meeting.description or "",
        "main_topics": main_topics,
        "decisions": decisions,
        "action_items": [
            {"description": a.description, "owner": a.owner, "due_date": a.due_date.isoformat() if a.due_date else None}
            for a in action_items
        ],
        "responsible_people": sorted({a.owner for a in action_items if a.owner and a.owner != "Unspecified"}),
        "deadlines": [a.due_date.isoformat() for a in action_items if a.due_date],
        "unresolved_questions": unresolved_questions,
        "next_steps": next_steps,
    }


@router.get("/transcript/{transcript_id}")
def export_transcript(
    transcript_id: str,
    format: str = "txt",
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    transcript = _owned_transcript(transcript_id, current_user, db)
    if format != "txt":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only 'txt' format is supported for transcripts.")
    content = export_transcript_txt(transcript)
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=transcript_{transcript_id}.txt"},
    )


@router.get("/notes/{note_id}")
def export_notes(
    note_id: str,
    format: str = "txt",
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    note = _owned_note(note_id, current_user, db)
    if format == "txt":
        content = export_notes_txt(note)
        return Response(
            content=content,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=note_{note_id}.txt"},
        )
    elif format == "pdf":
        content = export_notes_pdf(note)
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=note_{note_id}.pdf"},
        )
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported format. Use 'txt' or 'pdf'.")


@router.get("/meeting-report/{meeting_id}")
def export_meeting_report(
    meeting_id: str,
    format: str = "txt",
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    meeting = _owned_meeting(meeting_id, current_user, db)
    report_data = _build_report_data(db, meeting)
    if format == "txt":
        content = export_meeting_report_txt(meeting, report_data)
        return Response(
            content=content,
            media_type="text/plain",
            headers={"Content-Disposition": f"attachment; filename=meeting_report_{meeting_id}.txt"},
        )
    elif format == "pdf":
        content = export_meeting_report_pdf(meeting, report_data)
        return Response(
            content=content,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=meeting_report_{meeting_id}.pdf"},
        )
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported format. Use 'txt' or 'pdf'.")
