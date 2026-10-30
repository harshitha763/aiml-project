"""AI provider abstraction layer.

Implements an abstract AIProvider interface plus concrete providers for
OpenAI-compatible APIs, Groq, Anthropic, and a Demo fallback provider.

All DemoAIProvider responses are clearly labeled with "[Demo Mode]" so users
always know when real AI is not configured.
"""
from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

DEMO_PREFIX = "[Demo Mode] "


# --------------------------------------------------------------------------- #
# Result data classes
# --------------------------------------------------------------------------- #
@dataclass
class SummaryResult:
    text: str
    key_points: list[str]
    decisions: list[str]
    unresolved_questions: list[str]
    risks: list[str]
    next_steps: list[str]


@dataclass
class NotesResult:
    title: str
    content: str
    note_type: str = "revision"


@dataclass
class FlashcardItem:
    front: str
    back: str
    topic: str = ""


@dataclass
class QuizItem:
    question: str
    options: list[str]
    correct_answer: str
    explanation: str = ""
    topic: str = ""
    question_type: str = "multiple_choice"


# --------------------------------------------------------------------------- #
# Abstract interface
# --------------------------------------------------------------------------- #
class AIProvider(ABC):
    """Abstract AI provider interface."""

    @property
    @abstractmethod
    def is_demo(self) -> bool:
        ...

    @abstractmethod
    def generate_summary(self, text: str, summary_type: str = "meeting",
                          length: str = "medium") -> SummaryResult:
        ...

    @abstractmethod
    def answer_question(self, question: str, context: str) -> tuple[str, list[dict]]:
        """Return (answer, references)."""
        ...

    @abstractmethod
    def generate_notes(self, text: str, level: str = "intermediate",
                       note_format: str = "detailed") -> NotesResult:
        ...

    @abstractmethod
    def generate_flashcards(self, text: str, count: int = 5) -> list[FlashcardItem]:
        ...

    @abstractmethod
    def generate_quiz(self, text: str, num_questions: int = 5,
                      difficulty: str = "medium", topic: str = "") -> list[QuizItem]:
        ...

    def generate_follow_up_email(self, meeting_title: str, context: str,
                                 summary: str = "") -> str:
        """Generate a follow-up email draft. Default delegates to answer_question."""
        prompt = (
            f"Draft a concise professional follow-up email after a meeting titled "
            f"'{meeting_title}'. Context: {context}. Summary: {summary}."
        )
        answer, _ = self.answer_question(prompt, context)
        return answer


