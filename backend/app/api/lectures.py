"""Lecture routes: CRUD, summary, study notes, flashcards, quiz, notes."""
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.lecture import Lecture
from app.models.media import MediaAsset
from app.models.summary import Summary
from app.models.note import PersonalNote
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz, QuizQuestion
from app.models.user import User
from app.schemas.lecture import LectureCreate, LectureUpdate, LectureResponse
from app.schemas.summary import GenerateSummaryRequest, SummaryResponse
from app.schemas.note import NoteCreate, NoteResponse, GenerateNotesRequest
from app.schemas.flashcard import FlashcardCreate, FlashcardResponse
from app.schemas.quiz import GenerateQuizRequest, QuizResponse
from app.services.ai_service import get_ai_provider
from app.api.common import paginate

router = APIRouter(prefix="/api/lectures", tags=["lectures"])


def _to_response(db: Session, l: Lecture) -> LectureResponse:
    summary_exists = db.query(Summary).filter(Summary.lecture_id == l.id).first() is not None
    media_filename = None
    if l.media_asset_id:
        ma = db.query(MediaAsset).filter(MediaAsset.id == l.media_asset_id).first()
        if ma:
            media_filename = ma.filename
    data = LectureResponse.model_validate(l)
    data.has_summary = summary_exists
    data.media_filename = media_filename
    return data


def _get_owned_lecture(lecture_id: str, user: User, db: Session) -> Lecture:
    lecture = db.query(Lecture).filter(Lecture.id == lecture_id).first()
    if not lecture or lecture.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found.")
    return lecture


def _lecture_text(db: Session, lecture: Lecture) -> str:
    if not lecture.media_asset_id:
        return lecture.description or ""
    asset = db.query(MediaAsset).filter(MediaAsset.id == lecture.media_asset_id).first()
    if not asset or not asset.transcript:
        return lecture.description or ""
    return asset.transcript.full_text


