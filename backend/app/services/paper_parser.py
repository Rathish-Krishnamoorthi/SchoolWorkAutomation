import re
from typing import Dict, List


def normalize_space(text: str) -> str:
    return " ".join((text or "").replace("\n", " ").split())


def _line_based_question_map(text: str) -> Dict[int, str]:
    cleaned = (text or "").strip()
    if not cleaned:
        return {}

    mapping: Dict[int, str] = {}

    # First pass: split values that have multiple question labels on one line.
    fragments = re.split(r"(?i)(?=Q\s*\d+\s*[:.-]?)", cleaned)
    if len(fragments) > 1:
        for fragment in fragments:
            part = fragment.strip()
            if not part:
                continue
            match = re.match(r"(?i)Q\s*(\d+)\s*[:.-]?\s*(.*)", part)
            if match:
                q_no = int(match.group(1))
                mapping[q_no] = match.group(2).strip()
                continue
            match = re.match(r"(?i)(\d+)\s*[:.-]?\s*(.*)", part)
            if match:
                q_no = int(match.group(1))
                mapping[q_no] = match.group(2).strip()
                continue

    if mapping:
        return mapping

    # Second pass: line-by-line fallback.
    current_no: int | None = None
    for raw_line in cleaned.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        match = re.search(r"(?i)(?:Q(?:UESTION)?\s*[:.-]?\s*)(\d+)\s*[:.-]?\s*(.*)", line)
        if match:
            q_no = int(match.group(1))
            q_text = match.group(2).strip()
            if q_text:
                mapping[q_no] = q_text
            current_no = q_no
            continue

        match = re.search(r"(?i)^(\d+)\s*[:.-]?\s*(.*)", line)
        if match:
            q_no = int(match.group(1))
            q_text = match.group(2).strip()
            if q_text:
                mapping[q_no] = q_text
            current_no = q_no
            continue

        if current_no is not None:
            mapping[current_no] = f"{mapping.get(current_no, '')} {line}".strip()

    if not mapping:
        return {1: normalize_space(cleaned)}
    return mapping


def extract_question_blocks(text: str) -> Dict[int, str]:
    """Decode a raw question paper into question number -> text mapping."""
    return _line_based_question_map(text)


def extract_answer_key(text: str) -> Dict[int, str]:
    """Parse answer key text. Supports Q1: expected ... and Q1. ... patterns."""
    return _line_based_question_map(text)


def extract_student_answers(text: str) -> Dict[int, str]:
    """Parse student answer sheet text. Accepts Q1: answer patterns."""
    return _line_based_question_map(text)


def infer_rubric(question_text: str, expected_answer: str, maximum_marks: float) -> List[dict]:
    """Create simple rubric from expected answer text if no explicit rubric was uploaded."""
    answer_bits = [part.strip() for part in re.split(r"[;|\n]+", expected_answer) if part.strip()][:5]
    if not answer_bits:
        answer_bits = [expected_answer.strip()]

    max_per_bit = round(maximum_marks / max(len(answer_bits), 1), 2)
    rubric = []
    for idx, bit in enumerate(answer_bits):
        criterion = f"Concept {idx + 1}"
        if len(bit) < 25:
            criterion = bit[:30]
        rubric.append({
            "criterion": criterion,
            "maximum_marks": max_per_bit,
            "awarded_marks": 0.0,
        })

    if not rubric:
        rubric.append({
            "criterion": "Overall answer",
            "maximum_marks": maximum_marks,
            "awarded_marks": 0.0,
        })

    return rubric
