"""Meeting routes: CRUD, summaries, action items, notes, bookmarks, reports, follow-up."""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.meeting import Meeting
from app.models.media import MediaAsset
from app.models.summary import Summary
from app.models.action_item import ActionItem
from app.models.note import PersonalNote, Bookmark
from app.models.user import User
from app.schemas.meeting import (
    MeetingCreate, MeetingUpdate, MeetingResponse, MeetingReport,
    FollowUpDraftResponse,
)
from app.schemas.summary import GenerateSummaryRequest, SummaryResponse
from app.schemas.action_item import (
    ActionItemCreate, ActionItemUpdate, ActionItemResponse,
)
from app.schemas.note import NoteCreate, NoteResponse, BookmarkCreate, BookmarkResponse
from app.schemas.common import SuccessResponse
from app.services.ai_service import get_ai_provider
from app.services.retrieval_service import retrieve_context
from app.api.common import paginate

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def _to_response(db: Session, m: Meeting) -> MeetingResponse:
    summary_exists = db.query(Summary).filter(Summary.meeting_id == m.id).first() is not None
    action_count = db.query(ActionItem).filter(ActionItem.meeting_id == m.id).count()
    media_filename = None
    if m.media_asset_id:
        ma = db.query(MediaAsset).filter(MediaAsset.id == m.media_asset_id).first()
        if ma:
            media_filename = ma.filename
    data = MeetingResponse.model_validate(m)
    data.has_summary = summary_exists
    data.action_item_count = action_count
    data.media_filename = media_filename
    return data


def _get_owned_meeting(meeting_id: str, user: User, db: Session) -> Meeting:
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting or meeting.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
    return meeting