# --------------------------------------------------------------------------- #
# Demo provider
# --------------------------------------------------------------------------- #
class DemoAIProvider(AIProvider):
    """Fallback provider that returns clearly labeled demo content."""

    @property
    def is_demo(self) -> bool:
        return True

    def generate_summary(self, text: str, summary_type: str = "meeting",
                          length: str = "medium") -> SummaryResult:
        label = "Meeting" if summary_type == "meeting" else "Lecture"
        text_preview = (text or "").strip()[:240]
        return SummaryResult(
            text=(
                f"{DEMO_PREFIX}{label} Summary (demonstration content).\n\n"
                f"This is a sample summary generated without a configured AI provider. "
                f"Configure an LLM provider (OpenAI, Groq, or Anthropic) in your .env to "
                f"produce real summaries from your content.\n\n"
                f"Source preview: {text_preview or '(no content available)'}"
            ),
            key_points=[
                "Key point one (demo): main topic discussed during the session",
                "Key point two (demo): important decision reached",
                "Key point three (demo): follow-up action identified",
            ],
            decisions=[
                "Decision one (demo): adopt the proposed approach",
                "Decision two (demo): schedule a follow-up review",
            ],
            unresolved_questions=[
                "Unresolved question one (demo): who owns the next deliverable?",
                "Unresolved question two (demo): what is the final budget?",
            ],
            risks=["Risk one (demo): timeline may slip if dependencies are delayed"],
            next_steps=[
                "Next step one (demo): circulate the summary to participants",
                "Next step two (demo): confirm owners for action items",
            ],
        )

    def answer_question(self, question: str, context: str) -> tuple[str, list[dict]]:
        answer = (
            f"{DEMO_PREFIX}I'm running in demonstration mode, so I can't analyze the "
            f"actual content with a real AI model. Once an LLM provider is configured, "
            f"I'll answer questions like \"{question}\" based on the resource content."
        )
        refs = [{"source": "demo", "preview": (context or "")[:200], "timestamp": 0}]
        return answer, refs

    def generate_notes(self, text: str, level: str = "intermediate",
                       note_format: str = "detailed") -> NotesResult:
        fmt = note_format if note_format in {"short", "detailed", "bullet", "qa"} else "detailed"
        if fmt == "bullet":
            content = (
                f"{DEMO_PREFIX}Study notes (demonstration, {level} level):\n"
                "- Concept one: key definition and example\n"
                "- Concept two: how it relates to the broader topic\n"
                "- Concept three: common pitfalls to avoid\n"
                "- Concept four: practice questions to try"
            )
        elif fmt == "qa":
            content = (
                f"{DEMO_PREFIX}Study notes (demonstration, {level} level):\n"
                "Q: What is the main concept?\nA: A brief explanation (demo).\n\n"
                "Q: Why does it matter?\nA: Because of its application (demo).\n\n"
                "Q: How is it applied?\nA: Through the steps outlined (demo)."
            )
        elif fmt == "short":
            content = (
                f"{DEMO_PREFIX}Short study notes (demo, {level} level): the core ideas "
                f"of the session condensed into a quick review."
            )
        else:
            content = (
                f"{DEMO_PREFIX}Detailed study notes (demonstration, {level} level):\n\n"
                "1. Introduction: overview of the topic and why it matters.\n"
                "2. Core concepts: definitions, formulas, and key terms.\n"
                "3. Worked examples: step-by-step illustrations.\n"
                "4. Common mistakes: what to watch out for.\n"
                "5. Summary: the most important takeaways.\n"
                "6. Practice: suggested exercises to reinforce learning."
            )
        return NotesResult(title="Demo Study Notes", content=content, note_type="revision")

    def generate_flashcards(self, text: str, count: int = 5) -> list[FlashcardItem]:
        cards = []
        n = max(1, min(count, 5))
        samples = [
            ("What is the main topic of this material?", "The primary subject covered (demo answer).", "Overview"),
            ("Define a key term from the session.", "A core concept explained in the lecture (demo).", "Key Terms"),
            ("Give an example application.", "A practical use case of the concept (demo).", "Applications"),
            ("What is a common pitfall?", "A frequent misunderstanding to avoid (demo).", "Pitfalls"),
            ("Summarize the takeaway in one sentence.", "The single most important idea (demo).", "Summary"),
        ]
        for i in range(n):
            front, back, topic = samples[i % len(samples)]
            cards.append(
                FlashcardItem(
                    front=f"{DEMO_PREFIX}{front}",
                    back=f"{DEMO_PREFIX}{back}",
                    topic=topic,
                )
            )
        return cards

    def generate_quiz(self, text: str, num_questions: int = 5,
                      difficulty: str = "medium", topic: str = "") -> list[QuizItem]:
        n = max(1, min(num_questions, 5))
        samples = [
            QuizItem(
                question="What is the main topic covered?",
                options=["Option A", "Option B", "Option C", "Option D"],
                correct_answer="Option A",
                explanation="Demo explanation: the main topic is Option A.",
                topic=topic or "Overview",
            ),
            QuizItem(
                question="Which of the following is a key concept?",
                options=["Concept 1", "Concept 2", "Concept 3", "Concept 4"],
                correct_answer="Concept 1",
                explanation="Demo explanation: Concept 1 is central to the topic.",
                topic=topic or "Key Concepts",
            ),
            QuizItem(
                question="True or False: This is a demonstration quiz.",
                options=["True", "False"],
                correct_answer="True",
                explanation="Demo explanation: this quiz was generated in demo mode.",
                topic=topic or "General",
                question_type="true_false",
            ),
            QuizItem(
                question="What is a common application of the topic?",
                options=["Use case A", "Use case B", "Use case C", "Use case D"],
                correct_answer="Use case A",
                explanation="Demo explanation: Use case A is the most direct application.",
                topic=topic or "Applications",
            ),
            QuizItem(
                question="Briefly explain the main takeaway.",
                options=["A short answer (demo)"],
                correct_answer="A short answer describing the core idea (demo).",
                explanation="Demo explanation: the takeaway summarizes the material.",
                topic=topic or "Summary",
                question_type="short_answer",
            ),
        ]
        return [samples[i % len(samples)] for i in range(n)]

    def generate_follow_up_email(self, meeting_title: str, context: str,
                                 summary: str = "") -> str:
        return (
            f"{DEMO_PREFIX}Subject: Follow-up — {meeting_title}\n\n"
            "Hi everyone,\n\n"
            "Thank you for attending the session. This is a demonstration follow-up "
            "email generated without a configured AI provider. Below is a placeholder "
            "recap of what was discussed and the next steps.\n\n"
            "Recap: (demo content summary)\n\n"
            "Action items:\n- Owner A to follow up on deliverable one\n"
            "- Owner B to share the draft document\n\n"
            "Please reach out with any questions.\n\nBest regards,\nIntelliMeet AI"
        )


