from typing import Dict, Any


def generate_report(student_name: str, exam_name: str, subject: str, results: list, total_marks: float) -> Dict[str, Any]:
    total_awarded = round(sum(item["awarded_marks"] for item in results), 2)
    percentage = round((total_awarded / total_marks * 100), 2) if total_marks else 0.0
    return {
        "student_name": student_name,
        "exam_name": exam_name,
        "subject": subject,
        "total_marks": total_marks,
        "final_marks": total_awarded,
        "percentage": percentage,
        "questionwise": results,
        "summary": {
            "correct_answers": sum(1 for item in results if item["evaluation"] == "Correct"),
            "partially_correct": sum(1 for item in results if item["evaluation"] == "Partially correct"),
            "incorrect_answers": sum(1 for item in results if item["evaluation"] == "Incorrect"),
            "average_confidence": round(sum(item["confidence"] for item in results) / max(len(results), 1), 2),
            "questions_for_teacher_review": sum(1 for item in results if item.get("status") == "TEACHER_REVIEW"),
        },
    }
