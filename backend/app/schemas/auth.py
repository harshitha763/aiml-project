"""Auth-related schemas."""
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


def _normalize_email(v: str) -> str:
    if not v or "@" not in v:
        raise ValueError("Invalid email address")
    domain = v.split("@")[-1]
    if "." not in domain:
        raise ValueError("Invalid email address")
    return v.lower().strip()


class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(default="", max_length=255)

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str) -> str:
        return _normalize_email(v)


class UserLogin(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str) -> str:
        return _normalize_email(v)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    is_demo: bool
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse | None" = None


Token.model_rebuild()
