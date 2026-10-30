"""Bookmarks routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.note import Bookmark
from app.models.user import User
from app.schemas.note import BookmarkCreate, BookmarkResponse
from app.api.common import paginate

router = APIRouter(prefix="/api/bookmarks", tags=["bookmarks"])


@router.get("/")
def list_bookmarks(
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Bookmark).filter(Bookmark.user_id == current_user.id)
    total = q.count()
    items = q.order_by(Bookmark.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return paginate([BookmarkResponse.model_validate(b) for b in items], total, page, per_page)


@router.post("/", response_model=BookmarkResponse, status_code=status.HTTP_201_CREATED)
def create_bookmark(
    payload: BookmarkCreate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    bookmark = Bookmark(
        user_id=current_user.id,
        meeting_id=payload.meeting_id,
        lecture_id=payload.lecture_id,
        media_asset_id=payload.media_asset_id,
        label=payload.label,
        note=payload.note,
        timestamp=payload.timestamp,
    )
    db.add(bookmark)
    db.commit()
    db.refresh(bookmark)
    return bookmark


@router.delete("/{bookmark_id}", status_code=status.HTTP_200_OK)
def delete_bookmark(
    bookmark_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    bookmark = db.query(Bookmark).filter(Bookmark.id == bookmark_id).first()
    if not bookmark or bookmark.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bookmark not found.")
    db.delete(bookmark)
    db.commit()
    return {"message": "Bookmark deleted."}
