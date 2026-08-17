"""
Subjects CRUD endpoints.
Teacher name is always resolved from the teachers collection — never stored as
free text. If teacher_id is provided without teacher_name, we look it up.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import Subject, Teacher
from app.schemas.schemas import SubjectCreate, SubjectUpdate, SubjectOut

router = APIRouter()


async def _resolve_teacher(teacher_id: Optional[str]) -> Optional[str]:
    """Return the teacher's display name for a given teacher_id, or None."""
    if not teacher_id:
        return None
    teacher = await Teacher.find_one(Teacher.teacher_id == teacher_id)
    return teacher.name if teacher else None


def _subject_out(s: Subject) -> dict:
    return {
        "id": str(s.id),
        "name": s.name,
        "code": s.code,
        "teacher_id": s.teacher_id,
        "teacher_name": s.teacher_name,
        "classes": s.classes,
        "weekly_periods": s.weekly_periods,
        "priority": s.priority,
        "department": s.department,
    }


@router.get("/", response_model=List[SubjectOut])
async def list_subjects(department: Optional[str] = Query(None)):
    query = Subject.find()
    if department:
        query = query.find(Subject.department == department)
    subjects = await query.sort(+Subject.name).to_list()
    return [_subject_out(s) for s in subjects]


@router.post("/", response_model=SubjectOut, status_code=201)
async def create_subject(payload: SubjectCreate):
    # Always resolve teacher name from DB
    teacher_name = payload.teacher_name
    if payload.teacher_id and not teacher_name:
        teacher_name = await _resolve_teacher(payload.teacher_id)

    subject = Subject(
        name=payload.name,
        code=payload.code,
        teacher_id=payload.teacher_id,
        teacher_name=teacher_name,
        classes=payload.classes,
        weekly_periods=payload.weekly_periods,
        priority=payload.priority,
        department=payload.department,
    )
    await subject.insert()
    return _subject_out(subject)


@router.get("/{subject_id}", response_model=SubjectOut)
async def get_subject(subject_id: str):
    subject = await Subject.get(subject_id)
    if not subject:
        raise HTTPException(404, "Subject not found")
    return _subject_out(subject)


@router.patch("/{subject_id}", response_model=SubjectOut)
async def update_subject(subject_id: str, payload: SubjectUpdate):
    subject = await Subject.get(subject_id)
    if not subject:
        raise HTTPException(404, "Subject not found")

    update_data = payload.model_dump(exclude_none=True)

    # Re-resolve teacher name if teacher_id changed
    if "teacher_id" in update_data and "teacher_name" not in update_data:
        update_data["teacher_name"] = await _resolve_teacher(update_data["teacher_id"])

    if update_data:
        await subject.set(update_data)
    return _subject_out(subject)


@router.delete("/{subject_id}", status_code=204)
async def delete_subject(subject_id: str):
    subject = await Subject.get(subject_id)
    if not subject:
        raise HTTPException(404, "Subject not found")
    await subject.delete()
