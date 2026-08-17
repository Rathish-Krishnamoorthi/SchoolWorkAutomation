"""
Pydantic v2 schemas for request/response validation.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    role: str


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "admin"


# ── Student ───────────────────────────────────────────────────────────────────

class StudentBase(BaseModel):
    name: str
    date_of_birth: str
    gender: str
    class_id: Optional[str] = None
    class_name: Optional[str] = None   # denormalized; resolved from class_id on create/update
    section: str
    parent_name: str
    parent_contact: str
    email: Optional[str] = None
    address: str
    blood_group: Optional[str] = None
    nationality: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    class_id: Optional[str] = None
    class_name: Optional[str] = None   # kept in sync with class_id by the endpoint
    section: Optional[str] = None
    parent_name: Optional[str] = None
    parent_contact: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    blood_group: Optional[str] = None
    nationality: Optional[str] = None


class StudentOut(StudentBase):
    id: str
    student_id: str
    admission_date: str
    attendance_percentage: float
    status: str
    model_config = {"from_attributes": True}


# ── Teacher ───────────────────────────────────────────────────────────────────

class TeacherBase(BaseModel):
    name: str
    department: str
    subjects: List[str] = []
    classes: List[str] = []
    email: str
    phone: str
    qualification: str
    experience: int = 0


class TeacherCreate(TeacherBase):
    pass


class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    department: Optional[str] = None
    subjects: Optional[List[str]] = None
    classes: Optional[List[str]] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[int] = None
    workload: Optional[float] = None
    status: Optional[str] = None


class TeacherOut(TeacherBase):
    id: str
    teacher_id: str
    workload: float
    status: str
    joining_date: str
    model_config = {"from_attributes": True}


# ── Document ──────────────────────────────────────────────────────────────────

class ExtractedFieldOut(BaseModel):
    key: str
    label: str
    value: str
    confidence: float
    is_edited: bool = False
    is_low_confidence: bool = False


class DocumentOut(BaseModel):
    id: str
    file_name: str
    file_type: str
    file_size: int
    document_type: str
    status: str
    uploaded_at: datetime
    processed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    uploaded_by: str
    extracted_fields: List[Any] = []
    rejection_reason: Optional[str] = None
    model_config = {"from_attributes": True}


class DocumentApproveRequest(BaseModel):
    edited_fields: Optional[List[Any]] = None


class DocumentRejectRequest(BaseModel):
    reason: str


# ── AI Assistant ──────────────────────────────────────────────────────────────

class AIQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500)


class AIQueryResponse(BaseModel):
    content: str
    structured: Optional[Any] = None


# ── Paper correction ───────────────────────────────────────────────────────────

class RubricCriterion(BaseModel):
    criterion: str
    maximum_marks: float
    awarded_marks: float = 0.0


class EvaluationResult(BaseModel):
    question_no: int
    maximum_marks: float
    awarded_marks: float
    confidence: float
    evaluation: str
    feedback: str
    rubric: List[RubricCriterion] = []
    status: str = "AI_EVALUATED"


class ExamCreate(BaseModel):
    exam_name: str = Field(..., min_length=2, max_length=200)
    class_name: str
    section: str = ""
    subject: str
    total_marks: int = Field(..., gt=0)


class ExamOut(BaseModel):
    id: str
    exam_name: str
    class_name: str
    section: str
    subject: str
    total_marks: int
    teacher_id: str
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class QuestionPaperUploadRequest(BaseModel):
    exam_id: str
    file_name: str = "question-paper"
    mime_type: str = "application/pdf"


class AnswerKeyUploadRequest(BaseModel):
    exam_id: str
    file_name: str = "answer-key"
    mime_type: str = "application/pdf"
    rubric: Optional[List[dict]] = None


class StudentPaperUploadRequest(BaseModel):
    exam_id: str
    student_id: str
    student_name: str
    class_name: str
    section: str = ""
    subject: str
    file_name: str = "answer-sheet"
    mime_type: str = "application/pdf"


class EvaluationUpdateRequest(BaseModel):
    teacher_marks: float
    teacher_comments: str = ""
    status: str = "TEACHER_REVIEW"


class SubmissionOut(BaseModel):
    id: str
    student_id: str
    student_name: str
    exam_id: str
    subject: str
    class_name: str
    section: str
    file_name: str
    total_ai_marks: float
    total_teacher_marks: float
    final_marks: float
    average_confidence: float
    status: str
    evaluations: List[dict] = []
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Attendance ────────────────────────────────────────────────────────────────

class AttendanceMarkRequest(BaseModel):
    student_id: str
    class_id: str
    date: str
    status: str
    mode: str = "manual"
    notes: Optional[str] = None


class BulkAttendanceRequest(BaseModel):
    records: List[AttendanceMarkRequest]


# ── Class ─────────────────────────────────────────────────────────────────────

class ClassBase(BaseModel):
    name: str
    grade: int
    section: str = ""
    class_teacher_id: Optional[str] = None
    class_teacher_name: Optional[str] = None
    room_id: Optional[str] = None
    subjects: List[str] = []
    academic_year: str = "2025-26"


class ClassCreate(ClassBase):
    pass


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    grade: Optional[int] = None
    section: Optional[str] = None
    class_teacher_id: Optional[str] = None
    class_teacher_name: Optional[str] = None
    room_id: Optional[str] = None
    subjects: Optional[List[str]] = None
    academic_year: Optional[str] = None
    student_count: Optional[int] = None


class ClassOut(ClassBase):
    id: str
    student_count: int = 0
    model_config = {"from_attributes": True}


# ── Subject ───────────────────────────────────────────────────────────────────

class SubjectBase(BaseModel):
    name: str
    code: str = ""
    teacher_id: Optional[str] = None
    teacher_name: Optional[str] = None
    classes: List[str] = []
    weekly_periods: int = 4
    priority: str = "core"
    department: str = ""


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    teacher_id: Optional[str] = None
    teacher_name: Optional[str] = None
    classes: Optional[List[str]] = None
    weekly_periods: Optional[int] = None
    priority: Optional[str] = None
    department: Optional[str] = None


class SubjectOut(SubjectBase):
    id: str
    model_config = {"from_attributes": True}


# ── Notification ──────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    title: str
    message: str
    type: str
    severity: str
    read: bool
    created_at: datetime
    action_label: Optional[str] = None
    action_route: Optional[str] = None
    model_config = {"from_attributes": True}