# --------------------------------------------------------------------------- #
# OpenAI-compatible provider
# --------------------------------------------------------------------------- #
class OpenAIProvider(AIProvider):
    def __init__(self, api_key: str, model: str, base_url: str = ""):
        self.api_key = api_key
        self.model = model or "gpt-4o-mini"
        self.base_url = (base_url or "https://api.openai.com/v1").rstrip("/")
        if self.base_url.endswith("/v1") is False and "openai.com" in self.base_url:
            self.base_url = self.base_url.rstrip("/") + "/v1"

    @property
    def is_demo(self) -> bool:
        return False

    def _chat(self, messages: list[dict], temperature: float = 0.3) -> str:
        url = f"{self.base_url}/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
        }
        with httpx.Client(timeout=120.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError):
            return ""

    def _chat_json(self, messages: list[dict], temperature: float = 0.3) -> Any:
        raw = self._chat(messages, temperature)
        return _safe_json(raw)

    def generate_summary(self, text: str, summary_type: str = "meeting",
                          length: str = "medium") -> SummaryResult:
        length_hint = {"short": "concise", "medium": "moderate", "long": "thorough"}.get(length, "moderate")
        kind = "meeting" if summary_type == "meeting" else "lecture"
        system = (
            f"You are an expert assistant that produces structured {kind} summaries. "
            f"Respond ONLY with a JSON object containing keys: "
            f"text, key_points (array), decisions (array), unresolved_questions (array), "
            f"risks (array), next_steps (array)."
        )
        user = (
            f"Summarize the following {kind} content at a {length_hint} level of detail:\n\n"
            f"{(text or '')[:12000]}"
        )
        data = self._chat_json(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ]
        )
        if not isinstance(data, dict):
            data = {"text": str(data)}
        return SummaryResult(
            text=str(data.get("text", "")),
            key_points=list(data.get("key_points", [])),
            decisions=list(data.get("decisions", [])),
            unresolved_questions=list(data.get("unresolved_questions", [])),
            risks=list(data.get("risks", [])),
            next_steps=list(data.get("next_steps", [])),
        )

    def answer_question(self, question: str, context: str) -> tuple[str, list[dict]]:
        system = (
            "You are a helpful assistant that answers questions strictly based on the "
            "provided context. If the answer is not in the context, say so. "
            "Respond with a JSON object containing keys: answer (string), references "
            "(array of {source, preview, timestamp})."
        )
        user = (
            f"Context:\n{(context or '')[:12000]}\n\nQuestion: {question}\n\nAnswer:"
        )
        data = self._chat_json(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ]
        )
        if not isinstance(data, dict):
            data = {"answer": str(data), "references": []}
        answer = str(data.get("answer", ""))
        refs = list(data.get("references", [])) if isinstance(data.get("references"), list) else []
        return answer, refs

    def generate_notes(self, text: str, level: str = "intermediate",
                       note_format: str = "detailed") -> NotesResult:
        system = (
            "You are an expert tutor. Generate structured study notes from the provided "
            "lecture content. Respond ONLY with a JSON object containing keys: "
            "title (string), content (string with markdown formatting)."
        )
        user = (
            f"Create {note_format} study notes at {level} level from:\n\n"
            f"{(text or '')[:12000]}"
        )
        data = self._chat_json(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ]
        )
        if not isinstance(data, dict):
            data = {"title": "Study Notes", "content": str(data)}
        return NotesResult(
            title=str(data.get("title", "Study Notes")),
            content=str(data.get("content", "")),
            note_type="revision",
        )

    def generate_flashcards(self, text: str, count: int = 5) -> list[FlashcardItem]:
        system = (
            "You are an expert tutor. Generate flashcards from the content. Respond ONLY "
            "with a JSON array of objects with keys: front, back, topic."
        )
        user = f"Create {count} flashcards from:\n\n{(text or '')[:12000]}"
        data = self._chat_json(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ]
        )
        items: list[FlashcardItem] = []
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    items.append(
                        FlashcardItem(
                            front=str(item.get("front", "")),
                            back=str(item.get("back", "")),
                            topic=str(item.get("topic", "")),
                        )
                    )
        return items

    def generate_quiz(self, text: str, num_questions: int = 5,
                      difficulty: str = "medium", topic: str = "") -> list[QuizItem]:
        system = (
            "You are an expert quiz generator. Create quiz questions from the content. "
            "Respond ONLY with a JSON array of objects with keys: question, options (array), "
            "correct_answer, explanation, topic, question_type "
            "(multiple_choice, true_false, or short_answer)."
        )
        user = (
            f"Create {num_questions} {difficulty} quiz questions"
            f"{' about ' + topic if topic else ''} from:\n\n{(text or '')[:12000]}"
        )
        data = self._chat_json(
            [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ]
        )
        items: list[QuizItem] = []
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    options = item.get("options", [])
                    if not isinstance(options, list):
                        options = []
                    items.append(
                        QuizItem(
                            question=str(item.get("question", "")),
                            options=[str(o) for o in options],
                            correct_answer=str(item.get("correct_answer", "")),
                            explanation=str(item.get("explanation", "")),
                            topic=str(item.get("topic", "")),
                            question_type=str(item.get("question_type", "multiple_choice")),
                        )
                    )
        return items


