"""Audio transcription service.

If a transcription provider is configured (OpenAI Whisper), this service calls
the Whisper API. Otherwise it returns realistic demo transcript segments.
"""
from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from typing import Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class TranscriptSegmentData:
    speaker: str
    text: str
    start: float
    end: float
    confidence: float = 0.95


@dataclass
class TranscriptionResult:
    full_text: str
    language: str
    duration_seconds: float
    segments: list[TranscriptSegmentData] = field(default_factory=list)
    speaker_count: int = 0
    is_demo: bool = False


# A realistic sample transcript used in demo mode.
_DEMO_SEGMENTS = [
    ("Speaker 1", "Welcome everyone. Thanks for joining today's meeting on the new product roadmap.", 0.0, 8.5),
    ("Speaker 2", "Thanks for having me. I'm excited to share the updates from the engineering team.", 8.5, 14.2),
    ("Speaker 1", "Great. Let's start with the priorities for the next quarter. What are the key deliverables?", 14.2, 21.0),
    ("Speaker 2", "We have three main goals: ship the new dashboard, improve API performance, and launch the mobile beta.", 21.0, 30.4),
    ("Speaker 1", "Which of those is the highest priority for the team?", 30.4, 34.1),
    ("Speaker 2", "The dashboard is the highest priority because it directly improves customer onboarding.", 34.1, 41.8),
    ("Speaker 1", "Understood. What risks should we be aware of?", 41.8, 45.3),
    ("Speaker 2", "The main risk is dependency on the design team finalizing the components by next Friday.", 45.3, 53.0),
    ("Speaker 1", "Okay, let's make sure we follow up with design on Monday. Any action items?", 53.0, 59.6),
    ("Speaker 2", "Yes. I'll send the technical spec by Wednesday, and we'll review it together on Thursday.", 59.6, 67.4),
    ("Speaker 1", "Sounds good. Are there any unresolved questions before we wrap up?", 67.4, 72.9),
    ("Speaker 2", "One question: do we have budget approval for the additional QA resources we discussed?", 72.9, 80.2),
    ("Speaker 1", "I'll confirm the budget with finance this week and circle back. Let's meet again next Tuesday.", 80.2, 88.9),
    ("Speaker 2", "Perfect, talk to you then. Thanks everyone.", 88.9, 92.0),
]


def _build_demo_result() -> TranscriptionResult:
    segments = [
        TranscriptSegmentData(
            speaker=speaker, text=text, start=start, end=end, confidence=0.95
        )
        for speaker, text, start, end in _DEMO_SEGMENTS
    ]
    full_text = "\n".join(f"{s.speaker}: {s.text}" for s in segments)
    speakers = {s.speaker for s in segments}
    last_end = segments[-1].end if segments else 0.0
    return TranscriptionResult(
        full_text=full_text,
        language="en",
        duration_seconds=last_end,
        segments=segments,
        speaker_count=len(speakers),
        is_demo=True,
    )


def transcribe_audio(file_path: str, language: str = "en") -> TranscriptionResult:
    """Transcribe an audio file.

    If transcription is configured (OpenAI Whisper), call the Whisper API.
    Otherwise, return realistic demo transcript segments.
    """
    if not settings.is_transcription_configured or not file_path or not os.path.exists(file_path):
        return _build_demo_result()

    try:
        return _transcribe_with_whisper(file_path, language)
    except Exception as exc:  # pragma: no cover - network/IO dependent
        logger.warning("Whisper transcription failed (%s); falling back to demo.", exc)
        return _build_demo_result()


def _transcribe_with_whisper(file_path: str, language: str) -> TranscriptionResult:
    base_url = (settings.OPENAI_BASE_URL or "https://api.openai.com/v1").rstrip("/")
    if base_url.endswith("/v1") is False and "openai.com" in base_url:
        base_url = base_url + "/v1"
    url = f"{base_url}/audio/transcriptions"
    headers = {"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}

    with open(file_path, "rb") as audio_file:
        files = {"file": (os.path.basename(file_path), audio_file)}
        data = {
            "model": settings.OPENAI_WHISPER_MODEL,
            "response_format": "verbose_json",
        }
        if language:
            data["language"] = language
        with httpx.Client(timeout=600.0) as client:
            resp = client.post(url, headers=headers, files=files, data=data)
            resp.raise_for_status()
            payload = resp.json()

    segments_raw = payload.get("segments", []) or []
    segments: list[TranscriptSegmentData] = []
    speakers: set[str] = set()
    for i, seg in enumerate(segments_raw):
        speaker = "Speaker 1"
        text = (seg.get("text") or "").strip()
        start = float(seg.get("start", 0.0))
        end = float(seg.get("end", 0.0))
        confidence = float(seg.get("avg_logprob", 0.0))
        # avg_logprob is negative; convert to a rough 0-1 confidence.
        conf = max(0.0, min(1.0, 0.5 + confidence))
        segments.append(
            TranscriptSegmentData(
                speaker=speaker, text=text, start=start, end=end, confidence=conf
            )
        )
        speakers.add(speaker)

    full_text = "\n".join(f"{s.speaker}: {s.text}" for s in segments)
    duration = float(payload.get("duration", segments[-1].end if segments else 0.0))
    lang = language or payload.get("language", "en")

    if not segments:
        # Fallback if the API returned plain text.
        plain = str(payload.get("text", "")).strip()
        segments = [
            TranscriptSegmentData(speaker="Speaker 1", text=plain, start=0.0, end=duration or len(plain) / 15.0)
        ]
        full_text = plain
        speakers = {"Speaker 1"}

    return TranscriptionResult(
        full_text=full_text,
        language=lang,
        duration_seconds=duration,
        segments=segments,
        speaker_count=len(speakers),
        is_demo=False,
    )
