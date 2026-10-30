"""Seed demonstration data for a user.

All demo records are flagged with is_demo=True (or "true" for the string
columns) so they can be identified and removed cleanly.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.media import MediaAsset
from app.models.meeting import Meeting
from app.models.lecture import Lecture
from app.models.transcript import Transcript, TranscriptSegment
from app.models.summary import Summary
from app.models.action_item import ActionItem
from app.models.note import PersonalNote, Bookmark
from app.models.flashcard import Flashcard
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.calendar_event import CalendarEvent
from app.models.setting import UserSetting

logger = logging.getLogger(__name__)

DEMO_TAG = "[Demo] "


def seed_demo_data(db: Session, user_id: str) -> dict:
    """Create realistic demonstration records for the given user.

    Returns a summary of created record counts.
    """
    now = datetime.now(timezone.utc)

    # 1. Media asset
    media = MediaAsset(
        user_id=user_id,
        filename="demo-meeting-recording.mp3",
        stored_filename="demo-meeting-recording.mp3",
        file_path="",
        file_size=1024000,
        mime_type="audio/mpeg",
        media_type="audio",
        duration_seconds=92.0,
        language="en",
        title=DEMO_TAG + "Q3 Product Roadmap Meeting",
        description="Demonstration audio recording.",
        category="meeting",
        status="completed",
        status_message="Demo transcription complete",
        progress=1.0,
    )
    db.add(media)
    db.commit()
    db.refresh(media)

    # 2. Transcript with segments
    transcript = Transcript(
        media_asset_id=media.id,
        full_text=(
            "Speaker 1: Welcome everyone. Thanks for joining today's meeting on the new product roadmap.\n"
            "Speaker 2: Thanks for having me. I'm excited to share the updates from the engineering team.\n"
            "Speaker 1: Great. Let's start with the priorities for the next quarter.\n"
            "Speaker 2: We have three main goals: ship the new dashboard, improve API performance, and launch the mobile beta.\n"
        ),
        language="en",
        duration_seconds=92.0,
        speaker_count=2,
        is_demo="true",
    )
    db.add(transcript)
    db.commit()
    db.refresh(transcript)

    segments = [
        (0, "Speaker 1", "Welcome everyone. Thanks for joining today's meeting on the new product roadmap.", 0.0, 8.5),
        (1, "Speaker 2", "Thanks for having me. I'm excited to share the updates from the engineering team.", 8.5, 14.2),
        (2, "Speaker 1", "Great. Let's start with the priorities for the next quarter. What are the key deliverables?", 14.2, 21.0),
        (3, "Speaker 2", "We have three main goals: ship the new dashboard, improve API performance, and launch the mobile beta.", 21.0, 30.4),
        (4, "Speaker 1", "Which of those is the highest priority for the team?", 30.4, 34.1),
        (5, "Speaker 2", "The dashboard is the highest priority because it directly improves customer onboarding.", 34.1, 41.8),
    ]
    for index, speaker, text, start, end in segments:
        db.add(
            TranscriptSegment(
                transcript_id=transcript.id,
                index=index,
                speaker=speaker,
                text=text,
                start_time=start,
                end_time=end,
                confidence=0.95,
            )
        )
    db.commit()

    # 3. Meeting
    meeting = Meeting(
        user_id=user_id,
        title=DEMO_TAG + "Q3 Product Roadmap Meeting",
        description="Demonstration meeting to showcase IntelliMeet AI features.",
        date=now - timedelta(days=2),
        duration_minutes=45,
        participants="Alice Johnson, Bob Smith",
        location="Conference Room A",
        media_asset_id=media.id,
        status="completed",
        notes="Demo meeting notes.",
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)

    # 4. Summary
    summary = Summary(
        meeting_id=meeting.id,
        summary_text=(
            DEMO_TAG + "The team discussed priorities for the next quarter. The new dashboard "
            "is the highest priority because it improves customer onboarding. Action items "
            "include finalizing the spec and following up with the design team."
        ),
        key_points=json.dumps([
            "Dashboard is the top priority for the quarter",
            "Three goals: dashboard, API performance, mobile beta",
            "Design dependency is a key risk",
        ]),
        decisions=json.dumps([
            "Prioritize the new dashboard",
            "Schedule design follow-up on Monday",
        ]),
        unresolved_questions=json.dumps([
            "Budget approval for additional QA resources",
        ]),
        risks=json.dumps(["Timeline may slip if design components are delayed"]),
        next_steps=json.dumps([
            "Send technical spec by Wednesday",
            "Review spec together on Thursday",
            "Confirm budget with finance",
        ]),
        is_demo=True,
    )
    db.add(summary)
    db.commit()

    # 5. Action items
    action_items = [
        ActionItem(
            meeting_id=meeting.id,
            user_id=user_id,
            description=DEMO_TAG + "Send the technical specification to the team",
            owner="Bob Smith",
            due_date=now + timedelta(days=3),
            priority="high",
            status="pending",
            completed=False,
        ),
        ActionItem(
            meeting_id=meeting.id,
            user_id=user_id,
            description=DEMO_TAG + "Confirm budget approval with finance",
            owner="Alice Johnson",
            due_date=now + timedelta(days=7),
            priority="medium",
            status="pending",
            completed=False,
        ),
        ActionItem(
            meeting_id=meeting.id,
            user_id=user_id,
            description=DEMO_TAG + "Follow up with design team on component timelines",
            owner="Alice Johnson",
            due_date=now + timedelta(days=1),
            priority="high",
            status="completed",
            completed=True,
        ),
    ]
    for ai in action_items:
        db.add(ai)
    db.commit()

    # 6. Notes
    note = PersonalNote(
        user_id=user_id,
        meeting_id=meeting.id,
        title=DEMO_TAG + "Meeting Notes — Roadmap",
        content=(
            DEMO_TAG + "Key takeaways:\n"
            "- Dashboard is the priority\n"
            "- Design dependency risk\n"
            "- Need budget approval for QA resources"
        ),
        note_type="general",
    )
    db.add(note)
    db.commit()

    # 7. Bookmark
    db.add(
        Bookmark(
            user_id=user_id,
            meeting_id=meeting.id,
            media_asset_id=media.id,
            label=DEMO_TAG + "Priority discussion",
            note="Where the team decided the dashboard is the top priority.",
            timestamp=34.1,
        )
    )
    db.commit()

    # 8. Lecture
    lecture = Lecture(
        user_id=user_id,
        title=DEMO_TAG + "Introduction to Machine Learning",
        description="Demonstration lecture on supervised learning fundamentals.",
        subject="Machine Learning",
        lecturer="Dr. Demo Lecturer",
        date=now - timedelta(days=1),
        duration_minutes=60,
        explanation_level="intermediate",
        revision_status="not_started",
        status="completed",
    )
    db.add(lecture)
    db.commit()
    db.refresh(lecture)

    lecture_summary = Summary(
        lecture_id=lecture.id,
        summary_text=(
            DEMO_TAG + "This lecture introduced supervised learning, covering linear "
            "regression, decision trees, and evaluation metrics such as accuracy and F1 score."
        ),
        key_points=json.dumps([
            "Supervised learning uses labeled data",
            "Linear regression models continuous outcomes",
            "Evaluation metrics: accuracy, precision, recall, F1",
        ]),
        decisions=json.dumps([]),
        unresolved_questions=json.dumps(["How to handle class imbalance?" ]),
        risks=json.dumps([]),
        next_steps=json.dumps(["Practice on a sample dataset"]),
        is_demo=True,
    )
    db.add(lecture_summary)
    db.commit()

    # 9. Flashcards
    flashcards = [
        Flashcard(
            user_id=user_id,
            lecture_id=lecture.id,
            front=DEMO_TAG + "What is supervised learning?",
            back=DEMO_TAG + "A type of machine learning where the model learns from labeled training data.",
            topic="Supervised Learning",
            difficulty="easy",
            is_demo="true",
        ),
        Flashcard(
            user_id=user_id,
            lecture_id=lecture.id,
            front=DEMO_TAG + "Define linear regression.",
            back=DEMO_TAG + "A model that predicts a continuous value as a linear function of inputs.",
            topic="Linear Regression",
            difficulty="medium",
            is_demo="true",
        ),
        Flashcard(
            user_id=user_id,
            lecture_id=lecture.id,
            front=DEMO_TAG + "What does the F1 score measure?",
            back=DEMO_TAG + "The harmonic mean of precision and recall, balancing both metrics.",
            topic="Evaluation Metrics",
            difficulty="medium",
            is_demo="true",
        ),
    ]
    for fc in flashcards:
        db.add(fc)
    db.commit()

    # 10. Quiz
    quiz = Quiz(
        user_id=user_id,
        lecture_id=lecture.id,
        title=DEMO_TAG + "ML Fundamentals Quiz",
        description="Demonstration quiz on supervised learning.",
        difficulty="medium",
        is_demo="true",
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    questions = [
        QuizQuestion(
            quiz_id=quiz.id,
            question_type="multiple_choice",
            question=DEMO_TAG + "Which learning type uses labeled data?",
            options=json.dumps(["Supervised", "Unsupervised", "Reinforcement", "Transfer"]),
            correct_answer="Supervised",
            explanation="Supervised learning trains on labeled examples.",
            topic="Supervised Learning",
            order_index=0,
        ),
        QuizQuestion(
            quiz_id=quiz.id,
            question_type="multiple_choice",
            question=DEMO_TAG + "Which metric balances precision and recall?",
            options=json.dumps(["Accuracy", "F1 score", "MSE", "R2"]),
            correct_answer="F1 score",
            explanation="F1 is the harmonic mean of precision and recall.",
            topic="Evaluation Metrics",
            order_index=1,
        ),
        QuizQuestion(
            quiz_id=quiz.id,
            question_type="true_false",
            question=DEMO_TAG + "Linear regression predicts continuous values.",
            options=json.dumps(["True", "False"]),
            correct_answer="True",
            explanation="Linear regression outputs continuous numeric values.",
            topic="Linear Regression",
            order_index=2,
        ),
    ]
    for q in questions:
        db.add(q)
    db.commit()

    # 11. Calendar event
    db.add(
        CalendarEvent(
            user_id=user_id,
            title=DEMO_TAG + "Follow-up review",
            description="Demonstration calendar event for the roadmap follow-up.",
            event_type="meeting",
            start_time=now + timedelta(days=5),
            end_time=now + timedelta(days=5, hours=1),
            location="Conference Room A",
            related_meeting_id=meeting.id,
            reminder_minutes="15",
        )
    )
    db.commit()

    # 12. User settings (create if missing)
    settings = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
    if settings is None:
        db.add(
            UserSetting(
                user_id=user_id,
                theme="dark",
                language="en",
                default_transcription_language="en",
                default_summary_length="medium",
                preferred_note_format="detailed",
                default_explanation_level="intermediate",
            )
        )
        db.commit()

    return {
        "meeting": 1,
        "lecture": 1,
        "transcript": 1,
        "summary": 2,
        "action_items": len(action_items),
        "notes": 1,
        "bookmarks": 1,
        "flashcards": len(flashcards),
        "quiz": 1,
        "calendar_event": 1,
    }


def delete_demo_data(db: Session, user_id: str) -> dict:
    """Delete all demo-flagged records for a user."""
    counts = {}

    transcripts = (
        db.query(Transcript).filter(Transcript.is_demo == "true").all()
    )
    for t in transcripts:
        # Only delete transcripts whose media asset belongs to the user.
        media_asset = db.query(MediaAsset).filter(MediaAsset.id == t.media_asset_id).first()
        if media_asset and media_asset.user_id == user_id:
            db.query(TranscriptSegment).filter(TranscriptSegment.transcript_id == t.id).delete()
            db.delete(t)
    db.commit()

    quizzes = db.query(Quiz).filter(Quiz.is_demo == "true", Quiz.user_id == user_id).all()
    counts["quiz"] = len(quizzes)
    for q in quizzes:
        db.query(QuizAnswer).filter(
            QuizAnswer.attempt_id.in_(
                db.query(QuizAttempt.id).filter(QuizAttempt.quiz_id == q.id)
            )
        ).delete(synchronize_session=False)
        db.query(QuizAttempt).filter(QuizAttempt.quiz_id == q.id).delete()
        db.query(QuizQuestion).filter(QuizQuestion.quiz_id == q.id).delete()
        db.delete(q)
    db.commit()

    flashcards = db.query(Flashcard).filter(Flashcard.is_demo == "true", Flashcard.user_id == user_id).all()
    counts["flashcards"] = len(flashcards)
    for f in flashcards:
        db.delete(f)
    db.commit()

    summaries = db.query(Summary).filter(Summary.is_demo == True,  # noqa: E712
                                         ).all()
    deleted_summaries = 0
    for s in summaries:
        meeting = db.query(Meeting).filter(Meeting.id == s.meeting_id).first() if s.meeting_id else None
        lecture = db.query(Lecture).filter(Lecture.id == s.lecture_id).first() if s.lecture_id else None
        if (meeting and meeting.user_id == user_id) or (lecture and lecture.user_id == user_id):
            db.delete(s)
            deleted_summaries += 1
    db.commit()
    counts["summaries"] = deleted_summaries

    action_items = db.query(ActionItem).filter(ActionItem.user_id == user_id).all()
    deleted_ai = 0
    for a in action_items:
        if a.description and a.description.startswith(DEMO_TAG):
            db.delete(a)
            deleted_ai += 1
    db.commit()
    counts["action_items"] = deleted_ai

    notes = db.query(PersonalNote).filter(PersonalNote.user_id == user_id).all()
    deleted_notes = 0
    for n in notes:
        if (n.title and n.title.startswith(DEMO_TAG)) or (n.content and n.content.startswith(DEMO_TAG)):
            db.delete(n)
            deleted_notes += 1
    db.commit()
    counts["notes"] = deleted_notes

    bookmarks = db.query(Bookmark).filter(Bookmark.user_id == user_id).all()
    deleted_bm = 0
    for b in bookmarks:
        if b.label and b.label.startswith(DEMO_TAG):
            db.delete(b)
            deleted_bm += 1
    db.commit()
    counts["bookmarks"] = deleted_bm

    meetings = db.query(Meeting).filter(Meeting.user_id == user_id).all()
    deleted_meetings = 0
    for m in meetings:
        if m.title and m.title.startswith(DEMO_TAG):
            db.delete(m)
            deleted_meetings += 1
    db.commit()
    counts["meetings"] = deleted_meetings

    lectures = db.query(Lecture).filter(Lecture.user_id == user_id).all()
    deleted_lectures = 0
    for l in lectures:
        if l.title and l.title.startswith(DEMO_TAG):
            db.delete(l)
            deleted_lectures += 1
    db.commit()
    counts["lectures"] = deleted_lectures

    media_assets = db.query(MediaAsset).filter(MediaAsset.user_id == user_id).all()
    deleted_media = 0
    for ma in media_assets:
        if ma.title and ma.title.startswith(DEMO_TAG):
            db.delete(ma)
            deleted_media += 1
    db.commit()
    counts["media_assets"] = deleted_media

    events = db.query(CalendarEvent).filter(CalendarEvent.user_id == user_id).all()
    deleted_events = 0
    for e in events:
        if e.title and e.title.startswith(DEMO_TAG):
            db.delete(e)
            deleted_events += 1
    db.commit()
    counts["calendar_events"] = deleted_events

    return counts
