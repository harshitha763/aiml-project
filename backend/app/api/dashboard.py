"""Dashboard routes."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.user import User
from app.services.analytics_service import get_dashboard_stats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    return get_dashboard_stats(db, current_user.id)
