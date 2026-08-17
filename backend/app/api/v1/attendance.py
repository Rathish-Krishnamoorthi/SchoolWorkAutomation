from fastapi import APIRouter, Query
from typing import Optional
from app.models.models import AttendanceRecord
from app.schemas.schemas import AttendanceMarkRequest, BulkAttendanceRequest
from datetime import datetime

router = APIRouter()


@router.get("/")
async def list_attendance(
    class_id: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    student_id: Optional[str] = Query(None),
):
    query = AttendanceRecord.find()
    if class_id:
        query = query.find(AttendanceRecord.class_id == class_id)
    if date:
        query = query.find(AttendanceRecord.date == date)
    if student_id:
        query = query.find(AttendanceRecord.student_id == student_id)
    records = await query.sort(-AttendanceRecord.date).limit(500).to_list()
    return [_rec_out(r) for r in records]


@router.post("/mark", status_code=201)
async def mark_attendance(payload: AttendanceMarkRequest):
    existing = await AttendanceRecord.find_one(
        AttendanceRecord.student_id == payload.student_id,
        AttendanceRecord.date == payload.date,
    )
    if existing:
        await existing.set({
            "status": payload.status,
            "mode": payload.mode,
            "notes": payload.notes,
        })
        return _rec_out(existing)

    record = AttendanceRecord(
        student_id=payload.student_id,
        class_id=payload.class_id,
        date=payload.date,
        status=payload.status,
        marked_by="Admin",
        mode=payload.mode,
        time=datetime.now().strftime("%H:%M"),
        notes=payload.notes,
    )
    await record.insert()
    return _rec_out(record)


@router.post("/bulk-mark", status_code=201)
async def bulk_mark_attendance(payload: BulkAttendanceRequest):
    count = 0
    for rec in payload.records:
        existing = await AttendanceRecord.find_one(
            AttendanceRecord.student_id == rec.student_id,
            AttendanceRecord.date == rec.date,
        )
        if existing:
            await existing.set({"status": rec.status, "mode": rec.mode})
        else:
            await AttendanceRecord(
                student_id=rec.student_id,
                class_id=rec.class_id,
                date=rec.date,
                status=rec.status,
                marked_by="Admin",
                mode=rec.mode,
                time=datetime.now().strftime("%H:%M"),
            ).insert()
        count += 1
    return {"marked": count}


def _rec_out(r: AttendanceRecord) -> dict:
    return {
        "id": str(r.id),
        "student_id": r.student_id,
        "student_name": r.student_name,
        "class_id": r.class_id,
        "date": r.date,
        "status": r.status,
        "marked_by": r.marked_by,
        "mode": r.mode,
        "time": r.time,
        "notes": r.notes,
    }
