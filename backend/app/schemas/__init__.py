"""Pydantic schemas for IntelliMeet AI."""
from app.schemas.auth import (
    UserCreate, UserLogin, UserResponse, Token, UserUpdate,
)
from app.schemas.common import PaginatedResponse, ErrorResponse, SuccessResponse
from app.schemas.media import MediaAssetResponse, MediaAssetUpdate, UploadResponse
from app.schemas.meeting import (
    MeetingCreate, MeetingUpdate, MeetingResponse, MeetingReport,
    FollowUpDraftResponse,
)
from app.schemas.lecture import LectureCreate, LectureUpdate, LectureResponse
from app.schemas.transcript import (
    TranscriptResponse, TranscriptSegmentResponse,
    TranscriptSegmentUpdate, TranscriptUpdate,
)
from app.schemas.summary import SummaryResponse, GenerateSummaryRequest
from app.schemas.action_item import (
    ActionItemCreate, ActionItemUpdate, ActionItemResponse,
)
from app.schemas.note import (
    NoteCreate, NoteUpdate, NoteResponse, BookmarkCreate, BookmarkResponse,
    GenerateNotesRequest,
)
from app.schemas.flashcard import (
    FlashcardCreate, FlashcardUpdate, FlashcardResponse, FlashcardReviewRequest,
)
from app.schemas.quiz import (
    QuizResponse, QuizQuestionResponse, QuizAttemptCreate,
    QuizAttemptResponse, GenerateQuizRequest,
)
from app.schemas.assistant import (
    AssistantAskRequest, AssistantAskResponse,
    ConversationResponse, MessageResponse,
)
from app.schemas.search import SearchResult, SearchResponse
from app.schemas.analytics import AnalyticsResponse, DashboardStats
from app.schemas.calendar import (
    CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse,
)
from app.schemas.settings import UserSettingResponse, UserSettingUpdate

__all__ = [
    # auth
    "UserCreate", "UserLogin", "UserResponse", "Token", "UserUpdate",
    # common
    "PaginatedResponse", "ErrorResponse", "SuccessResponse",
    # media
    "MediaAssetResponse", "MediaAssetUpdate", "UploadResponse",
    # meeting
    "MeetingCreate", "MeetingUpdate", "MeetingResponse", "MeetingReport",
    "FollowUpDraftResponse",
    # lecture
    "LectureCreate", "LectureUpdate", "LectureResponse",
    # transcript
    "TranscriptResponse", "TranscriptSegmentResponse",
    "TranscriptSegmentUpdate", "TranscriptUpdate",
    # summary
    "SummaryResponse", "GenerateSummaryRequest",
    # action item
    "ActionItemCreate", "ActionItemUpdate", "ActionItemResponse",
    # note
    "NoteCreate", "NoteUpdate", "NoteResponse", "BookmarkCreate",
    "BookmarkResponse", "GenerateNotesRequest",
    # flashcard
    "FlashcardCreate", "FlashcardUpdate", "FlashcardResponse",
    "FlashcardReviewRequest",
    # quiz
    "QuizResponse", "QuizQuestionResponse", "QuizAttemptCreate",
    "QuizAttemptResponse", "GenerateQuizRequest",
    # assistant
    "AssistantAskRequest", "AssistantAskResponse",
    "ConversationResponse", "MessageResponse",
    # search
    "SearchResult", "SearchResponse",
    # analytics
    "AnalyticsResponse", "DashboardStats",
    # calendar
    "CalendarEventCreate", "CalendarEventUpdate", "CalendarEventResponse",
    # settings
    "UserSettingResponse", "UserSettingUpdate",
]
