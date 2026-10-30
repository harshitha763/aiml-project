"""Spaced repetition: SM-2 algorithm implementation.

The SuperMemo SM-2 algorithm adjusts the ease factor, repetitions, and
interval between reviews based on the quality of the learner's response.

Quality mapping (IntelliMeet rating -> SM-2 quality q):
    easy     -> q = 5  (perfect)
    medium   -> q = 3  (correct with effort)
    difficult-> q = 1  (incorrect / hard)
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

RATING_TO_Q = {"easy": 5, "medium": 3, "difficult": 1}

MIN_EASE = 1.3


@dataclass
class SM2Result:
    ease_factor: float
    repetitions: int
    interval_days: int
    next_review_date: datetime


def calculate_sm2(
    rating: str,
    ease_factor: float,
    repetitions: int,
    interval_days: int,
) -> SM2Result:
    """Apply the SM-2 algorithm and return the updated scheduling values."""
    q = RATING_TO_Q.get(rating, 3)
    ef = max(float(ease_factor) if ease_factor else 2.5, MIN_EASE)
    reps = int(repetitions or 0)
    interval = int(interval_days or 0)

    if q < 3:
        # Incorrect response: reset repetitions and start over.
        reps = 0
        interval = 1
    else:
        reps += 1
        if reps == 1:
            interval = 1
        elif reps == 2:
            interval = 6
        else:
            interval = round(interval * ef)

    # Update ease factor: EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02))
    delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
    ef = ef + delta
    if ef < MIN_EASE:
        ef = MIN_EASE

    next_review = datetime.now(timezone.utc) + timedelta(days=max(interval, 1))
    return SM2Result(
        ease_factor=round(ef, 3),
        repetitions=reps,
        interval_days=interval,
        next_review_date=next_review,
    )
