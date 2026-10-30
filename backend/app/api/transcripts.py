"""Transcript routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.media import MediaAsset
from app.models.transcript import Transcript, TranscriptSegment
from app.models.user import User
from app.schemas.transcript import (
    TranscriptResponse, TranscriptSegmentResponse,
    TranscriptSegmentUpdate, TranscriptUpdate,
)

router = APIRouter(prefix="/api/transcripts", tags=["transcripts"])


def _get_owned_transcript(transcript_id: str, user: User, db: Session) -> Transcript:
    transcript = db.query(Transcript).filter(Transcript.id == transcript_id).first()
    if not transcript:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found.")
    # Ownership via the media asset's user.
    asset = db.query(MediaAsset).filter(MediaAsset.id == transcript.media_asset_id).first()
    if not asset or asset.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transcript not found.")
    return transcript


@router.get("/{transcript_id}", response_model=TranscriptResponse)
def get_transcript(
    transcript_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    return _get_owned_transcript(transcript_id, current_user, db)


@router.put("/{transcript_id}", response_model=TranscriptResponse)
def update_transcript(
    transcript_id: str,
    payload: TranscriptUpdate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    transcript = _get_owned_transcript(transcript_id, current_user, db)
    transcript.full_text = payload.full_text
    db.commit()
    db.refresh(transcript)
    return transcript


@router.put("/{transcript_id}/segments/{segment_id}", response_model=TranscriptSegmentResponse)
def update_segment(
    transcript_id: str,
    segment_id: str,
    payload: TranscriptSegmentUpdate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    transcript = _get_owned_transcript(transcript_id, current_user, db)
    segment = (
        db.query(TranscriptSegment)
        .filter(TranscriptSegment.id == segment_id, TranscriptSegment.transcript_id == transcript.id)
        .first()
    )
    if not segment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Segment not found.")
    if payload.text is not None:
        segment.text = payload.text
    if payload.speaker is not None:
        segment.speaker = payload.speaker
    db.commit()
    db.refresh(segment)
    return segment


@router.get("/{transcript_id}/download")
def download_transcript(
    transcript_id: str,
    format: str = "txt",
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    transcript = _get_owned_transcript(transcript_id, current_user, db)
    if format != "txt":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only 'txt' format is supported.")
    lines = []
    for seg in transcript.segments:
        start = _fmt(seg.start_time)
        end = _fmt(seg.end_time)
        lines.append(f"[{start} - {end}] {seg.speaker}: {seg.text}")
    if not lines:
        lines.append(transcript.full_text or "(no transcript available)")
    content = "\n".join(lines)
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=transcript_{transcript_id}.txt"},
    )


def _fmt(seconds: float) -> str:
    seconds = float(seconds or 0)
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"
