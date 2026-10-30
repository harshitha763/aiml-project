"""User settings routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.setting import UserSetting
from app.models.user import User
from app.schemas.settings import UserSettingResponse, UserSettingUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


def _get_or_create(db: Session, user_id: str) -> UserSetting:
    setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if setting is None:
        setting = UserSetting(user_id=user_id)
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting


@router.get("/", response_model=UserSettingResponse)
def get_settings(
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    return _get_or_create(db, current_user.id)


@router.put("/", response_model=UserSettingResponse)
def update_settings(
    payload: UserSettingUpdate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    setting = _get_or_create(db, current_user.id)
    for field in ("theme", "language", "default_transcription_language",
                  "default_summary_length", "preferred_note_format",
                  "default_explanation_level"):
        value = getattr(payload, field, None)
        if value is not None:
            setattr(setting, field, value)
    db.commit()
    db.refresh(setting)
    return setting
