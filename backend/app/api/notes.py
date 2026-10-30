"""Personal notes routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.note import PersonalNote
from app.models.user import User
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app.api.common import paginate

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("/")
def list_notes(
    page: int = 1,
    per_page: int = 20,
    note_type: str | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(PersonalNote).filter(PersonalNote.user_id == current_user.id)
    if note_type:
        q = q.filter(PersonalNote.note_type == note_type)
    total = q.count()
    items = q.order_by(PersonalNote.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return paginate([NoteResponse.model_validate(n) for n in items], total, page, per_page)


@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    payload: NoteCreate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    note = PersonalNote(
        user_id=current_user.id,
        meeting_id=payload.meeting_id,
        lecture_id=payload.lecture_id,
        title=payload.title,
        content=payload.content,
        note_type=payload.note_type,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(PersonalNote).filter(PersonalNote.id == note_id).first()
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    return note


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: str,
    payload: NoteUpdate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(PersonalNote).filter(PersonalNote.id == note_id).first()
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    for field in ("title", "content", "note_type"):
        value = getattr(payload, field, None)
        if value is not None:
            setattr(note, field, value)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_200_OK)
def delete_note(
    note_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    note = db.query(PersonalNote).filter(PersonalNote.id == note_id).first()
    if not note or note.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")
    db.delete(note)
    db.commit()
    return {"message": "Note deleted."}
