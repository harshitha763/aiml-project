"""Database models for IntelliMeet AI."""
from app.models.user import User
from app.models.media import MediaAsset
from app.models.meeting import Meeting
from app.models.lecture import Lecture
from app.models.transcript import Transcript, TranscriptSegment
from app.models.summary import Summary
from app.models.action_item import ActionItem
from app.models.note import PersonalNote, Bookmark
from app.models.flashcard import Flashcard, FlashcardReview
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.calendar_event import CalendarEvent
from app.models.notification import Notification
from app.models.assistant import AssistantConversation, AssistantMessage
from app.models.tag import Tag, ResourceTag
from app.models.setting import UserSetting

__all__ = [
    "User", "MediaAsset", "Meeting", "Lecture", "Transcript", "TranscriptSegment",
    "Summary", "ActionItem", "PersonalNote", "Bookmark", "Flashcard", "FlashcardReview",
    "Quiz", "QuizQuestion", "QuizAttempt", "QuizAnswer", "CalendarEvent", "Notification",
    "AssistantConversation", "AssistantMessage", "Tag", "ResourceTag", "UserSetting",
]
