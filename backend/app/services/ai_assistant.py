"""
AI Assistant Service.

MOCK IMPLEMENTATION — matches keywords and returns structured responses.

To connect a real LLM:
  - Set OPENAI_API_KEY in .env
  - Replace answer_query() with an OpenAI / Anthropic / local LLM call
  - The frontend only calls /api/v1/ai/ask — no keys are ever exposed client-side.
"""
import asyncio
import random
from typing import Any, Dict, Optional

RESPONSES: Dict[str, Dict[str, Any]] = {
    "attendance": {
        "content": "27 students currently have attendance below 75% this month.",
        "structured": {
            "items": [
                {"label": "Vikram Nair", "value": "Grade 8-A", "extra": "63%"},
                {"label": "Nithya Chandran", "value": "Grade 6-B", "extra": "55%"},
                {"label": "Rohit Sharma", "value": "Grade 7-B", "extra": "68%"},
                {"label": "Arun Selvam", "value": "Grade 10-B", "extra": "71%"},
                {"label": "Karthik Suresh", "value": "Grade 9-B", "extra": "74%"},
            ],
            "recommendation": "Send attendance warnings to parents of all 27 students.",
        },
    },
    "conflict": {
        "content": "There are 2 active timetable conflicts today.",
        "structured": {
            "items": [
                {"label": "Critical", "value": "Mr. Suresh Kumar double-booked", "extra": "Monday 09:30"},
                {"label": "Critical", "value": "Room 204 double-booked", "extra": "Wednesday 10:30"},
            ],
            "recommendation": "Use the Timetable Optimizer to resolve both conflicts automatically.",
        },
    },
    "overload": {
        "content": "3 teachers currently have workload above 90%.",
        "structured": {
            "items": [
                {"label": "Mr. Suresh Kumar", "value": "Mathematics", "extra": "94%"},
                {"label": "Ms. Priya Nair", "value": "Physics / Chemistry", "extra": "92%"},
                {"label": "Mr. Arun Babu", "value": "English / Tamil", "extra": "91%"},
            ],
            "recommendation": "Redistribute 4 periods across Ms. Radha Gopalan and Mr. Mohan Krishnan.",
        },
    },
    "documents": {
        "content": "4 documents are currently waiting for your approval.",
        "structured": {
            "items": [
                {"label": "Admission Form", "value": "Rathish Kumar", "extra": "98% confidence"},
                {"label": "Admission Form", "value": "Vikram Nair", "extra": "93% confidence"},
                {"label": "Teacher Form", "value": "Mohan Krishnan", "extra": "89% confidence"},
                {"label": "Registration Form", "value": "Ananya Krishnan", "extra": "Processing…"},
            ],
            "recommendation": "Review high-confidence documents first for faster processing.",
        },
    },
    "classrooms": {
        "content": "3 classrooms are currently under 50% utilization today.",
        "structured": {
            "items": [
                {"label": "Assembly Hall", "value": "Main Block", "extra": "30%"},
                {"label": "Room 301", "value": "Floor 3", "extra": "65%"},
                {"label": "Room 302", "value": "Floor 3", "extra": "72%"},
            ],
            "recommendation": "Schedule overflow classes and club meetings in Assembly Hall.",
        },
    },
    "attention": {
        "content": "Here is a summary of items requiring your attention today:",
        "structured": {
            "items": [
                {"label": "🔴 Critical", "value": "2 timetable conflicts pending", "extra": "High Priority"},
                {"label": "🟡 Warning", "value": "27 students below 75% attendance", "extra": "Medium"},
                {"label": "🟡 Warning", "value": "3 teachers above 90% workload", "extra": "Medium"},
                {"label": "🔵 Info", "value": "4 documents awaiting approval", "extra": "Normal"},
            ],
            "recommendation": "Start with timetable conflicts — resolves in under 2 minutes.",
        },
    },
}


def _match(query: str) -> Dict[str, Any]:
    q = query.lower()
    if ("attendance" in q and any(w in q for w in ["below", "75", "student", "low"])):
        return RESPONSES["attendance"]
    if "conflict" in q or ("timetable" in q and "today" in q):
        return RESPONSES["conflict"]
    if any(w in q for w in ["overload", "workload", "overworked", "busy"]):
        return RESPONSES["overload"]
    if any(w in q for w in ["document", "approval", "pending", "approve"]):
        return RESPONSES["documents"]
    if any(w in q for w in ["classroom", "room", "unused", "empty", "utiliz"]):
        return RESPONSES["classrooms"]
    if any(w in q for w in ["attention", "today", "summary", "what", "help", "overview"]):
        return RESPONSES["attention"]
    return {
        "content": (
            f'Based on current school data, here\'s what I found for: "{query}". '
            "Everything is within normal parameters except 2 timetable conflicts "
            "and 27 students with low attendance."
        ),
        "structured": {
            "recommendation": (
                'Try asking: "Which teachers are overloaded?" or "Show attendance below 75%"'
            ),
        },
    }


async def answer_query(query: str) -> Dict[str, Any]:
    """Async wrapper with simulated latency."""
    await asyncio.sleep(0.6 + random.random() * 0.6)
    return _match(query)
