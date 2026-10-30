"""Export services for transcripts, notes, and meeting reports (txt and PDF)."""
from __future__ import annotations

import io
from typing import Any

from app.models.transcript import Transcript, TranscriptSegment
from app.models.note import PersonalNote
from app.models.meeting import Meeting


# --------------------------------------------------------------------------- #
# Plain text exporters
# --------------------------------------------------------------------------- #
def export_transcript_txt(transcript: Transcript) -> bytes:
    lines: list[str] = [f"Transcript", f"Language: {transcript.language}", ""]
    for seg in transcript.segments:  # type: ignore[attr-defined]
        start = _format_time(seg.start_time)
        end = _format_time(seg.end_time)
        lines.append(f"[{start} - {end}] {seg.speaker}: {seg.text}")
    if not transcript.segments:
        lines.append(transcript.full_text or "(no transcript available)")
    return "\n".join(lines).encode("utf-8")


def export_notes_txt(note: PersonalNote) -> bytes:
    header = note.title or "Untitled note"
    body = note.content or ""
    return f"{header}\n{'=' * len(header)}\n\n{body}\n".encode("utf-8")


def export_meeting_report_txt(meeting: Meeting, report_data: dict[str, Any]) -> bytes:
    lines: list[str] = [
        f"Meeting Report: {meeting.title}",
        f"Date: {meeting.date}",
        f"Duration: {meeting.duration_minutes} minutes",
        f"Participants: {meeting.participants}",
        "",
        "Executive Summary",
        "-----------------",
        str(report_data.get("executive_summary", "")),
        "",
        "Purpose",
        "-------",
        str(report_data.get("purpose", "")),
        "",
        "Main Topics",
        "-----------",
    ]
    topics = report_data.get("main_topics", [])
    if isinstance(topics, list):
        for t in topics:
            lines.append(f"- {t}")
    lines.append("")
    lines += ["Decisions", "---------"]
    decisions = report_data.get("decisions", [])
    if isinstance(decisions, list):
        for d in decisions:
            lines.append(f"- {d}")
    lines += ["", "Action Items", "------------"]
    actions = report_data.get("action_items", [])
    if isinstance(actions, list):
        for a in actions:
            if isinstance(a, dict):
                owner = a.get("owner", "Unspecified")
                lines.append(f"- [{owner}] {a.get('description', '')}")
            else:
                lines.append(f"- {a}")
    lines += ["", "Responsible People", "------------------"]
    resp = report_data.get("responsible_people", [])
    if isinstance(resp, list):
        for r in resp:
            lines.append(f"- {r}")
    lines += ["", "Deadlines", "---------"]
    deadlines = report_data.get("deadlines", [])
    if isinstance(deadlines, list):
        for d in deadlines:
            lines.append(f"- {d}")
    lines += ["", "Unresolved Questions", "--------------------"]
    uq = report_data.get("unresolved_questions", [])
    if isinstance(uq, list):
        for u in uq:
            lines.append(f"- {u}")
    lines += ["", "Next Steps", "----------"]
    ns = report_data.get("next_steps", [])
    if isinstance(ns, list):
        for n in ns:
            lines.append(f"- {n}")
    return "\n".join(lines).encode("utf-8")


# --------------------------------------------------------------------------- #
# PDF exporters (reportlab)
# --------------------------------------------------------------------------- #
def _format_time(seconds: float) -> str:
    seconds = float(seconds or 0)
    mins = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{mins:02d}:{secs:02d}"


def _build_pdf(title: str, paragraphs: list[tuple[str, str]]) -> bytes:
    """Build a simple PDF with a title and a list of (heading, body) sections."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem,
    )
    from reportlab.lib.units import inch
    from reportlab.lib.enums import TA_LEFT

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.8 * inch, bottomMargin=0.8 * inch)
    styles = getSampleStyleSheet()
    title_style = styles["Title"]
    heading_style = ParagraphStyle("Heading", parent=styles["Heading2"], spaceBefore=10, spaceAfter=6)
    body_style = ParagraphStyle("Body", parent=styles["BodyText"], alignment=TA_LEFT, spaceAfter=6)
    list_item_style = ParagraphStyle("ListItem", parent=styles["BodyText"], alignment=TA_LEFT)

    story = [Paragraph(title, title_style), Spacer(1, 0.2 * inch)]
    for heading, body in paragraphs:
        if heading:
            story.append(Paragraph(heading, heading_style))
        if isinstance(body, list):
            items = [ListItem(Paragraph(_escape(str(item)), list_item_style), leftIndent=12) for item in body]
            story.append(ListFlowable(items, bulletType="bullet", start="circle"))
        elif body:
            story.append(Paragraph(_escape(str(body)), body_style))
        story.append(Spacer(1, 0.1 * inch))
    doc.build(story)
    return buffer.getvalue()


def _escape(text: str) -> str:
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def export_notes_pdf(note: PersonalNote) -> bytes:
    title = note.title or "Untitled note"
    body = (note.content or "").replace("\n", "<br/>")
    return _build_pdf(title, [("Notes", body)])


def export_meeting_report_pdf(meeting: Meeting, report_data: dict[str, Any]) -> bytes:
    title = f"Meeting Report: {meeting.title}"
    sections: list[tuple[str, str | list]] = [
        ("", f"Date: {meeting.date} &nbsp;|&nbsp; Duration: {meeting.duration_minutes} min &nbsp;|&nbsp; Participants: {meeting.participants}"),
        ("Executive Summary", str(report_data.get("executive_summary", ""))),
        ("Purpose", str(report_data.get("purpose", ""))),
        ("Main Topics", report_data.get("main_topics", [])),
        ("Decisions", report_data.get("decisions", [])),
        ("Action Items", _format_action_items(report_data.get("action_items", []))),
        ("Responsible People", report_data.get("responsible_people", [])),
        ("Deadlines", report_data.get("deadlines", [])),
        ("Unresolved Questions", report_data.get("unresolved_questions", [])),
        ("Next Steps", report_data.get("next_steps", [])),
    ]
    return _build_pdf(title, sections)


def _format_action_items(actions: list) -> list:
    out: list[str] = []
    if not isinstance(actions, list):
        return out
    for a in actions:
        if isinstance(a, dict):
            out.append(f"[{a.get('owner', 'Unspecified')}] {a.get('description', '')}")
        else:
            out.append(str(a))
    return out
