from app.services.ai_grader import evaluate_submission
from app.services.rubric_engine import evaluate_answer


def test_semantic_evaluation_awards_partial_marks_for_water_cycle():
    result = evaluate_answer(
        question_no=1,
        question_text="Explain the water cycle.",
        expected_answer="Evaporation condensation precipitation collection correct explanation",
        student_answer="Water evaporates, forms clouds and later falls as rain.",
        maximum_marks=5,
    )

    assert result["maximum_marks"] == 5
    assert result["awarded_marks"] > 0
    assert result["awarded_marks"] < 5
    assert result["status"] in {"AI_EVALUATED", "TEACHER_REVIEW"}


def test_low_confidence_is_marked_for_teacher_review():
    result = evaluate_answer(
        question_no=2,
        question_text="State Newton's second law.",
        expected_answer="Force equals mass times acceleration",
        student_answer="Acceleration is caused by force",
        maximum_marks=3,
    )

    assert result["status"] == "TEACHER_REVIEW" or result["confidence"] < 0.75


def test_ai_grader_returns_structured_results_for_multiple_questions():
    results = evaluate_submission(
        raw_exam_text="Q1: Explain photosynthesis. Q2: Solve x+2=5.",
        raw_answer_key="Q1: sunlight water carbon dioxide glucose oxygen. Q2: x=3.",
        raw_student_answers="Q1: Plants use sunlight and water to make sugar. Q2: x = 3.",
        total_marks=10,
        threshold=0.75,
    )

    assert isinstance(results, list)
    assert len(results) >= 2
    assert all("confidence" in item for item in results)
    assert all("rubric" in item for item in results)
