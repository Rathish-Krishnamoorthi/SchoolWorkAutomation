import re
from difflib import SequenceMatcher
from typing import Dict, List


def normalize_text(value: str) -> str:
    value = (value or "").lower()
    value = re.sub(r"[^a-z0-9\s+\-_=/:()\\.]+", " ", value)
    return " ".join(value.split())


def tokenize(value: str):
    text = normalize_text(value)
    return set(text.split()) if text else set()


def _subject_hint(question_text: str, expected_answer: str, student_answer: str) -> str:
    combined = " ".join([question_text or "", expected_answer or "", student_answer or ""]).lower()
    if any(keyword in combined for keyword in ["equation", "solve", "x =", "x+", "y =", "formula", "derivative", "integral", "algebra", "geometry", "matrix"]):
        return "mathematics"
    if any(keyword in combined for keyword in ["photosynthesis", "cell", "atom", "energy", "force", "motion", "acid", "oxygen", "chemical", "biology", "physics", "chemistry"]):
        return "science"
    if any(keyword in combined for keyword in ["history", "civilization", "constitution", "freedom", "geography", "river", "country", "war", "empire"]):
        return "social science"
    if any(keyword in combined for keyword in ["essay", "poem", "grammer", "literature", "noun", "verb", "adjective", "synonym", "summary", "paragraph"]):
        return "english"
    if any(keyword in combined for keyword in ["algorithm", "program", "code", "function", "loop", "binary", "database", "html", "python", "java", "output"]):
        return "computer science"
    return "generic"


def _math_equivalence_score(expected: str, student: str) -> float:
    expected_norm = normalize_text(expected)
    student_norm = normalize_text(student)
    if not expected_norm or not student_norm:
        return 0.0

    if any(marker in expected_norm for marker in ["=", "+", "-", "x", "y", "/", "*"]):
        if "=" in expected_norm and "=" in student_norm:
            expected_side = expected_norm.split("=", 1)[1].strip()
            student_side = student_norm.split("=", 1)[1].strip() if "=" in student_norm else student_norm
            if expected_side == student_side or expected_side in student_side or student_side in expected_side:
                return 0.96
            if re.sub(r"\s+", "", expected_norm) == re.sub(r"\s+", "", student_norm):
                return 0.98
        if student_norm.replace(" ", "") in expected_norm.replace(" ", "") or expected_norm.replace(" ", "") in student_norm.replace(" ", ""):
            return 0.9
    return 0.0


def calc_semantic_score(expected: str, student: str, subject: str = "generic") -> float:
    if not expected and not student:
        return 0.0
    if not expected:
        return 0.0
    if not student:
        return 0.0

    subject = (subject or "generic").lower()
    expected_norm = normalize_text(expected)
    student_norm = normalize_text(student)

    if subject == "mathematics":
        math_score = _math_equivalence_score(expected_norm, student_norm)
        if math_score:
            return round(math_score, 4)

    if expected_norm in student_norm or student_norm in expected_norm:
        return 0.95

    seq = SequenceMatcher(None, expected_norm, student_norm).ratio()
    expected_tokens = tokenize(expected)
    student_tokens = tokenize(student)
    overlap = len(expected_tokens & student_tokens)
    denom = max(len(expected_tokens), 1)
    keyword_ratio = overlap / denom

    score = 0.6 * seq + 0.4 * keyword_ratio
    if subject in {"science", "social science", "english"} and seq > 0.55:
        score = min(0.99, score + 0.15)
    return round(max(0.0, min(1.0, score)), 4)


