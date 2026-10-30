"""FastAPI dependencies for authentication and current user resolution."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.config import settings
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)

DEMO_USER_EMAIL = "demo@intellimeet.ai"


def _get_user_by_id(db: Session, user_id: str) -> User | None:
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id).first()


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Decode the JWT from the Authorization header and return the User or raise 401."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = _get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated.",
        )
    return user


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Return the current User if a valid token is present, otherwise None (for demo mode)."""
    if credentials is None or not credentials.credentials:
        return None
    token = credentials.credentials
    user_id = decode_access_token(token)
    if not user_id:
        return None
    user = _get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        return None
    return user


def get_or_create_demo_user(db: Session) -> User:
    """Get the shared demo user, creating it if it does not yet exist."""
    user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if user is not None:
        return user
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
    return user


def get_demo_or_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """If demo mode is enabled and no auth token is present, return/create the demo user.

    Otherwise require a valid authenticated user.
    """
    # Try to resolve an authenticated user first.
    if credentials is not None and credentials.credentials:
        user_id = decode_access_token(credentials.credentials)
        if user_id:
            user = _get_user_by_id(db, user_id)
            if user is not None and user.is_active:
                return user

    # Fall back to demo mode if enabled.
    if settings.DEMO_MODE:
        return get_or_create_demo_user(db)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
        headers={"WWW-Authenticate": "Bearer"},
    )
