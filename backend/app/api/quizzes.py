"""Quizzes routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.user import User
from app.schemas.quiz import (
    QuizResponse, QuizQuestionResponse, QuizAttemptCreate, QuizAttemptResponse,
)
from app.api.common import paginate

router = APIRouter(prefix="/api/quizzes", tags=["quizzes"])


def _get_owned_quiz(quiz_id: str, user: User, db: Session) -> Quiz:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz or quiz.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found.")
    return quiz


@router.get("/")
def list_quizzes(
    page: int = 1,
    per_page: int = 20,
    lecture_id: str | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Quiz).filter(Quiz.user_id == current_user.id)
    if lecture_id:
        q = q.filter(Quiz.lecture_id == lecture_id)
    total = q.count()
    items = q.order_by(Quiz.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return paginate([QuizResponse.model_validate(item) for item in items], total, page, per_page)


@router.get("/{quiz_id}", response_model=QuizResponse)
def get_quiz(
    quiz_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_quiz(quiz_id, current_user, db)


@router.post("/{quiz_id}/attempt", response_model=QuizAttemptResponse, status_code=status.HTTP_201_CREATED)
def submit_attempt(
    quiz_id: str,
    payload: QuizAttemptCreate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    quiz = _get_owned_quiz(quiz_id, current_user, db)
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).order_by(QuizQuestion.order_index).all()
    question_map = {q.id: q for q in questions}

    correct = 0
    total = len(questions)
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=0.0,
        total_questions=total,
        correct_count=0,
        time_taken_seconds=payload.time_taken_seconds,
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    for ans in payload.answers:
        question = question_map.get(ans.question_id)
        if not question:
            continue
        is_correct = ans.user_answer.strip().lower() == question.correct_answer.strip().lower()
        if is_correct:
            correct += 1
        db.add(
            QuizAnswer(
                attempt_id=attempt.id,
                question_id=question.id,
                user_answer=ans.user_answer,
                is_correct="true" if is_correct else "false",
            )
        )
    db.commit()

    score = (correct / total * 100.0) if total else 0.0
    attempt.score = round(score, 2)
    attempt.correct_count = correct
    db.commit()
    db.refresh(attempt)
    return QuizAttemptResponse.model_validate(attempt)


@router.get("/{quiz_id}/attempts")
def list_attempts(
    quiz_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    quiz = _get_owned_quiz(quiz_id, current_user, db)
    attempts = (
        db.query(QuizAttempt)
        .filter(QuizAttempt.quiz_id == quiz.id, QuizAttempt.user_id == current_user.id)
        .order_by(QuizAttempt.completed_at.desc())
        .all()
    )
    return [QuizAttemptResponse.model_validate(a) for a in attempts]
