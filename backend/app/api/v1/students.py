"""
Students CRUD endpoints.

Key behaviors:
- class_name is always resolved from the Class document when class_id is provided,
  so the stored denormalized name stays in sync with the actual class record.
- student_id is generated using the max existing id (not count), avoiding collisions
  after deletes.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import Student, Class
from app.schemas.schemas import StudentCreate, StudentUpdate, StudentOut
from datetime import date
import re

router = APIRouter()


async def _resolve_class_name(class_id: Optional[str]) -> Optional[str]:
    """Return the class display name for a given MongoDB class _id, or None."""
    if not class_id:
        return None
    cls = await Class.get(class_id)
    return cls.name if cls else None


async def _next_student_id() -> str:
    """Generate next student_id based on the highest existing id, not the count."""
    all_ids = [s.student_id async for s in Student.find()]
    max_num = 1000
    for sid in all_ids:
        m = re.match(r"STU-(\d+)", sid)
        if m:
            max_num = max(max_num, int(m.group(1)))
    return f"STU-{max_num + 1}"


def _student_out(s: Student) -> dict:
    return {
        "id": str(s.id),
        "student_id": s.student_id,
        "name": s.name,
        "date_of_birth": s.date_of_birth,
        "gender": s.gender,
        "class_id": s.class_id,
        "class_name": s.class_name,
        "section": s.section,
        "parent_name": s.parent_name,
        "parent_contact": s.parent_contact,
        "email": s.email,
        "address": s.address,
        "admission_date": s.admission_date,
        "attendance_percentage": s.attendance_percentage,
        "status": s.status,
        "blood_group": s.blood_group,
        "nationality": s.nationality,
    }


@router.get("/", response_model=List[StudentOut])
async def list_students(
    search: Optional[str] = Query(None),
    class_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
):
    query = Student.find()
    if search:
        query = query.find({"name": {"$regex": search, "$options": "i"}})
    if class_id:
        query = query.find(Student.class_id == class_id)
    if status:
        query = query.find(Student.status == status)
    students = await query.skip(skip).limit(limit).to_list()
    return [_student_out(s) for s in students]


@router.post("/", response_model=StudentOut, status_code=201)
async def create_student(payload: StudentCreate):
    student_id = await _next_student_id()

    # Always resolve class_name from the DB when class_id is provided
    class_name = payload.class_name
    if payload.class_id and not class_name:
        class_name = await _resolve_class_name(payload.class_id)

    data = payload.model_dump()
    data["class_name"] = class_name

    student = Student(
        student_id=student_id,
        admission_date=str(date.today()),
        attendance_percentage=0.0,
        status="active",
        **data,
    )
    await student.insert()
    return _student_out(student)


@router.get("/{student_id}", response_model=StudentOut)
async def get_student(student_id: str):
    student = await Student.find_one(Student.student_id == student_id)
    if not student:
        raise HTTPException(404, "Student not found")
    return _student_out(student)


@router.patch("/{student_id}", response_model=StudentOut)
async def update_student(student_id: str, payload: StudentUpdate):
    student = await Student.find_one(Student.student_id == student_id)
    if not student:
        raise HTTPException(404, "Student not found")

    update_data = payload.model_dump(exclude_none=True)

    # If class_id changed, re-resolve class_name from the DB
    if "class_id" in update_data:
        resolved = await _resolve_class_name(update_data["class_id"])
        if resolved:
            update_data["class_name"] = resolved

    if update_data:
        await student.set(update_data)
    return _student_out(student)


@router.delete("/{student_id}", status_code=204)
async def delete_student(student_id: str):
    student = await Student.find_one(Student.student_id == student_id)
    if not student:
        raise HTTPException(404, "Student not found")
    await student.delete()