def build_rubric(expected: str, student: str, maximum_marks: float, subject: str = "generic") -> List[dict]:
    score = calc_semantic_score(expected, student, subject)
    subject = (subject or "generic").lower()
    if subject == "mathematics":
        criteria = [
            "Equation setup",
            "Correct method",
            "Final answer",
        ]
    elif subject == "science":
        criteria = [
            "Concept accuracy",
            "Evidence / reasoning",
            "Final conclusion",
        ]
    elif subject == "english":
        criteria = [
            "Idea clarity",
            "Language quality",
            "Conclusion / interpretation",
        ]
    else:
        criteria = [
            "Core concept",
            "Supporting explanation",
            "Correct conclusion",
        ]

    if not expected:
        return [{"criterion": "Overall answer", "maximum_marks": maximum_marks, "awarded_marks": 0.0}]

    marks = max(0.0, score * maximum_marks)
    rubric = []
    for criterion in criteria:
        criterion_max = maximum_marks / len(criteria)
        criterion_score = marks * (criterion_max / maximum_marks)
        rubric.append({
            "criterion": criterion,
            "maximum_marks": round(criterion_max, 2),
            "awarded_marks": round(criterion_score, 2),
        })

    rubric[0]["awarded_marks"] = round(max(0.0, score) * maximum_marks, 2)
    rubric[0]["maximum_marks"] = round(maximum_marks, 2)
    if len(rubric) > 1:
        rubric[1]["awarded_marks"] = round(max(0.0, score - 0.2) * maximum_marks, 2)
    return rubric


def evaluate_answer(question_no: int, question_text: str, expected_answer: str, student_answer: str, maximum_marks: float, threshold: float = 0.75, subject: str = "generic") -> Dict[str, object]:
    """Return a structured JSON piece for one question."""
    subject = (subject or _subject_hint(question_text, expected_answer, student_answer)).lower()
    score = calc_semantic_score(expected_answer, student_answer, subject)
    awarded_marks = round(score * maximum_marks, 2)
    if score >= 0.85:
        evaluation = "Correct"
    elif score >= 0.45:
        evaluation = "Partially correct"
    else:
        evaluation = "Incorrect"

    if subject == "mathematics":
        if score >= 0.9:
            feedback = "The solution is mathematically correct and the final result is valid."
        elif score >= 0.6:
            feedback = "The student shows the right method but misses one or more important steps or final-value details."
        elif score >= 0.3:
            feedback = "The response shows partial algebraic reasoning, but the final answer is incomplete or inaccurate."
        else:
            feedback = "The solving approach is not aligned with the expected mathematical concept and needs teacher review."
    elif subject == "science":
        if score >= 0.9:
            feedback = "The answer correctly explains the scientific idea and supporting evidence."
        elif score >= 0.6:
            feedback = "The answer covers the main scientific concept but misses some relevant details or evidence."
        elif score >= 0.3:
            feedback = "The answer demonstrates partial scientific understanding but lacks key explanation."
        else:
            feedback = "The science concept is weak or inaccurate and requires teacher review."
    elif subject == "english":
        if score >= 0.9:
            feedback = "The response is clear, relevant and expresses the intended meaning accurately."
        elif score >= 0.6:
            feedback = "The writing is mostly relevant but could be more precise or complete."
        elif score >= 0.3:
            feedback = "The response shows some understanding but lacks clarity or key details."
        else:
            feedback = "The response does not match the expected idea and needs teacher review."
    else:
        if score >= 0.9:
            feedback = "The answer is strong and matches the expected concepts and reasoning."
        elif score >= 0.6:
            feedback = "The answer is mostly relevant and includes several correct ideas, but a few required points are missing."
        elif score >= 0.3:
            feedback = "The answer shows partial understanding, but it does not fully cover the expected key points."
        else:
            feedback = "The answer is not aligned with the expected concept and needs teacher review."

    if expected_answer and student_answer:
        expected_tokens = tokenize(expected_answer)
        student_tokens = tokenize(student_answer)
        missing = sorted(expected_tokens - student_tokens)
        if missing and score < 0.9:
            feedback = f"The answer covers key ideas, but it misses important points such as: {', '.join(missing[:5])}."

    rubric = build_rubric(expected_answer, student_answer, maximum_marks, subject)
    confidence = round(max(0.15, min(0.99, score + 0.1)), 2)
    status = "AI_EVALUATED" if confidence >= threshold else "TEACHER_REVIEW"

    return {
        "question_no": question_no,
        "maximum_marks": float(maximum_marks),
        "awarded_marks": awarded_marks,
        "confidence": confidence,
        "evaluation": evaluation,
        "feedback": feedback,
        "rubric": rubric,
        "status": status,
    }
