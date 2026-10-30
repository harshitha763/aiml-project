"""Analytics routes."""
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.user import User
from app.services.analytics_service import get_analytics

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/")
def get_analytics_route(
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    return get_analytics(db, current_user.id, date_from, date_to)
