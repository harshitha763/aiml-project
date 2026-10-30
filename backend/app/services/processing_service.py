"""Background processing helpers for transcription and analysis."""
from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.media import MediaAsset
from app.models.transcript import Transcript, TranscriptSegment
from app.services.transcription_service import transcribe_audio

logger = logging.getLogger(__name__)


def run_transcription_task(media_asset_id: str) -> None:
    """Background task: transcribe a media asset and persist the transcript.

    This is intended to run in a FastAPI BackgroundTasks context, so it opens
    its own database session.
    """
    db: Session = SessionLocal()
    try:
        asset = db.query(MediaAsset).filter(MediaAsset.id == media_asset_id).first()
        if asset is None:
            logger.warning("Transcription skipped: media asset %s not found", media_asset_id)
            return
        asset.status = "transcribing"
        asset.status_message = "Transcription in progress"
        asset.progress = 0.1
        db.commit()

        try:
            result = transcribe_audio(asset.file_path, language=asset.language or "en")
        except Exception as exc:  # pragma: no cover - defensive
            logger.exception("Transcription failed for asset %s", media_asset_id)
            asset.status = "failed"
            asset.status_message = f"Transcription failed: {exc}"
            db.commit()
            return

        # Replace any existing transcript.
        existing = (
            db.query(Transcript).filter(Transcript.media_asset_id == media_asset_id).first()
        )
        if existing:
            db.query(TranscriptSegment).filter(TranscriptSegment.transcript_id == existing.id).delete()
            db.delete(existing)
            db.commit()

        transcript = Transcript(
            media_asset_id=media_asset_id,
            full_text=result.full_text,
            language=result.language,
            duration_seconds=result.duration_seconds,
            speaker_count=result.speaker_count,
            is_demo="true" if result.is_demo else "false",
        )
        db.add(transcript)
        db.commit()
        db.refresh(transcript)

        for i, seg in enumerate(result.segments):
            db.add(
                TranscriptSegment(
                    transcript_id=transcript.id,
                    index=i,
                    speaker=seg.speaker,
                    text=seg.text,
                    start_time=seg.start,
                    end_time=seg.end,
                    confidence=seg.confidence,
                )
            )
        db.commit()

        asset.duration_seconds = result.duration_seconds
        asset.status = "completed"
        asset.status_message = "Transcription complete"
        asset.progress = 1.0
        db.commit()
    finally:
        db.close()
