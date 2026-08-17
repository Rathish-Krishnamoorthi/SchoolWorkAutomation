"""
Classes CRUD endpoints.

Key behaviors:
- student_count is always computed live from the students collection.
- class_teacher_name is resolved from the Teacher document when class_teacher_id
  is provided, keeping the denormalized name accurate.
- On create/update, Teacher.classes is rebuilt so the teacher always reflects
  which classes they are assigned to.
- When Class.subjects changes, Subject.classes is updated bidirectionally:
    * New subjects in the list have this class's ID added to Subject.classes.
    * Removed subjects have this class's ID removed from Subject.classes.
- On delete: students lose their class_id, Subject.classes entries referencing
  this class are cleaned up, and the former class teacher's classes list is rebuilt.
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models.models import Class, Student, Teacher, Subject
from app.schemas.schemas import ClassCreate, ClassUpdate, ClassOut

router = APIRouter()


async def _live_count(class_id: str) -> int:
    """Count active students belonging to this class."""
    return await Student.find(
        Student.class_id == class_id,
        Student.status == "active",
    ).count()


async def _class_out(c: Class) -> dict:
    count = await _live_count(str(c.id))
    return {
        "id": str(c.id),
        "name": c.name,
        "grade": c.grade,
        "section": c.section,
        "class_teacher_id": c.class_teacher_id,
        "class_teacher_name": c.class_teacher_name,
        "room_id": c.room_id,
        "subjects": c.subjects,
        "academic_year": c.academic_year,
        "student_count": count,
    }


async def _sync_subjects_for_class(class_id: str, class_name: str,
                                    old_subjects: List[str], new_subjects: List[str]):
    """
    Bidirectionally sync Class.subjects ↔ Subject.classes.
    - Subjects added to the class → add class_id to Subject.classes.
    - Subjects removed from the class → remove class_id from Subject.classes.
    Subject.classes stores MongoDB IDs; Class.subjects stores subject names.
    """
    added   = [s for s in new_subjects if s not in old_subjects]
    removed = [s for s in old_subjects if s not in new_subjects]

    for sub_name in added:
        sub = await Subject.find_one(Subject.name == sub_name)
        if sub and class_id not in sub.classes:
            await sub.set({"classes": sub.classes + [class_id]})

    for sub_name in removed:
        sub = await Subject.find_one(Subject.name == sub_name)
        if sub and class_id in sub.classes:
            await sub.set({"classes": [cid for cid in sub.classes if cid != class_id]})


async def _rebuild_teacher_classes(teacher_id: str):
    """Rebuild Teacher.classes for the given teacher_id from live Class data."""
    if not teacher_id:
        return
    classes = await Class.find(Class.class_teacher_id == teacher_id).to_list()
    class_names = [c.name for c in classes]
    teacher = await Teacher.find_one(Teacher.teacher_id == teacher_id)
    if teacher:
        await teacher.set({"classes": class_names})


@router.get("/", response_model=List[ClassOut])
async def list_classes(grade: Optional[int] = None):
    query = Class.find()
    if grade is not None:
        query = query.find(Class.grade == grade)
    classes = await query.sort(+Class.grade).to_list()
    return [await _class_out(c) for c in classes]


@router.post("/", response_model=ClassOut, status_code=201)
async def create_class(payload: ClassCreate):
    # Resolve teacher name from DB if only teacher_id supplied
    teacher_name = payload.class_teacher_name
    if payload.class_teacher_id and not teacher_name:
        teacher = await Teacher.find_one(Teacher.teacher_id == payload.class_teacher_id)
        if teacher:
            teacher_name = teacher.name

    cls = Class(
        name=payload.name,
        grade=payload.grade,
        section=payload.section,
        class_teacher_id=payload.class_teacher_id,
        class_teacher_name=teacher_name,
        room_id=payload.room_id,
        subjects=payload.subjects,
        academic_year=payload.academic_year,
        student_count=0,
    )
    await cls.insert()
    class_id = str(cls.id)

    # Sync subjects: add this class to each subject's classes list
    await _sync_subjects_for_class(class_id, cls.name, [], payload.subjects)

    # Rebuild teacher's class list
    if payload.class_teacher_id:
        await _rebuild_teacher_classes(payload.class_teacher_id)

    return await _class_out(cls)


@router.get("/{class_id}", response_model=ClassOut)
async def get_class(class_id: str):
    cls = await Class.get(class_id)
    if not cls:
        raise HTTPException(404, "Class not found")
    return await _class_out(cls)


@router.patch("/{class_id}", response_model=ClassOut)
async def update_class(class_id: str, payload: ClassUpdate):
    cls = await Class.get(class_id)
    if not cls:
        raise HTTPException(404, "Class not found")

    old_subjects     = list(cls.subjects)
    old_teacher_id   = cls.class_teacher_id
    update_data      = payload.model_dump(exclude_none=True)

    # If teacher_id changed, resolve the new teacher name
    if "class_teacher_id" in update_data and "class_teacher_name" not in update_data:
        teacher = await Teacher.find_one(
            Teacher.teacher_id == update_data["class_teacher_id"]
        )
        if teacher:
            update_data["class_teacher_name"] = teacher.name

    # Never overwrite live count via PATCH
    update_data.pop("student_count", None)

    if update_data:
        await cls.set(update_data)

    # Sync subjects bidirectionally if subjects list changed
    new_subjects = update_data.get("subjects", old_subjects)
    if new_subjects != old_subjects:
        await _sync_subjects_for_class(class_id, cls.name, old_subjects, new_subjects)

    # Rebuild teacher class lists when the class teacher changed
    new_teacher_id = update_data.get("class_teacher_id", old_teacher_id)
    if new_teacher_id != old_teacher_id:
        # Rebuild for both old and new teacher
        if old_teacher_id:
            await _rebuild_teacher_classes(old_teacher_id)
        if new_teacher_id:
            await _rebuild_teacher_classes(new_teacher_id)
    elif new_teacher_id:
        await _rebuild_teacher_classes(new_teacher_id)

    return await _class_out(cls)


@router.delete("/{class_id}", status_code=204)
async def delete_class(class_id: str):
    cls = await Class.get(class_id)
    if not cls:
        raise HTTPException(404, "Class not found")

    # Remove class reference from all students
    students = await Student.find(Student.class_id == class_id).to_list()
    for s in students:
        await s.set({"class_id": None, "class_name": None})

    # Remove class from all Subject.classes lists
    subjects = await Subject.find({"classes": class_id}).to_list()
    for sub in subjects:
        await sub.set({"classes": [cid for cid in sub.classes if cid != class_id]})

    # Rebuild the former class teacher's class list
    if cls.class_teacher_id:
        await _rebuild_teacher_classes(cls.class_teacher_id)

    await cls.delete()


@router.get("/{class_id}/students")
async def get_class_students(class_id: str):
    """Return the students that belong to this class."""
    cls = await Class.get(class_id)
    if not cls:
        raise HTTPException(404, "Class not found")
    students = await Student.find(Student.class_id == class_id).to_list()
    return [
        {
            "id": str(s.id),
            "student_id": s.student_id,
            "name": s.name,
            "section": s.section,
            "status": s.status,
            "attendance_percentage": s.attendance_percentage,
            "gender": s.gender,
        }
        for s in students
    ]
