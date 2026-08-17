from typing import Dict, List, Any

from app.services.paper_parser import extract_answer_key, extract_student_answers, infer_rubric
from app.services.rubric_engine import evaluate_answer


def evaluate_submission(raw_exam_text: str, raw_answer_key: str, raw_student_answers: str, total_marks: int = 100, threshold: float = 0.75, subject: str = "generic") -> List[Dict[str, Any]]:
    """Evaluate a student submission against the answer key using semantic matching."""
    expected = extract_answer_key(raw_answer_key or "")
    student = extract_student_answers(raw_student_answers or "")
    question_numbers = sorted(set(expected) | set(student))

    outputs: List[Dict[str, Any]] = []
    for qno in question_numbers:
        question_text = raw_exam_text or "Question"
        expected_answer = expected.get(qno, "")
        student_answer = student.get(qno, "")
        max_marks = total_marks / max(len(question_numbers), 1)
        result = evaluate_answer(qno, question_text, expected_answer, student_answer, max_marks, threshold=threshold, subject=subject)
        outputs.append(result)

    if not outputs:
        outputs.append({
            "question_no": 1,
            "maximum_marks": float(total_marks),
            "awarded_marks": 0.0,
            "confidence": 0.0,
            "evaluation": "No answer found",
            "feedback": "No valid answer text could be extracted from the uploaded answer sheet.",
            "rubric": infer_rubric(raw_exam_text or "", raw_answer_key or "", total_marks),
            "status": "TEACHER_REVIEW",
        })

    return outputs


def build_submission_summary(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_ai_marks = round(sum(item["awarded_marks"] for item in results), 2)
    average_confidence = round(sum(item["confidence"] for item in results) / max(len(results), 1), 2)
    pending_review = sum(1 for item in results if item.get("status") == "TEACHER_REVIEW")
    return {
        "total_ai_marks": total_ai_marks,
        "average_confidence": average_confidence,
        "pending_review": pending_review,
        "status": "TEACHER_REVIEW" if pending_review else "AI_EVALUATED",
    }
