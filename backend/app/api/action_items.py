"""Action items routes (cross-meeting listing and updates)."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.action_item import ActionItem
from app.models.user import User
from app.schemas.action_item import ActionItemUpdate, ActionItemResponse
from app.api.common import paginate

router = APIRouter(prefix="/api/action-items", tags=["action-items"])


@router.get("/")
def list_action_items(
    page: int = 1,
    per_page: int = 20,
    status_filter: str | None = None,
    priority: str | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(ActionItem).filter(ActionItem.user_id == current_user.id)
    if status_filter:
        q = q.filter(ActionItem.status == status_filter)
    if priority:
        q = q.filter(ActionItem.priority == priority)
    total = q.count()
    items = q.order_by(ActionItem.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return paginate([ActionItemResponse.model_validate(i) for i in items], total, page, per_page)


@router.put("/{task_id}", response_model=ActionItemResponse)
def update_action_item(
    task_id: str,
    payload: ActionItemUpdate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(ActionItem).filter(ActionItem.id == task_id).first()
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


@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_action_item(
    task_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(ActionItem).filter(ActionItem.id == task_id).first()
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action item not found.")
    db.delete(item)
    db.commit()
    return {"message": "Action item deleted."}
