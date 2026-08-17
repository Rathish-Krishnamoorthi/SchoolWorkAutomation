"""
Teachers CRUD endpoints.

Key behaviors:
- When a teacher's name changes, all Subject.teacher_name and Class.class_teacher_name
  fields that reference them are cascaded automatically.
- sync_teacher_subjects_classes:
    * For every subject name in Teacher.subjects, sets teacher_id/teacher_name on
      the matching Subject document.
    * For every class name/id in Teacher.classes, sets nothing new (Teacher.classes
      is computed, not authoritative).
    * Rebuilds Teacher.classes from the set of all Class docs whose class_teacher_id
      matches this teacher.
- On teacher delete: clears teacher_id/teacher_name from Subjects and
  class_teacher_id/class_teacher_name from Classes that referenced this teacher.
- teacher_id generation uses max-based logic to avoid collisions after deletes.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.models import Teacher, Subject, Class
from app.schemas.schemas import TeacherCreate, TeacherOut, TeacherUpdate
from datetime import date
import re

router = APIRouter()


async def _next_teacher_id() -> str:
    """Generate next teacher_id based on the highest existing id, not the count."""
    all_ids = [t.teacher_id async for t in Teacher.find()]
    max_num = 0
    for tid in all_ids:
        m = re.match(r"TCH-(\d+)", tid)
        if m:
            max_num = max(max_num, int(m.group(1)))
    return f"TCH-{max_num + 1:03d}"


async def _propagate_teacher_name(teacher_id: str, new_name: str):
    """Cascade a teacher name change to all referencing Subject and Class docs."""
    subjects = await Subject.find(Subject.teacher_id == teacher_id).to_list()
    for sub in subjects:
        await sub.set({"teacher_name": new_name})

    classes = await Class.find(Class.class_teacher_id == teacher_id).to_list()
    for cls in classes:
        await cls.set({"class_teacher_name": new_name})


async def _rebuild_teacher_classes(teacher_id: str) -> List[str]:
    """
    Return the list of class names where this teacher is the class teacher.
    Persists the result back onto the Teacher document.
    """
    classes = await Class.find(Class.class_teacher_id == teacher_id).to_list()
    class_names = [c.name for c in classes]
    teacher = await Teacher.find_one(Teacher.teacher_id == teacher_id)
    if teacher:
        await teacher.set({"classes": class_names})
    return class_names


async def _clear_teacher_references(teacher_id: str):
    """Remove this teacher from all Subject and Class documents."""
    subjects = await Subject.find(Subject.teacher_id == teacher_id).to_list()
    for sub in subjects:
        await sub.set({"teacher_id": None, "teacher_name": None})

    classes = await Class.find(Class.class_teacher_id == teacher_id).to_list()
    for cls in classes:
        await cls.set({"class_teacher_id": None, "class_teacher_name": None})


def _teacher_out(t: Teacher) -> dict:
    return {
        "id": str(t.id),
        "teacher_id": t.teacher_id,
        "name": t.name,
        "department": t.department,
        "subjects": t.subjects,
        "classes": t.classes,
        "email": t.email,
        "phone": t.phone,
        "qualification": t.qualification,
        "experience": t.experience,
        "workload": t.workload,
        "status": t.status,
        "joining_date": t.joining_date,
    }


@router.get("/", response_model=List[TeacherOut])
async def list_teachers(
    search: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
):
    query = Teacher.find()
    if search:
        query = query.find({"name": {"$regex": search, "$options": "i"}})
    if department:
        query = query.find(Teacher.department == department)
    teachers = await query.to_list()
    return [_teacher_out(t) for t in teachers]


@router.post("/", response_model=TeacherOut, status_code=201)
async def create_teacher(payload: TeacherCreate):
    teacher_id = await _next_teacher_id()
    teacher = Teacher(
        teacher_id=teacher_id,
        joining_date=str(date.today()),
        workload=0.0,
        status="active",
        availability={},
        **payload.model_dump(),
    )
    await teacher.insert()
    # Propagate this teacher's name onto any existing subjects/classes that reference it
    await _propagate_teacher_name(teacher.teacher_id, teacher.name)
    # Sync subject assignments and rebuild classes list
    await sync_teacher_subjects_classes(teacher.teacher_id)
    return _teacher_out(teacher)


@router.get("/{teacher_id}", response_model=TeacherOut)
async def get_teacher(teacher_id: str):
    teacher = await Teacher.find_one(Teacher.teacher_id == teacher_id)
    if not teacher:
        raise HTTPException(404, "Teacher not found")
    return _teacher_out(teacher)


@router.patch("/{teacher_id}", response_model=TeacherOut)
async def update_teacher(teacher_id: str, payload: TeacherUpdate):
    teacher = await Teacher.find_one(Teacher.teacher_id == teacher_id)
    if not teacher:
        raise HTTPException(404, "Teacher not found")

    update_data = payload.model_dump(exclude_none=True)
    if update_data:
        await teacher.set(update_data)

    # Cascade name change to all linked documents
    if "name" in update_data:
        await _propagate_teacher_name(teacher_id, update_data["name"])

    # If subjects changed, re-sync subject assignments
    if "subjects" in update_data:
        await sync_teacher_subjects_classes(teacher_id)

    # Refresh from DB before returning so we get the updated classes list
    teacher = await Teacher.find_one(Teacher.teacher_id == teacher_id)
    return _teacher_out(teacher)


@router.delete("/{teacher_id}", status_code=204)
async def delete_teacher(teacher_id: str):
    teacher = await Teacher.find_one(Teacher.teacher_id == teacher_id)
    if not teacher:
        raise HTTPException(404, "Teacher not found")
    # Clear all references before deleting
    await _clear_teacher_references(teacher_id)
    await teacher.delete()


@router.post("/{teacher_id}/sync-subjects-classes")
async def sync_teacher_subjects_classes(teacher_id: str):
    """
    Called after teacher subjects list changes.
    - Sets teacher_id + teacher_name on every Subject whose name appears in
      Teacher.subjects.
    - Rebuilds Teacher.classes from all Class docs where class_teacher_id == teacher_id.
    Returns counts of what was updated.
    """
    teacher = await Teacher.find_one(Teacher.teacher_id == teacher_id)
    if not teacher:
        raise HTTPException(404, "Teacher not found")

    # Sync subjects: set teacher_id/name on matching Subject documents
    updated_subjects = 0
    for sub_name in teacher.subjects:
        sub = await Subject.find_one(Subject.name == sub_name)
        if sub:
            await sub.set({"teacher_id": teacher.teacher_id, "teacher_name": teacher.name})
            updated_subjects += 1

    # Rebuild teacher's class list from actual Class documents
    class_names = await _rebuild_teacher_classes(teacher_id)

    return {
        "teacher_id": teacher_id,
        "updated_subjects": updated_subjects,
        "classes": class_names,
    }
