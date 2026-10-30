"""Quiz schemas."""
import json
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Any


class QuizQuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    question_type: str
    question: str
    options: list[str] = []
    correct_answer: str = ""
    explanation: str = ""
    topic: str = ""
    order_index: int = 0

    @field_validator("options", mode="before")
    @classmethod
    def _coerce_options(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return [str(o) for o in v]
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return [str(o) for o in parsed]
            except (json.JSONDecodeError, TypeError):
                pass
        return []


class QuizResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    lecture_id: str | None = None
    title: str
    description: str
    difficulty: str
    is_demo: bool = False
    created_at: datetime
    questions: list[QuizQuestionResponse] = []

    @field_validator("is_demo", mode="before")
    @classmethod
    def _coerce_bool(cls, v):
        if isinstance(v, bool):
            return v
        if v is None:
            return False
        return str(v).lower() == "true"


class GenerateQuizRequest(BaseModel):
    num_questions: int = Field(default=5, ge=1, le=20)
    difficulty: str = "medium"  # easy, medium, hard
    topic: str = ""


class QuizAnswerInput(BaseModel):
    question_id: str
    user_answer: str


class QuizAttemptCreate(BaseModel):
    answers: list[QuizAnswerInput]
    time_taken_seconds: int = 0


class QuizAnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    question_id: str
    user_answer: str
    is_correct: bool = False

    @field_validator("is_correct", mode="before")
    @classmethod
    def _coerce_bool(cls, v):
        if isinstance(v, bool):
            return v
        if v is None:
            return False
        return str(v).lower() == "true"


class QuizAttemptResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    quiz_id: str
    user_id: str
    score: float
    total_questions: int
    correct_count: int
    time_taken_seconds: int
    completed_at: datetime
    answers: list[QuizAnswerResponse] = []
