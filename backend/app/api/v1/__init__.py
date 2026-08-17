from fastapi import APIRouter
from app.api.v1 import auth, students, teachers, classes, subjects, attendance, documents, ai, notifications, timetable, paper_correction

router = APIRouter()
router.include_router(auth.router,        prefix="/auth",        tags=["Authentication"])
router.include_router(students.router,    prefix="/students",    tags=["Students"])
router.include_router(teachers.router,    prefix="/teachers",    tags=["Teachers"])
router.include_router(classes.router,     prefix="/classes",     tags=["Classes"])
router.include_router(subjects.router,    prefix="/subjects",    tags=["Subjects"])
router.include_router(attendance.router,  prefix="/attendance",  tags=["Attendance"])
router.include_router(documents.router,   prefix="/documents",   tags=["Documents"])
router.include_router(ai.router,          prefix="/ai",          tags=["AI"])
router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
router.include_router(timetable.router,   prefix="/timetable",   tags=["Timetable"])
router.include_router(paper_correction.router, prefix="/paper-correction", tags=["AI Paper Correction"])