# --------------------------------------------------------------------------- #
# Groq provider (OpenAI-compatible chat completions API)
# --------------------------------------------------------------------------- #
class GroqProvider(AIProvider):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model or "llama-3.3-70b-versatile"
        self.base_url = "https://api.groq.com/openai/v1"

    @property
    def is_demo(self) -> bool:
        return False

    def _delegate(self) -> OpenAIProvider:
        return OpenAIProvider(self.api_key, self.model, self.base_url)

    def generate_summary(self, text: str, summary_type: str = "meeting",
                          length: str = "medium") -> SummaryResult:
        return self._delegate().generate_summary(text, summary_type, length)

    def answer_question(self, question: str, context: str) -> tuple[str, list[dict]]:
        return self._delegate().answer_question(question, context)

    def generate_notes(self, text: str, level: str = "intermediate",
                       note_format: str = "detailed") -> NotesResult:
        return self._delegate().generate_notes(text, level, note_format)

    def generate_flashcards(self, text: str, count: int = 5) -> list[FlashcardItem]:
        return self._delegate().generate_flashcards(text, count)

    def generate_quiz(self, text: str, num_questions: int = 5,
                      difficulty: str = "medium", topic: str = "") -> list[QuizItem]:
        return self._delegate().generate_quiz(text, num_questions, difficulty, topic)


# --------------------------------------------------------------------------- #
# Anthropic provider
# --------------------------------------------------------------------------- #
class AnthropicProvider(AIProvider):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model or "claude-3-5-sonnet-20241022"
        self.base_url = "https://api.anthropic.com/v1"

    @property
    def is_demo(self) -> bool:
        return False

    def _chat(self, system: str, user: str, temperature: float = 0.3) -> str:
        url = f"{self.base_url}/messages"
        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "max_tokens": 4096,
            "temperature": temperature,
            "system": system,
            "messages": [{"role": "user", "content": user}],
        }
        with httpx.Client(timeout=120.0) as client:
            resp = client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
        try:
            return data["content"][0]["text"]
        except (KeyError, IndexError):
            return ""

    def _chat_json(self, system: str, user: str, temperature: float = 0.3) -> Any:
        return _safe_json(self._chat(system, user, temperature))

    def generate_summary(self, text: str, summary_type: str = "meeting",
                          length: str = "medium") -> SummaryResult:
        length_hint = {"short": "concise", "medium": "moderate", "long": "thorough"}.get(length, "moderate")
        kind = "meeting" if summary_type == "meeting" else "lecture"
        system = (
            f"You are an expert assistant that produces structured {kind} summaries. "
            f"Respond ONLY with a JSON object with keys: "
            f"text, key_points (array), decisions (array), unresolved_questions (array), "
            f"risks (array), next_steps (array)."
        )
        user = (
            f"Summarize the following {kind} content at a {length_hint} level:\n\n"
            f"{(text or '')[:12000]}"
        )
        data = self._chat_json(system, user)
        if not isinstance(data, dict):
            data = {"text": str(data)}
        return SummaryResult(
            text=str(data.get("text", "")),
            key_points=list(data.get("key_points", [])),
            decisions=list(data.get("decisions", [])),
            unresolved_questions=list(data.get("unresolved_questions", [])),
            risks=list(data.get("risks", [])),
            next_steps=list(data.get("next_steps", [])),
        )

    def answer_question(self, question: str, context: str) -> tuple[str, list[dict]]:
        system = (
            "You are a helpful assistant that answers questions strictly based on the "
            "provided context. Respond with a JSON object containing keys: "
            "answer (string), references (array of {source, preview, timestamp})."
        )
        user = f"Context:\n{(context or '')[:12000]}\n\nQuestion: {question}\n\nAnswer:"
        data = self._chat_json(system, user)
        if not isinstance(data, dict):
            data = {"answer": str(data), "references": []}
        return str(data.get("answer", "")), list(data.get("references", []) or [])

    def generate_notes(self, text: str, level: str = "intermediate",
                       note_format: str = "detailed") -> NotesResult:
        system = (
            "You are an expert tutor. Generate structured study notes. Respond ONLY with "
            "a JSON object with keys: title (string), content (string with markdown)."
        )
        user = f"Create {note_format} notes at {level} level from:\n\n{(text or '')[:12000]}"
        data = self._chat_json(system, user)
        if not isinstance(data, dict):
            data = {"title": "Study Notes", "content": str(data)}
        return NotesResult(
            title=str(data.get("title", "Study Notes")),
            content=str(data.get("content", "")),
            note_type="revision",
        )

    def generate_flashcards(self, text: str, count: int = 5) -> list[FlashcardItem]:
        system = (
            "You are an expert tutor. Generate flashcards. Respond ONLY with a JSON array "
            "of objects with keys: front, back, topic."
        )
        user = f"Create {count} flashcards from:\n\n{(text or '')[:12000]}"
        data = self._chat_json(system, user)
        items: list[FlashcardItem] = []
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    items.append(
                        FlashcardItem(
                            front=str(item.get("front", "")),
                            back=str(item.get("back", "")),
                            topic=str(item.get("topic", "")),
                        )
                    )
        return items

    def generate_quiz(self, text: str, num_questions: int = 5,
                      difficulty: str = "medium", topic: str = "") -> list[QuizItem]:
        system = (
            "You are an expert quiz generator. Respond ONLY with a JSON array of objects "
            "with keys: question, options (array), correct_answer, explanation, topic, "
            "question_type (multiple_choice, true_false, or short_answer)."
        )
        user = (
            f"Create {num_questions} {difficulty} quiz questions"
            f"{' about ' + topic if topic else ''} from:\n\n{(text or '')[:12000]}"
        )
        data = self._chat_json(system, user)
        items: list[QuizItem] = []
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    options = item.get("options", [])
                    if not isinstance(options, list):
                        options = []
                    items.append(
                        QuizItem(
                            question=str(item.get("question", "")),
                            options=[str(o) for o in options],
                            correct_answer=str(item.get("correct_answer", "")),
                            explanation=str(item.get("explanation", "")),
                            topic=str(item.get("topic", "")),
                            question_type=str(item.get("question_type", "multiple_choice")),
                        )
                    )
        return items


