"""
Beanie ODM document models.
Each class maps to a MongoDB collection of the same name (snake_case plural).
"""
from datetime import datetime
from typing import Optional, List, Any
from beanie import Document, Indexed
from pydantic import Field


class User(Document):
    name: str
    email: Indexed(str, unique=True)
    hashed_password: str
    role: str = "admin"            # "super_admin" | "admin" | "teacher"
    school_id: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"


class Student(Document):
    student_id: Indexed(str, unique=True)
    name: str
    photo_url: Optional[str] = None
    date_of_birth: str = ""
    gender: str = "male"
    class_id: Optional[str] = None
    class_name: Optional[str] = None
    section: str = ""
    parent_name: str = ""
    parent_contact: str = ""
    email: Optional[str] = None
    address: str = ""
    admission_date: str = ""
    attendance_percentage: float = 0.0
    status: str = "active"         # active | inactive | transferred | graduated
    blood_group: Optional[str] = None
    nationality: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "students"


class Teacher(Document):
    teacher_id: Indexed(str, unique=True)
    name: str
    photo_url: Optional[str] = None
    department: str = ""
    subjects: List[str] = []
    classes: List[str] = []
    email: Indexed(str, unique=True)
    phone: str = ""
    qualification: str = ""
    experience: int = 0
    joining_date: str = ""
    workload: float = 0.0
    status: str = "active"         # active | inactive | on_leave
    availability: dict = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "teachers"


class Class(Document):
    name: str
    grade: int
    section: str = ""
    class_teacher_id: Optional[str] = None
    class_teacher_name: Optional[str] = None
    room_id: Optional[str] = None
    student_count: int = 0
    subjects: List[str] = []
    academic_year: str = ""

    class Settings:
        name = "classes"


class Subject(Document):
    name: str
    code: str = ""
    teacher_id: Optional[str] = None
    teacher_name: Optional[str] = None
    classes: List[str] = []
    weekly_periods: int = 4
    priority: str = "core"         # core | elective | activity
    department: str = ""

    class Settings:
        name = "subjects"


class Room(Document):
    name: str
    type: str = "classroom"        # classroom | lab | hall | office
    capacity: int = 40
    floor: int = 0
    building: str = ""
    facilities: List[str] = []
    utilization_percent: float = 0.0

    class Settings:
        name = "rooms"


class Period(Document):
    day: str
    start_time: str
    end_time: str
    subject_id: Optional[str] = None
    subject_name: str = ""
    teacher_id: Optional[str] = None
    teacher_name: str = ""
    class_id: Optional[str] = None
    class_name: str = ""
    room_id: Optional[str] = None
    room_name: str = ""
    locked: bool = False
    academic_year: str = ""

    class Settings:
        name = "periods"


class AttendanceRecord(Document):
    student_id: Indexed(str)
    student_name: str = ""
    class_id: Indexed(str)
    date: Indexed(str)
    status: str = "present"        # present | absent | late | excused
    marked_by: str = "Admin"
    mode: str = "manual"           # manual | rfid | computer_vision
    time: Optional[str] = None
    notes: Optional[str] = None

    class Settings:
        name = "attendance_records"


class DocumentRecord(Document):
    file_name: str
    file_type: str = ""
    file_size: int = 0
    file_path: Optional[str] = None
    document_type: str = "other"
    status: str = "uploaded"       # uploaded | processing | extracted | pending_approval | approved | rejected
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    processed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    uploaded_by: str = "Admin"
    extracted_fields: List[Any] = []
    rejection_reason: Optional[str] = None

    class Settings:
        name = "document_records"


class Notification(Document):
    title: str
    message: str
    type: str = "system"
    severity: str = "info"         # critical | warning | info
    read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    action_label: Optional[str] = None
    action_route: Optional[str] = None

    class Settings:
        name = "notifications"


class AuditLog(Document):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    user_id: str = ""
    user_name: str = ""
    action: Indexed(str)
    entity: str = ""
    entity_id: str = ""
    details: str = ""
    ip_address: Optional[str] = None

    class Settings:
        name = "audit_logs"


class Exam(Document):
    exam_name: str
    class_name: str = ""
    section: str = ""
    subject: str = ""
    total_marks: int = 0
    teacher_id: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "exams"


class QuestionPaper(Document):
    exam_id: str
    file_name: str = ""
    file_path: Optional[str] = None
    mime_type: str = "application/pdf"
    raw_text: str = ""
    question_count: int = 0
    uploaded_by: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "question_papers"


class AnswerKey(Document):
    exam_id: str
    file_name: str = ""
    file_path: Optional[str] = None
    mime_type: str = "application/pdf"
    raw_text: str = ""
    rubric: List[dict] = []
    questions: List[dict] = []
    uploaded_by: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "answer_keys"


class AnswerSubmission(Document):
    student_id: str
    student_name: str = ""
    exam_id: str
    subject: str = ""
    class_name: str = ""
    section: str = ""
    file_name: str = ""
    file_path: Optional[str] = None
    raw_text: str = ""
    total_ai_marks: float = 0.0
    total_teacher_marks: float = 0.0
    final_marks: float = 0.0
    average_confidence: float = 0.0
    status: str = "PENDING"
    evaluations: List[dict] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "answer_submissions"


class Evaluation(Document):
    submission_id: str
    question_no: int = 0
    question_text: str = ""
    student_answer: str = ""
    expected_answer: str = ""
    maximum_marks: float = 0.0
    ai_marks: float = 0.0
    teacher_marks: float = 0.0
    final_marks: float = 0.0
    ai_confidence: float = 0.0
    feedback: str = ""
    rubric: List[dict] = []
    status: str = "AI_EVALUATED"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "evaluations"


# Convenience list used by Beanie's init_beanie()
ALL_DOCUMENTS = [
    User, Student, Teacher, Class, Subject,
    Room, Period, AttendanceRecord, DocumentRecord,
    Notification, AuditLog, Exam, QuestionPaper,
    AnswerKey, AnswerSubmission, Evaluation,
]
