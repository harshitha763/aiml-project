"""Assistant routes: ask questions about a resource and manage conversations."""
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.assistant import AssistantConversation, AssistantMessage
from app.models.meeting import Meeting
from app.models.lecture import Lecture
from app.models.user import User
from app.schemas.assistant import (
    AssistantAskRequest, AssistantAskResponse,
    ConversationResponse, MessageResponse,
)
from app.services.retrieval_service import retrieve_context
from app.services.ai_service import get_ai_provider
from app.api.common import paginate

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


def _resolve_resource(db: Session, user: User, resource_type: str, resource_id: str):
    if resource_type == "meeting":
        meeting = db.query(Meeting).filter(Meeting.id == resource_id).first()
        if not meeting or meeting.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found.")
        return meeting
    elif resource_type == "lecture":
        lecture = db.query(Lecture).filter(Lecture.id == resource_id).first()
        if not lecture or lecture.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found.")
        return lecture
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid resource_type.")


@router.post("/ask", response_model=AssistantAskResponse)
def ask(
    payload: AssistantAskRequest,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    _resolve_resource(db, current_user, payload.resource_type, payload.resource_id)

    # Retrieve relevant context from the resource.
    retrieved = retrieve_context(db, payload.resource_type, payload.resource_id, payload.question)
    provider = get_ai_provider()
    answer, ai_refs = provider.answer_question(payload.question, retrieved["context"])

    # Merge references from retrieval + AI.
    references = retrieved["references"]
    if isinstance(ai_refs, list):
        for ref in ai_refs:
            if isinstance(ref, dict):
                references.append(ref)

    # Find or create conversation.
    conversation = None
    if payload.conversation_id:
        conversation = (
            db.query(AssistantConversation)
            .filter(AssistantConversation.id == payload.conversation_id)
            .first()
        )
        if conversation and conversation.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    if conversation is None:
        title = f"{payload.resource_type.capitalize()} Q&A"
        conversation = AssistantConversation(
            user_id=current_user.id,
            title=title,
            meeting_id=payload.resource_id if payload.resource_type == "meeting" else None,
            lecture_id=payload.resource_id if payload.resource_type == "lecture" else None,
            resource_type=payload.resource_type,
            resource_id=payload.resource_id,
            is_demo="true" if provider.is_demo else "false",
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Persist the user's question and the assistant's answer.
    user_msg = AssistantMessage(
        conversation_id=conversation.id,
        role="user",
        content=payload.question,
        references_json="[]",
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    assistant_msg = AssistantMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
        references_json=json.dumps(references, default=str),
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return AssistantAskResponse(
        answer=answer,
        references=references,
        conversation_id=conversation.id,
        message_id=assistant_msg.id,
        is_demo=provider.is_demo,
    )


@router.get("/conversations")
def list_conversations(
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(AssistantConversation).filter(AssistantConversation.user_id == current_user.id)
    total = q.count()
    items = q.order_by(AssistantConversation.updated_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return paginate([ConversationResponse.model_validate(c) for c in items], total, page, per_page)


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(AssistantConversation)
        .filter(AssistantConversation.id == conversation_id)
        .first()
    )
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    return conversation


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(AssistantConversation)
        .filter(AssistantConversation.id == conversation_id)
        .first()
    )
    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
    db.delete(conversation)
    db.commit()
    return {"message": "Conversation deleted."}
