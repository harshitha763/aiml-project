"""Shared helpers for API route handlers."""
from __future__ import annotations

import math
from typing import Any, Sequence, TypeVar

T = TypeVar("T")


def paginate(items: Sequence[T], total: int, page: int, per_page: int) -> dict[str, Any]:
    """Build a standard paginated response dict."""
    page = max(1, page)
    per_page = max(1, per_page)
    pages = max(1, math.ceil(total / per_page)) if total else 1
    return {
        "items": list(items),
        "total": int(total),
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }


def ensure_owner(user_id: str, owner_id: str | None) -> None:
    """Raise ValueError if owner_id is not the current user."""
    if owner_id is None or owner_id != user_id:
        raise ValueError("Resource not found")