@router.get("/")
def list_meetings(
    page: int = 1,
    per_page: int = 20,
    status_filter: str | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Meeting).filter(Meeting.user_id == current_user.id)
    if status_filter:
        q = q.filter(Meeting.status == status_filter)
    total = q.count()
    items = (
        q.order_by(Meeting.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return paginate([_to_response(db, m) for m in items], total, page, per_page)


@router.post("/", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    payload: MeetingCreate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    if payload.media_asset_id:
        asset = db.query(MediaAsset).filter(MediaAsset.id == payload.media_asset_id).first()
        if not asset or asset.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid media asset.")
    meeting = Meeting(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        date=payload.date or datetime.now(timezone.utc),
        duration_minutes=payload.duration_minutes,
        participants=payload.participants,
        location=payload.location,
        notes=payload.notes,
        media_asset_id=payload.media_asset_id,
        status="created",
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return _to_response(db, meeting)


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    meeting = _get_owned_meeting(meeting_id, current_user, db)
    return _to_response(db, meeting)


@router.put("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: str,
    payload: MeetingUpdate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    meeting = _get_owned_meeting(meeting_id, current_user, db)
    for field in ("title", "description", "date", "duration_minutes", "participants",
                  "location", "notes", "status"):
        value = getattr(payload, field, None)
        if value is not None:
            setattr(meeting, field, value)
    db.commit()
    db.refresh(meeting)
    return _to_response(db, meeting)


@router.delete("/{meeting_id}", status_code=status.HTTP_200_OK)
def delete_meeting(
    meeting_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    meeting = _get_owned_meeting(meeting_id, current_user, db)
    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted."}


# --------------------------------------------------------------------------- #
# Summary
# --------------------------------------------------------------------------- #
def _meeting_transcript_text(db: Session, meeting: Meeting) -> str:
    if not meeting.media_asset_id:
        return meeting.description or meeting.notes or ""
    asset = db.query(MediaAsset).filter(MediaAsset.id == meeting.media_asset_id).first()
    if not asset or not asset.transcript:
        return meeting.description or meeting.notes or ""
    return asset.transcript.full_text


@router.post("/{meeting_id}/summary", response_model=SummaryResponse, status_code=status.HTTP_201_CREATED)
def generate_summary(
    meeting_id: str,
    payload: GenerateSummaryRequest | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    meeting = _get_owned_meeting(meeting_id, current_user, db)
    text = _meeting_transcript_text(db, meeting)
    provider = get_ai_provider()
    result = provider.generate_summary(text, summary_type="meeting", length=(payload.length if payload else "medium"))

    # Remove existing summary for this meeting.
    existing = db.query(Summary).filter(Summary.meeting_id == meeting.id).first()
    if existing:
        db.delete(existing)
        db.commit()

    summary = Summary(
        meeting_id=meeting.id,
        summary_text=result.text,
        key_points=json.dumps(result.key_points),
        decisions=json.dumps(result.decisions),
        unresolved_questions="\n".join(result.unresolved_questions),
        risks="\n".join(result.risks),
        next_steps="\n".join(result.next_steps),
        is_demo=provider.is_demo,
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return SummaryResponse.model_validate(summary)


@router.get("/{meeting_id}/summary", response_model=SummaryResponse)
def get_summary(
    meeting_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    meeting = _get_owned_meeting(meeting_id, current_user, db)
    summary = db.query(Summary).filter(Summary.meeting_id == meeting.id).first()
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found. Generate one first.")
    return summary


# --------------------------------------------------------------------------- #
# Meeting report
# --------------------------------------------------------------------------- #
@router.get("/{meeting_id}/report", response_model=MeetingReport)
def get_meeting_report(
    meeting_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    meeting = _get_owned_meeting(meeting_id, current_user, db)
    summary = db.query(Summary).filter(Summary.meeting_id == meeting.id).first()
    action_items = db.query(ActionItem).filter(ActionItem.meeting_id == meeting.id).all()

    if summary:
        executive_summary = summary.summary_text
        main_topics = _json_list(summary.key_points)
        decisions = _json_list(summary.decisions)
        unresolved_questions = _lines(summary.unresolved_questions)
        next_steps = _lines(summary.next_steps)
    else:
        # Fall back to AI provider for a quick executive summary.
        provider = get_ai_provider()
        result = provider.generate_summary(_meeting_transcript_text(db, meeting), "meeting", "medium")
        executive_summary = result.text
        main_topics = result.key_points
        decisions = result.decisions
        unresolved_questions = result.unresolved_questions
        next_steps = result.next_steps

    action_item_responses = [ActionItemResponse.model_validate(a) for a in action_items]
    responsible_people = sorted({a.owner for a in action_items if a.owner and a.owner != "Unspecified"})
    deadlines = [
        a.due_date.isoformat() for a in action_items if a.due_date is not None
    ]

    return MeetingReport(
        meeting_id=meeting.id,
        title=meeting.title,
        date=meeting.date,
        duration_minutes=meeting.duration_minutes,
        participants=meeting.participants,
        executive_summary=executive_summary,
        purpose=meeting.description or "",
        main_topics=main_topics,
        decisions=decisions,
        action_items=action_item_responses,
        responsible_people=responsible_people,
        deadlines=deadlines,
        unresolved_questions=unresolved_questions,
        next_steps=next_steps,
    )


@router.post("/{meeting_id}/follow-up-draft", response_model=FollowUpDraftResponse)
def generate_follow_up_draft(
    meeting_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    meeting = _get_owned_meeting(meeting_id, current_user, db)
    summary = db.query(Summary).filter(Summary.meeting_id == meeting.id).first()
    context = _meeting_transcript_text(db, meeting)
    summary_text = summary.summary_text if summary else ""
    provider = get_ai_provider()
    draft = provider.generate_follow_up_email(meeting.title, context, summary_text)
    return FollowUpDraftResponse(subject=f"Follow-up — {meeting.title}", body=draft, is_demo=provider.is_demo)


# --------------------------------------------------------------------------- #
# Action items
# --------------------------------------------------------------------------- #
@router.post("/{meeting_id}/action-items", response_model=ActionItemResponse, status_code=status.HTTP_201_CREATED)
def create_action_item(
    meeting_id: str,
    payload: ActionItemCreate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    meeting = _get_owned_meeting(meeting_id, current_user, db)
    item = ActionItem(
        meeting_id=meeting.id,
        user_id=current_user.id,
        description=payload.description,
        owner=payload.owner,
        due_date=payload.due_date,
        priority=payload.priority,
        status="pending",
        completed=False,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{meeting_id}/action-items")
def list_action_items(
    meeting_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_meeting(meeting_id, current_user, db)
    items = db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).order_by(ActionItem.created_at.desc()).all()
    return [ActionItemResponse.model_validate(i) for i in items]


@router.put("/{meeting_id}/action-items/{task_id}", response_model=ActionItemResponse)
def update_action_item(
    meeting_id: str,
    task_id: str,
    payload: ActionItemUpdate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_meeting(meeting_id, current_user, db)
    item = db.query(ActionItem).filter(ActionItem.id == task_id, ActionItem.meeting_id == meeting_id).first()
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found.")
    for field in ("description", "owner", "due_date", "priority", "status"):
        value = getattr(payload, field, None)
        if value is not None:
            setattr(item, field, value)
    if payload.completed is not None:
        item.completed = payload.completed
        if payload.completed:
            item.status = "completed"
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{meeting_id}/action-items/{task_id}", status_code=status.HTTP_200_OK)
def delete_action_item(
    meeting_id: str,
    task_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_meeting(meeting_id, current_user, db)
    item = db.query(ActionItem).filter(ActionItem.id == task_id, ActionItem.meeting_id == meeting_id).first()
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found.")
    db.delete(item)
    db.commit()
    return {"message": "Action item deleted."}


# --------------------------------------------------------------------------- #
# Notes & bookmarks
# --------------------------------------------------------------------------- #
@router.get("/{meeting_id}/notes")
def list_notes(
    meeting_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_meeting(meeting_id, current_user, db)
    notes = db.query(PersonalNote).filter(PersonalNote.meeting_id == meeting_id).all()
    return [NoteResponse.model_validate(n) for n in notes]


@router.post("/{meeting_id}/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    meeting_id: str,
    payload: NoteCreate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    meeting = _get_owned_meeting(meeting_id, current_user, db)
    note = PersonalNote(
        user_id=current_user.id,
        meeting_id=meeting.id,
        title=payload.title,
        content=payload.content,
        note_type=payload.note_type,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{meeting_id}/bookmarks")
def list_bookmarks(
    meeting_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_meeting(meeting_id, current_user, db)
    bookmarks = db.query(Bookmark).filter(Bookmark.meeting_id == meeting_id).all()
    return [BookmarkResponse.model_validate(b) for b in bookmarks]


@router.post("/{meeting_id}/bookmarks", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def create_bookmark(
    meeting_id: str,
    payload: BookmarkCreate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    meeting = _get_owned_meeting(meeting_id, current_user, db)
    bookmark = Bookmark(
        user_id=current_user.id,
        meeting_id=meeting.id,
        media_asset_id=payload.media_asset_id,
        label=payload.label,
        note=payload.note,
        timestamp=payload.timestamp,
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _json_list(value: str) -> list[str]:
    if not value:
        return []
    try:
        parsed = json.loads(value)
        if isinstance(parsed, list):
            return [str(x) for x in parsed]
    except (json.JSONDecodeError, TypeError):
        pass
    return _lines(value)


def _lines(value: str) -> list[str]:
    if not value:
        return []
    return [line.strip() for line in value.splitlines() if line.strip()]