@router.get("/")
def list_lectures(
    page: int = 1,
    per_page: int = 20,
    subject: str | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Lecture).filter(Lecture.user_id == current_user.id)
    if subject:
        q = q.filter(Lecture.subject.ilike(f"%{subject}%"))
    total = q.count()
    items = q.order_by(Lecture.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return paginate([_to_response(db, l) for l in items], total, page, per_page)


@router.post("/", response_model=LectureResponse, status_code=status.HTTP_201_CREATED)
def create_lecture(
    payload: LectureCreate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    if payload.media_asset_id:
        asset = db.query(MediaAsset).filter(MediaAsset.id == payload.media_asset_id).first()
        if not asset or asset.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid media asset.")
    lecture = Lecture(
        user_id=current_user.id,
        title=payload.title,
        description=payload.description,
        subject=payload.subject,
        lecturer=payload.lecturer,
        date=payload.date or datetime.now(timezone.utc),
        duration_minutes=payload.duration_minutes,
        media_asset_id=payload.media_asset_id,
        explanation_level=payload.explanation_level,
        status="created",
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)
    return _to_response(db, lecture)


@router.get("/{lecture_id}", response_model=LectureResponse)
def get_lecture(
    lecture_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    return _to_response(db, _get_owned_lecture(lecture_id, current_user, db))


@router.put("/{lecture_id}", response_model=LectureResponse)
def update_lecture(
    lecture_id: str,
    payload: LectureUpdate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user, db)
    for field in ("title", "description", "subject", "lecturer", "date",
                  "duration_minutes", "explanation_level", "revision_status", "status"):
        value = getattr(payload, field, None)
        if value is not None:
            setattr(lecture, field, value)
    db.commit()
    db.refresh(lecture)
    return _to_response(db, lecture)


@router.delete("/{lecture_id}", status_code=status.HTTP_200_OK)
def delete_lecture(
    lecture_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user, db)
    db.delete(lecture)
    db.commit()
    return {"message": "Lecture deleted."}


# --------------------------------------------------------------------------- #
# Summary
# --------------------------------------------------------------------------- #
@router.post("/{lecture_id}/summary", response_model=SummaryResponse, status_code=status.HTTP_201_CREATED)
def generate_summary(
    lecture_id: str,
    payload: GenerateSummaryRequest | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user, db)
    text = _lecture_text(db, lecture)
    provider = get_ai_provider()
    result = provider.generate_summary(text, summary_type="lecture", length=(payload.length if payload else "medium"))

    existing = db.query(Summary).filter(Summary.lecture_id == lecture.id).first()
    if existing:
        db.delete(existing)
        db.commit()

    summary = Summary(
        lecture_id=lecture.id,
        summary_text=result.text,
        key_points=json.dumps(result.key_points),
        decisions=json.dumps(result.decisions),
        unresolved_questions="\n".join(result.unresolved_questions),
        risks="\n".join(result.risks),
        next_steps="\n".join(result.next_steps),
        is_demo=provider.is_demo,
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


@router.get("/{lecture_id}/summary", response_model=SummaryResponse)
def get_summary(
    lecture_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user, db)
    summary = db.query(Summary).filter(Summary.lecture_id == lecture.id).first()
    if not summary:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found. Generate one first.")
    return summary


# --------------------------------------------------------------------------- #
# Study notes
# --------------------------------------------------------------------------- #
@router.post("/{lecture_id}/notes/generate", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def generate_study_notes(
    lecture_id: str,
    payload: GenerateNotesRequest | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user, db)
    level = (payload.level if payload else lecture.explanation_level) or "intermediate"
    note_format = (payload.note_format if payload else "detailed") or "detailed"
    provider = get_ai_provider()
    notes = provider.generate_notes(_lecture_text(db, lecture), level=level, note_format=note_format)
    note = PersonalNote(
        user_id=current_user.id,
        lecture_id=lecture.id,
        title=notes.title,
        content=notes.content,
        note_type=notes.note_type,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{lecture_id}/notes")
def list_notes(
    lecture_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_lecture(lecture_id, current_user, db)
    notes = db.query(PersonalNote).filter(PersonalNote.lecture_id == lecture_id).all()
    return [NoteResponse.model_validate(n) for n in notes]


@router.post("/{lecture_id}/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    lecture_id: str,
    payload: NoteCreate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user, db)
    note = PersonalNote(
        user_id=current_user.id,
        lecture_id=lecture.id,
        title=payload.title,
        content=payload.content,
        note_type=payload.note_type,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


# --------------------------------------------------------------------------- #
# Flashcards
# --------------------------------------------------------------------------- #
@router.post("/{lecture_id}/flashcards", status_code=status.HTTP_201_CREATED)
def generate_flashcards(
    lecture_id: str,
    count: int = 5,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user, db)
    provider = get_ai_provider()
    items = provider.generate_flashcards(_lecture_text(db, lecture), count=count)
    created = []
    for item in items:
        if not item.front or not item.back:
            continue
        fc = Flashcard(
            user_id=current_user.id,
            lecture_id=lecture.id,
            front=item.front,
            back=item.back,
            topic=item.topic or lecture.subject,
            difficulty="medium",
            is_demo="true" if provider.is_demo else "false",
        )
        db.add(fc)
        db.commit()
        db.refresh(fc)
        created.append(FlashcardResponse.model_validate(fc))
    return {"created": len(created), "flashcards": created, "is_demo": provider.is_demo}


@router.get("/{lecture_id}/flashcards")
def list_flashcards(
    lecture_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_lecture(lecture_id, current_user, db)
    cards = db.query(Flashcard).filter(Flashcard.lecture_id == lecture_id).order_by(Flashcard.created_at.desc()).all()
    return [FlashcardResponse.model_validate(f) for f in cards]


# --------------------------------------------------------------------------- #
# Quiz
# --------------------------------------------------------------------------- #
@router.post("/{lecture_id}/quiz", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
def generate_quiz(
    lecture_id: str,
    payload: GenerateQuizRequest | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    lecture = _get_owned_lecture(lecture_id, current_user, db)
    num_questions = payload.num_questions if payload else 5
    difficulty = payload.difficulty if payload else "medium"
    topic = payload.topic if payload else ""
    provider = get_ai_provider()
    items = provider.generate_quiz(_lecture_text(db, lecture), num_questions=num_questions,
                                   difficulty=difficulty, topic=topic)

    quiz = Quiz(
        user_id=current_user.id,
        lecture_id=lecture.id,
        title=f"Quiz: {lecture.title}",
        description=f"{difficulty} quiz generated from {lecture.title}.",
        difficulty=difficulty,
        is_demo="true" if provider.is_demo else "false",
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    created_questions = []
    for i, item in enumerate(items):
        if not item.question:
            continue
        options = item.options if item.options else [item.correct_answer]
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question_type=item.question_type or "multiple_choice",
            question=item.question,
            options=json.dumps(options),
            correct_answer=item.correct_answer,
            explanation=item.explanation,
            topic=item.topic or topic,
            order_index=i,
        )
        db.add(qq)
        db.commit()
        db.refresh(qq)
        created_questions.append(qq)

    db.refresh(quiz)
    return QuizResponse.model_validate(quiz)


@router.get("/{lecture_id}/quizzes")
def list_quizzes(
    lecture_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    _get_owned_lecture(lecture_id, current_user, db)
    quizzes = db.query(Quiz).filter(Quiz.lecture_id == lecture_id).order_by(Quiz.created_at.desc()).all()
    return [QuizResponse.model_validate(q) for q in quizzes]
