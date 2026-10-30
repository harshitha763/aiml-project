"""Calendar event routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.calendar_event import CalendarEvent
from app.models.user import User
from app.schemas.calendar import CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse
from app.api.common import paginate

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/events")
def list_events(
    page: int = 1,
    per_page: int = 20,
    event_type: str | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id)
    if event_type:
        q = q.filter(CalendarEvent.event_type == event_type)
    total = q.count()
    items = q.order_by(CalendarEvent.start_time.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return paginate([CalendarEventResponse.model_validate(e) for e in items], total, page, per_page)


@router.post("/events", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: CalendarEventCreate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    event = CalendarEvent(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        event_type=payload.event_type,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location,
        related_meeting_id=payload.related_meeting_id,
        related_lecture_id=payload.related_lecture_id,
        reminder_minutes=str(payload.reminder_minutes),
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/events/{event_id}", response_model=CalendarEventResponse)
def update_event(
    event_id: str,
    payload: CalendarEventUpdate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar event not found.")
    for field in ("title", "description", "event_type", "start_time", "end_time", "location"):
        value = getattr(payload, field, None)
        if value is not None:
            setattr(event, field, value)
    if payload.reminder_minutes is not None:
        event.reminder_minutes = str(payload.reminder_minutes)
    db.commit()
    db.refresh(event)
    return event


@router.delete("/events/{event_id}", status_code=status.HTTP_200_OK)
def delete_event(
    event_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event or event.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Calendar event not found.")
    db.delete(event)
    db.commit()
    return {"message": "Calendar event deleted."}
