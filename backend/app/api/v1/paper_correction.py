import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request, UploadFile, File, Form

from app.core.config import settings
from app.core.security import decode_token
from app.db.database import database
from app.models.models import ALL_DOCUMENTS, AnswerKey, AnswerSubmission, Exam, QuestionPaper, Evaluation, User
from app.schemas.schemas import AnswerKeyUploadRequest, ExamCreate, EvaluationUpdateRequest, QuestionPaperUploadRequest, StudentPaperUploadRequest, SubmissionOut
from app.services.ai_grader import evaluate_submission, build_submission_summary
from app.services.ocr_service import build_model_payload
from app.services.report_generator import generate_report

router = APIRouter()


def _get_authorized_user(request: Request) -> Dict[str, Any]:
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = auth.split(" ", 1)[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if payload.get("role") not in {"teacher", "admin", "super_admin"}:
        raise HTTPException(status_code=403, detail="Only teachers/admins can access paper correction")
    return payload


@router.get("/exams")
async def list_exams(request: Request):
    _get_authorized_user(request)
    exams = await Exam.find_all().to_list()
    return [{
        "id": str(exam.id),
        "exam_name": exam.exam_name,
        "class_name": exam.class_name,
        "section": exam.section,
        "subject": exam.subject,
        "total_marks": exam.total_marks,
        "teacher_id": exam.teacher_id,
        "created_at": exam.created_at,
        "updated_at": exam.updated_at,
    } for exam in exams]


@router.get("/exams/{exam_id}")
async def get_exam(request: Request, exam_id: str):
    _get_authorized_user(request)
    exam = await Exam.get(exam_id)
    if not exam:
        raise HTTPException(404, detail="Exam not found")
    return {
        "id": str(exam.id),
        "exam_name": exam.exam_name,
        "class_name": exam.class_name,
        "section": exam.section,
        "subject": exam.subject,
        "total_marks": exam.total_marks,
        "teacher_id": exam.teacher_id,
        "created_at": exam.created_at,
        "updated_at": exam.updated_at,
    }


@router.get("/exams/{exam_id}/submissions")
async def list_exam_submissions(request: Request, exam_id: str):
    _get_authorized_user(request)
    exam = await Exam.get(exam_id)
    if not exam:
        raise HTTPException(404, detail="Exam not found")
    submissions = await AnswerSubmission.find_many(AnswerSubmission.exam_id == exam_id).to_list()
    return [{
        "id": str(item.id),
        "student_id": item.student_id,
        "student_name": item.student_name,
        "subject": item.subject,
        "class_name": item.class_name,
        "section": item.section,
        "status": item.status,
        "total_ai_marks": item.total_ai_marks,
        "final_marks": item.final_marks,
        "average_confidence": item.average_confidence,
        "created_at": item.created_at,
    } for item in submissions]


@router.post("/exams", status_code=201)
async def create_exam(request: Request, payload: ExamCreate):
    user = _get_authorized_user(request)
    exam = Exam(
        exam_name=payload.exam_name,
        class_name=payload.class_name,
        section=payload.section,
        subject=payload.subject,
        total_marks=payload.total_marks,
        teacher_id=str(user.get("sub", "")),
    )
    await exam.insert()
    return {
        "id": str(exam.id),
        "exam_name": exam.exam_name,
        "class_name": exam.class_name,
        "section": exam.section,
        "subject": exam.subject,
        "total_marks": exam.total_marks,
        "teacher_id": exam.teacher_id,
        "created_at": exam.created_at,
        "updated_at": exam.updated_at,
    }


@router.post("/question-paper")
async def upload_question_paper(
    request: Request,
    file: UploadFile = File(...),
    exam_id: str = Form(...),
):
    _get_authorized_user(request)
    if not file or not getattr(file, "filename", None):
        raise HTTPException(400, detail="Question paper file is required")
    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(400, detail="Question paper is empty or unreadable")
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(400, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit")

    exam = await Exam.get(exam_id)
    if not exam:
        raise HTTPException(404, detail="Exam not found")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "question-paper.pdf")[1] or ".pdf"
    file_path = os.path.join(settings.UPLOAD_DIR, f"qp-{str(exam.id)}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{ext}")
    with open(file_path, "wb") as fh:
        fh.write(content)

    payload = build_model_payload(file.filename or "question-paper.pdf", file_path, file.content_type or "application/octet-stream")
    if payload.get("status") == "error":
        raise HTTPException(400, detail=payload.get("message", "Question paper OCR failed"))

    qpaper = QuestionPaper(
        exam_id=exam_id,
        file_name=file.filename or "question-paper.pdf",
        file_path=file_path,
        mime_type=file.content_type or "application/pdf",
        raw_text=payload["raw_text"],
        question_count=max(1, len(payload["raw_text"].split("Q")) - 1),
        uploaded_by="teacher",
    )
    await qpaper.insert()
    await exam.set({"updated_at": datetime.utcnow()})
    return {"id": str(qpaper.id), "status": "uploaded", "file_name": qpaper.file_name, "raw_text_length": len(qpaper.raw_text)}


@router.post("/answer-key")
async def upload_answer_key(
    request: Request,
    file: UploadFile = File(...),
    exam_id: str = Form(...),
    rubric: str = Form("[]"),
):
    _get_authorized_user(request)
    if not file or not getattr(file, "filename", None):
        raise HTTPException(400, detail="Answer key file is required")
    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(400, detail="Answer key is empty or unreadable")
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(400, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit")

    exam = await Exam.get(exam_id)
    if not exam:
        raise HTTPException(404, detail="Exam not found")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "answer-key.pdf")[1] or ".pdf"
    file_path = os.path.join(settings.UPLOAD_DIR, f"ak-{str(exam.id)}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{ext}")
    with open(file_path, "wb") as fh:
        fh.write(content)

    payload = build_model_payload(file.filename or "answer-key.pdf", file_path, file.content_type or "application/octet-stream")
    if payload.get("status") == "error":
        raise HTTPException(400, detail=payload.get("message", "Answer key OCR failed"))

    parsed_rubric = []
    try:
        import json
        parsed_rubric = json.loads(rubric or "[]")
    except Exception:
        parsed_rubric = []

    answer_key = AnswerKey(
        exam_id=exam_id,
        file_name=file.filename or "answer-key.pdf",
        file_path=file_path,
        mime_type=file.content_type or "application/pdf",
        raw_text=payload["raw_text"],
        rubric=parsed_rubric,
        questions=[],
        uploaded_by="teacher",
    )
    await answer_key.insert()
    return {"id": str(answer_key.id), "status": "uploaded", "file_name": answer_key.file_name, "raw_text_length": len(answer_key.raw_text)}


@router.post("/student-paper")
async def upload_student_paper(
    request: Request,
    file: UploadFile = File(...),
    exam_id: str = Form(...),
    student_id: str = Form(...),
    student_name: str = Form(...),
    class_name: str = Form(...),
    section: str = Form(...),
    subject: str = Form(...),
):
    _get_authorized_user(request)
    if not file or not getattr(file, "filename", None):
        raise HTTPException(400, detail="Student answer sheet file is required")
    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(400, detail="Student answer sheet is empty or unreadable")
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(400, detail=f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit")

    exam = await Exam.get(exam_id)
    if not exam:
        raise HTTPException(404, detail="Exam not found")

    existing = await AnswerSubmission.find_one({"student_id": student_id, "exam_id": exam_id})
    if existing:
        raise HTTPException(409, detail="Duplicate submission for this student and exam")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "answer-sheet.pdf")[1] or ".pdf"
    file_path = os.path.join(settings.UPLOAD_DIR, f"sub-{student_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{ext}")
    with open(file_path, "wb") as fh:
        fh.write(content)

    payload = build_model_payload(file.filename or "answer-sheet.pdf", file_path, file.content_type or "application/octet-stream")
    if payload.get("status") == "error":
        raise HTTPException(400, detail=payload.get("message", "Answer sheet OCR failed"))

    submission = AnswerSubmission(
        student_id=student_id,
        student_name=student_name,
        exam_id=exam_id,
        subject=subject,
        class_name=class_name,
        section=section,
        file_name=file.filename or "answer-sheet.pdf",
        file_path=file_path,
        raw_text=payload["raw_text"],
        status="PENDING",
    )
    await submission.insert()
    return {"id": str(submission.id), "status": submission.status, "student_name": submission.student_name, "file_name": submission.file_name}


@router.post("/{submission_id}/evaluate")
async def evaluate_submission_endpoint(request: Request, submission_id: str):
    _get_authorized_user(request)
    submission = await AnswerSubmission.get(submission_id)
    if not submission:
        raise HTTPException(404, detail="Submission not found")

    exam = await Exam.get(submission.exam_id)
    if not exam:
        raise HTTPException(404, detail="Exam not found")

    answer_key = await AnswerKey.find_one(AnswerKey.exam_id == submission.exam_id)
    if not answer_key:
        raise HTTPException(400, detail="Missing answer key for this exam")

    results = evaluate_submission(
        exam.exam_name,
        answer_key.raw_text,
        submission.raw_text,
        exam.total_marks,
        threshold=0.75,
        subject=exam.subject or "generic",
    )
    summary = build_submission_summary(results)

    submission.evaluations = results
    submission.total_ai_marks = summary["total_ai_marks"]
    submission.average_confidence = summary["average_confidence"]
    submission.status = summary["status"]
    submission.updated_at = datetime.utcnow()
    await submission.save()

    for result in results:
        evaluation = Evaluation(
            submission_id=str(submission.id),
            question_no=result["question_no"],
            question_text=exam.exam_name,
            student_answer="",
            expected_answer="",
            maximum_marks=result["maximum_marks"],
            ai_marks=result["awarded_marks"],
            teacher_marks=0.0,
            final_marks=result["awarded_marks"],
            ai_confidence=result["confidence"],
            feedback=result["feedback"],
            rubric=result["rubric"],
            status=result["status"],
        )
        await evaluation.insert()

    return {"submission_id": str(submission.id), "results": results, "summary": summary}


@router.get("/{submission_id}/result")
async def get_submission_result(request: Request, submission_id: str):
    _get_authorized_user(request)
    submission = await AnswerSubmission.get(submission_id)
    if not submission:
        raise HTTPException(404, detail="Submission not found")
    return {
        "submission_id": str(submission.id),
        "student_name": submission.student_name,
        "status": submission.status,
        "total_ai_marks": submission.total_ai_marks,
        "average_confidence": submission.average_confidence,
        "evaluations": submission.evaluations,
    }


@router.put("/{submission_id}/question/{question_id}")
async def update_question_result(request: Request, submission_id: str, question_id: int, payload: EvaluationUpdateRequest):
    _get_authorized_user(request)
    submission = await AnswerSubmission.get(submission_id)
    if not submission:
        raise HTTPException(404, detail="Submission not found")

    for result in submission.evaluations:
        if int(result.get("question_no", 0)) == int(question_id):
            result["teacher_marks"] = payload.teacher_marks
            result["teacher_comments"] = payload.teacher_comments
            result["status"] = payload.status
            result["final_marks"] = payload.teacher_marks
            break
    else:
        raise HTTPException(404, detail="Question not found in submission")

    submission.total_teacher_marks = sum(float(item.get("teacher_marks", 0)) for item in submission.evaluations)
    submission.final_marks = submission.total_teacher_marks
    submission.status = "TEACHER_REVIEW" if submission.total_teacher_marks < submission.total_ai_marks else "APPROVED"
    submission.updated_at = datetime.utcnow()
    await submission.save()
    return {"message": "Question updated", "submission": submission.evaluations}


@router.post("/{submission_id}/approve")
async def approve_submission(request: Request, submission_id: str):
    _get_authorized_user(request)
    submission = await AnswerSubmission.get(submission_id)
    if not submission:
        raise HTTPException(404, detail="Submission not found")
    submission.status = "APPROVED"
    submission.final_marks = max(submission.total_teacher_marks or submission.total_ai_marks, submission.final_marks)
    submission.updated_at = datetime.utcnow()
    await submission.save()
    return {"status": "APPROVED", "final_marks": submission.final_marks}


@router.get("/{submission_id}/report")
async def get_report(request: Request, submission_id: str):
    _get_authorized_user(request)
    submission = await AnswerSubmission.get(submission_id)
    if not submission:
        raise HTTPException(404, detail="Submission not found")
    exam = await Exam.get(submission.exam_id)
    if not exam:
        raise HTTPException(404, detail="Exam not found")
    return generate_report(submission.student_name, exam.exam_name, submission.subject, submission.evaluations, exam.total_marks)
