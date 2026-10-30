"""IntelliMeet AI FastAPI application entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pathlib import Path

from app.core.config import settings
from app.core.database import init_db
from app.api import (
    auth, dashboard, media, meetings, lectures, transcripts, action_items,
    notes, bookmarks, flashcards, quizzes, assistant, search, analytics,
    calendar, settings as settings_api, exports, demo,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing database tables...")
    init_db()
    settings.upload_path  # ensures the upload dir exists
    logger.info("IntelliMeet AI backend started.")
    yield
    # Shutdown
    logger.info("IntelliMeet AI backend shutting down.")


app = FastAPI(
    title="IntelliMeet AI",
    version="1.0.0",
    description="AI-powered meeting and lecture intelligence platform.",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(media.router)
app.include_router(meetings.router)
app.include_router(lectures.router)
app.include_router(transcripts.router)
app.include_router(action_items.router)
app.include_router(notes.router)
app.include_router(bookmarks.router)
app.include_router(flashcards.router)
app.include_router(quizzes.router)
app.include_router(assistant.router)
app.include_router(search.router)
app.include_router(analytics.router)
app.include_router(calendar.router)
app.include_router(settings_api.router)
app.include_router(exports.router)
app.include_router(demo.router)


@app.get("/api/health", tags=["health"])
def health_check():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/api/config", tags=["config"])
def config_status():
    """Return AI provider configuration status without exposing secrets."""
    return {
        "is_ai_configured": settings.is_ai_configured,
        "is_transcription_configured": settings.is_transcription_configured,
        "demo_mode": settings.DEMO_MODE,
    }


# ── Serve the built frontend SPA (single-service deployment) ───────────────
# When the frontend has been built (frontend/dist exists), serve it from the
# same origin as the API so the whole app runs as one service with no CORS.
# backend/app/main.py -> parents[2] is the repository root.
_FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"

if _FRONTEND_DIST.is_dir():
    @app.get("/{full_path:path}")
    async def _serve_spa(full_path: str):
        # Never intercept API routes
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        # Serve a real static file if it exists and stays within dist
        if full_path:
            candidate = (_FRONTEND_DIST / full_path).resolve()
            try:
                candidate.relative_to(_FRONTEND_DIST)
                if candidate.is_file():
                    return FileResponse(candidate)
            except ValueError:
                pass  # path escaped dist; ignore
        # Fallback to the SPA shell for client-side routing
        index = _FRONTEND_DIST / "index.html"
        if index.is_file():
            return FileResponse(index)
        raise HTTPException(status_code=404, detail="Frontend build not found")
