"""Demo data routes: seed and reset."""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.user import User
from app.demo.demo_data import seed_demo_data, delete_demo_data

router = APIRouter(prefix="/api/demo", tags=["demo"])


@router.post("/seed", status_code=status.HTTP_200_OK)
def seed_demo(
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    created = seed_demo_data(db, current_user.id)
    return {"message": "Demo data seeded successfully.", "created": created}


@router.delete("/reset", status_code=status.HTTP_200_OK)
def reset_demo(
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    deleted = delete_demo_data(db, current_user.id)
    return {"message": "Demo data reset successfully.", "deleted": deleted}