# --------------------------------------------------------------------------- #
# Factory
# --------------------------------------------------------------------------- #
_provider_cache: AIProvider | None = None


def get_ai_provider() -> AIProvider:
    """Return the configured AI provider, falling back to DemoAIProvider.

    Selection priority:
        1. OpenAI (if OPENAI_API_KEY set; supports custom base_url for local models)
        2. Groq (if GROQ_API_KEY set)
        3. Anthropic (if ANTHROPIC_API_KEY set)
        4. DemoAIProvider (clearly labeled demo content)
    """
    global _provider_cache
    if _provider_cache is not None:
        return _provider_cache

    try:
        if settings.OPENAI_API_KEY:
            _provider_cache = OpenAIProvider(
                settings.OPENAI_API_KEY,
                settings.OPENAI_MODEL,
                settings.OPENAI_BASE_URL,
            )
            return _provider_cache
        if settings.GROQ_API_KEY:
            _provider_cache = GroqProvider(settings.GROQ_API_KEY, settings.GROQ_MODEL)
            return _provider_cache
        if settings.ANTHROPIC_API_KEY:
            _provider_cache = AnthropicProvider(
                settings.ANTHROPIC_API_KEY, settings.ANTHROPIC_MODEL
            )
            return _provider_cache
    except Exception:  # pragma: no cover - defensive
        logger.exception("Failed to initialize AI provider; falling back to demo mode.")

    _provider_cache = DemoAIProvider()
    return _provider_cache


def reset_ai_provider_cache() -> None:
    """Reset the cached provider (useful for tests)."""
    global _provider_cache
    _provider_cache = None


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _safe_json(raw: str) -> Any:
    """Best-effort parse of a JSON object/array from a model response."""
    if not raw:
        return {}
    raw = raw.strip()
    # Strip markdown code fences if present.
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        # Try to find the first { or [ and parse from there.
        for start_char in ("{", "["):
            idx = raw.find(start_char)
            if idx == -1:
                continue
            for end_char in ("}", "]"):
                end_idx = raw.rfind(end_char)
                if end_idx != -1 and end_idx > idx:
                    try:
                        return json.loads(raw[idx : end_idx + 1])
                    except json.JSONDecodeError:
                        continue
        return {"text": raw}
