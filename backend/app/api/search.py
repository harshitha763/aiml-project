"""Search routes."""
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.user import User
from app.services.search_service import search as run_search
from app.schemas.search import SearchResult, SearchResponse

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("/", response_model=SearchResponse)
def search(
    q: str = "",
    content_type: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    results = run_search(
        db,
        user_id=current_user.id,
        query=q,
        content_type=content_type,
        date_from=date_from,
        date_to=date_to,
    )
    total = len(results)
    start = (page - 1) * per_page
    end = start + per_page
    page_items = results[start:end]
    pages = max(1, (total + per_page - 1) // per_page) if total else 1
    return SearchResponse(results=page_items, total=total, page=page, per_page=per_page, pages=pages)
