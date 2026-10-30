"""Authentication routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.dependencies import get_current_user, get_demo_or_current_user
from app.models.user import User
from app.models.setting import UserSetting
from app.schemas.auth import (
    UserCreate, UserLogin, UserResponse, Token, UserUpdate,
)
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

DEMO_USER_EMAIL = "demo@intellimeet.ai"


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    user = User(
        email=payload.email,
        full_name=payload.full_name or "",
        hashed_password=hash_password(payload.password),
        is_demo=False,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Seed default settings.
    db.add(UserSetting(user_id=user.id))
    db.commit()

    token = create_access_token({"sub": user.id})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )
    token = create_access_token({"sub": user.id})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_me(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    db.commit()
    db.refresh(current_user)
    return current_user


@router.delete("/me", response_model=SuccessResponse)
def delete_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.id
    db.delete(current_user)
    db.commit()
    return SuccessResponse(message="Account deleted successfully.")


@router.post("/demo-login", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    """Create or return the shared demo user and a token."""
    user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if user is None:
        user = User(
            email=DEMO_USER_EMAIL,
            full_name="Demo User",
            hashed_password="",
            is_demo=True,
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        db.add(UserSetting(user_id=user.id))
        db.commit()
    token = create_access_token({"sub": user.id})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))
