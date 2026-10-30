"""Media asset upload and management routes."""
import os
import uuid

from fastapi import (
    APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.dependencies import get_demo_or_current_user
from app.models.media import MediaAsset
from app.models.user import User
from app.schemas.media import MediaAssetResponse, MediaAssetUpdate, UploadResponse
from app.services.processing_service import run_transcription_task
from app.api.common import paginate

router = APIRouter(prefix="/api/media", tags=["media"])

ALLOWED_MIME = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/webm",
    "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/aac",
    "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
    "application/pdf", "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}

EXT_BY_MIME = {
    "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav",
    "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "m4a", "audio/x-m4a": "m4a",
    "audio/aac": "aac", "video/mp4": "mp4", "video/webm": "webm",
    "video/quicktime": "mov", "video/x-msvideo": "avi",
    "application/pdf": "pdf", "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
}


def _media_type_for(mime: str) -> str:
    if mime.startswith("audio"):
        return "audio"
    if mime.startswith("video"):
        return "video"
    return "document"


@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    if not file.filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No file provided.")

    # Validate size.
    contents = b""
    size = 0
    max_bytes = settings.max_upload_size_bytes
    while True:
        chunk = file.file.read(1024 * 1024)
        if not chunk:
            break
        size += len(chunk)
        if size > max_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File exceeds the maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB} MB.",
            )
        contents += chunk

    mime = file.content_type or "application/octet-stream"
    if mime not in ALLOWED_MIME:
        # Be lenient: if we don't know the mime, infer from extension.
        ext = os.path.splitext(file.filename or "")[1].lower().lstrip(".")
        if ext not in {"mp3", "wav", "m4a", "aac", "ogg", "webm", "mp4", "mov", "avi", "pdf", "doc", "docx", "txt"}:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported file type: {mime}",
            )
        ext_final = ext
    else:
        ext_final = EXT_BY_MIME.get(mime, os.path.splitext(file.filename or "")[1].lstrip("."))

    safe_name = f"{uuid.uuid4().hex}.{ext_final}"
    upload_dir = settings.upload_path
    file_path = upload_dir / safe_name
    with open(file_path, "wb") as out:
        out.write(contents)

    asset = MediaAsset(
        user_id=current_user.id,
        filename=file.filename,
        stored_filename=safe_name,
        file_path=str(file_path),
        file_size=size,
        mime_type=mime,
        media_type=_media_type_for(mime),
        title=file.filename,
        description="",
        category="meeting",
        status="uploaded",
        status_message="File uploaded, ready for transcription.",
        progress=0,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    return UploadResponse(
        id=asset.id,
        filename=asset.filename,
        media_type=asset.media_type,
        file_size=asset.file_size,
        status=asset.status,
        message="Upload successful",
    )


@router.get("/")
def list_media(
    page: int = 1,
    per_page: int = 20,
    media_type: str | None = None,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(MediaAsset).filter(MediaAsset.user_id == current_user.id)
    if media_type:
        q = q.filter(MediaAsset.media_type == media_type)
    total = q.count()
    items = (
        q.order_by(MediaAsset.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    return paginate([MediaAssetResponse.model_validate(m) for m in items], total, page, per_page)


@router.get("/{media_id}", response_model=MediaAssetResponse)
def get_media(
    media_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    asset = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
    if not asset or asset.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found.")
    return asset


@router.put("/{media_id}", response_model=MediaAssetResponse)
def update_media(
    media_id: str,
    payload: MediaAssetUpdate,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    asset = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
    if not asset or asset.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found.")
    for field in ("title", "description", "category", "language"):
        value = getattr(payload, field, None)
        if value is not None:
            setattr(asset, field, value)
    db.commit()
    db.refresh(asset)
    return asset


@router.delete("/{media_id}", status_code=status.HTTP_200_OK)
def delete_media(
    media_id: str,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    asset = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
    if not asset or asset.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found.")
    # Remove the physical file if it exists.
    try:
        if asset.file_path and os.path.exists(asset.file_path):
            os.remove(asset.file_path)
    except OSError:
        pass
    db.delete(asset)
    db.commit()
    return {"message": "Media asset deleted."}


@router.post("/{media_id}/transcribe", status_code=status.HTTP_202_ACCEPTED)
def start_transcription(
    media_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_demo_or_current_user),
    db: Session = Depends(get_db),
):
    asset = db.query(MediaAsset).filter(MediaAsset.id == media_id).first()
    if not asset or asset.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found.")
    if asset.status in {"transcribing", "analyzing"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Transcription already in progress.")
    asset.status = "queued"
    asset.status_message = "Transcription queued"
    db.commit()
    background_tasks.add_task(run_transcription_task, media_id)
    return {"message": "Transcription started.", "media_id": media_id, "status": "queued"}
