"""Flashcards routes with SM-2 spaced repetition review."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.flashcard import Flashcard, FlashcardReview
from app.models.user import User
from app.schemas.flashcard import (
    FlashcardCreate, FlashcardUpdate, FlashcardResponse, FlashcardReviewRequest,
)
from app.services.spaced_repetition import calculate_sm2
from app.api.common import paginate

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])


@router.get("/")
def list_flashcards(
    page: int = 1,
    per_page: int = 20,
    lecture_id: str | None = None,
    topic: str | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Flashcard).filter(Flashcard.user_id == current_user.id)
    if lecture_id:
        q = q.filter(Flashcard.lecture_id == lecture_id)
    if topic:
        q = q.filter(Flashcard.topic.ilike(f"%{topic}%"))
    total = q.count()
    items = q.order_by(Flashcard.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return paginate([FlashcardResponse.model_validate(f) for f in items], total, page, per_page)


@router.post("/", response_model=FlashcardResponse, status_code=status.HTTP_201_CREATED)
def create_flashcard(
    payload: FlashcardCreate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    card = Flashcard(
        user_id=current_user.id,
        lecture_id=payload.lecture_id,
        front=payload.front,
        back=payload.back,
        topic=payload.topic,
        difficulty=payload.difficulty,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.put("/{flashcard_id}", response_model=FlashcardResponse)
def update_flashcard(
    flashcard_id: str,
    payload: FlashcardUpdate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if not card or card.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found.")
    for field in ("front", "back", "topic", "difficulty"):
        value = getattr(payload, field, None)
        if value is not None:
            setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


@router.delete("/{flashcard_id}", status_code=status.HTTP_200_OK)
def delete_flashcard(
    flashcard_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if not card or card.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found.")
    db.delete(card)
    db.commit()
    return {"message": "Flashcard deleted."}


@router.post("/{flashcard_id}/review", response_model=FlashcardResponse)
def review_flashcard(
    flashcard_id: str,
    payload: FlashcardReviewRequest,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if not card or card.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Flashcard not found.")

    result = calculate_sm2(
        payload.rating,
        card.ease_factor,
        card.repetitions,
        card.interval_days,
    )
    card.ease_factor = result.ease_factor
    card.repetitions = result.repetitions
    card.interval_days = result.interval_days
    card.next_review_date = result.next_review_date
    card.last_reviewed = datetime.now(timezone.utc)

    review = FlashcardReview(flashcard_id=card.id, rating=payload.rating)
    db.add(review)
    db.commit()
    db.refresh(card)
    return card


@router.get("/due/cards")
def due_cards(
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    cards = (
        db.query(Flashcard)
        .filter(Flashcard.user_id == current_user.id, Flashcard.next_review_date <= now)
        .order_by(Flashcard.next_review_date.asc())
        .all()
    )
    return [FlashcardResponse.model_validate(c) for c in cards]


@router.get("/study-stats")
def study_stats(
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    total = db.query(Flashcard).filter(Flashcard.user_id == current_user.id).count()
    due = (
        db.query(Flashcard)
        .filter(Flashcard.user_id == current_user.id, Flashcard.next_review_date <= now)
        .count()
    )
    reviews = (
        db.query(FlashcardReview)
        .join(Flashcard, FlashcardReview.flashcard_id == Flashcard.id)
        .filter(Flashcard.user_id == current_user.id)
        .count()
    )
    # Average ease factor across user's cards.
    from sqlalchemy import func

    avg_ease = (
        db.query(func.avg(Flashcard.ease_factor))
        .filter(Flashcard.user_id == current_user.id)
        .scalar()
        or 2.5
    )
    return {
        "total_cards": total,
        "due_cards": due,
        "total_reviews": reviews,
        "avg_ease_factor": round(float(avg_ease), 3),
    }
