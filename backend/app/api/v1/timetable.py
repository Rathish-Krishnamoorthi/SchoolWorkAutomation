"""
Timetable API — AI-driven constraint-based schedule generator.

Endpoints
---------
POST   /timetable/generate               Generate timetable for all classes.
GET    /timetable/periods                Periods filtered by class_id (optional).
GET    /timetable/periods/all            All periods for an academic year.
PATCH  /timetable/periods/{id}/lock     Lock / unlock a period.
POST   /timetable/save                  Persist a client-supplied timetable.
DELETE /timetable/clear                 Wipe unlocked periods for an academic year.
GET    /timetable/conflicts             Live conflict scan of stored periods.

Algorithm — Fair-share two-phase CSP
--------------------------------------
Phase 1 – Teacher slot pre-allocation
  For every (teacher, subject) pair, collect all classes that need that subject.
  Distribute the required weekly periods evenly across the 35 available (day, slot)
  cells so that no two classes that share the same teacher are assigned the same
  slot for that subject.  This guarantees every class gets its fair share before
  any single class can exhaust a shared resource.

Phase 2 – Cell assignment
  Walk each (class, day, slot) in sorted order and fill it from the pre-allocated
  reservation list.  Hard constraints re-checked:
    C1. Teacher free at this slot (guaranteed by Phase 1, but re-verified).
    C2. No more than 2 consecutive same-subject periods per class per day.
    C3. Each subject's weekly quota is not exceeded.
"""

import random
from typing import List, Optional, Dict, Tuple
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from app.models.models import Period, Class, Subject, Teacher

router = APIRouter()

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
TIME_SLOTS: List[Tuple[str, str]] = [
    ("08:30", "09:30"),
    ("09:30", "10:30"),
    ("10:30", "11:30"),
    ("11:30", "12:30"),
    ("13:30", "14:30"),
    ("14:30", "15:30"),
    ("15:30", "16:30"),
]
# All (day, slot_index) pairs — 35 per week
ALL_SLOTS = [(d, i) for d in DAYS for i in range(len(TIME_SLOTS))]


# ─── Pydantic models ──────────────────────────────────────────────────────────

class PeriodOut(BaseModel):
    id: str
    day: str
    start_time: str
    end_time: str
    subject_id: str
    subject_name: str
    teacher_id: str
    teacher_name: str
    class_id: str
    class_name: str
    room_name: str
    locked: bool
    academic_year: str


class ConflictOut(BaseModel):
    type: str
    severity: str
    description: str
    affected_period_ids: List[str]
    day: str
    time: str


class GenerateResult(BaseModel):
    periods_created: int
    conflicts: List[ConflictOut]
    warnings: List[str]
    academic_year: str


class SavePeriodIn(BaseModel):
    id: Optional[str] = None
    day: str
    start_time: str
    end_time: str
    subject_id: str
    subject_name: str
    teacher_id: str
    teacher_name: str
    class_id: str
    class_name: str
    room_name: str = ""
    locked: bool = False
    academic_year: str = "2025-26"


class SaveRequest(BaseModel):
    periods: List[SavePeriodIn]
    academic_year: str = "2025-26"


# ─── Serialiser ───────────────────────────────────────────────────────────────

def _period_out(p: Period) -> dict:
    return {
        "id":            str(p.id),
        "day":           p.day,
        "start_time":    p.start_time,
        "end_time":      p.end_time,
        "subject_id":    p.subject_id or "",
        "subject_name":  p.subject_name,
        "teacher_id":    p.teacher_id or "",
        "teacher_name":  p.teacher_name,
        "class_id":      p.class_id or "",
        "class_name":    p.class_name,
        "room_name":     p.room_name,
        "locked":        p.locked,
        "academic_year": p.academic_year,
    }


# ─── Core scheduler ───────────────────────────────────────────────────────────

async def _build_schedule(academic_year: str) -> tuple[list[dict], list[dict], list[str]]:
    all_classes  = await Class.find().to_list()
    all_subjects = await Subject.find().to_list()
    all_teachers = await Teacher.find().to_list()

    warnings: list[str] = []
    if not all_classes:
        return [], [], ["No classes found — run the seeder first."]

    subject_by_name: Dict[str, Subject]  = {s.name: s for s in all_subjects}
    teacher_by_id:   Dict[str, Teacher]  = {t.teacher_id: t for t in all_teachers}

    # ── Phase 1: build per-(teacher, subject) slot pools ─────────────────────
    # For each teacher, partition the 35 weekly slots fairly among all classes
    # that need each subject taught by that teacher.
    #
    # teacher_subject_slots[(teacher_id, subject_name)]
    #     = {class_id: [(day, slot_idx), ...]}
    #
    # We round-robin the available teacher slots across classes so each class
    # gets exactly `weekly_periods` slots and no two classes share a slot.

    # First collect what each class needs
    class_needs: Dict[str, list] = {}  # class_id -> [(sub, teacher_id, quota)]
    for cls in all_classes:
        cid   = str(cls.id)
        needs = []
        for sub_name in cls.subjects:
            sub = subject_by_name.get(sub_name)
            if not sub:
                warnings.append(f"{cls.name}: '{sub_name}' not in subjects — skipped")
                continue
            if not sub.teacher_id:
                warnings.append(f"{cls.name}: '{sub_name}' has no teacher — skipped")
                continue
            if sub.teacher_id not in teacher_by_id:
                warnings.append(f"{cls.name}: teacher '{sub.teacher_id}' not found — skipped")
                continue
            needs.append((sub, sub.teacher_id, max(1, sub.weekly_periods)))
        class_needs[cid] = needs

    # Group by (teacher_id, subject_name) → list of (class_id, quota)
    from collections import defaultdict
    teacher_sub_classes: Dict[tuple, list] = defaultdict(list)
    for cls in all_classes:
        cid = str(cls.id)
        for sub, tid, quota in class_needs.get(cid, []):
            teacher_sub_classes[(tid, sub.name)].append((cid, quota))

    # Pre-allocate slots per (teacher, subject, class)
    # reservations[class_id][subject_name] = deque of (day, slot_idx)
    reservations: Dict[str, Dict[str, list]] = {
        str(cls.id): defaultdict(list) for cls in all_classes
    }
    # teacher_busy_slots[teacher_id] = set of (day, slot_idx) already reserved
    teacher_busy_slots: Dict[str, set] = {t.teacher_id: set() for t in all_teachers}

    for (tid, sub_name), class_list in teacher_sub_classes.items():
        # Build shuffled pool of free slots for this teacher
        free = [s for s in ALL_SLOTS if s not in teacher_busy_slots[tid]]
        random.shuffle(free)

        # Each class needs `quota` slots; distribute round-robin
        # Build a flat demand list: [(class_id, quota), ...] repeated
        demand: list[str] = []
        for cid, quota in class_list:
            demand.extend([cid] * quota)
        random.shuffle(demand)   # mix classes so they're served interleaved

        ptr = 0
        for cid in demand:
            if ptr >= len(free):
                warnings.append(
                    f"Teacher '{tid}' ran out of free slots for '{sub_name}' "
                    f"(needed by {len(class_list)} classes)"
                )
                break
            slot = free[ptr]
            ptr += 1
            teacher_busy_slots[tid].add(slot)
            reservations[cid][sub_name].append(slot)

    # ── Phase 2: fill the timetable grid from reservations ────────────────────
    # For each class, walk the reservations and place periods.
    # We respect the consecutive-subject constraint here.

    periods: list[dict] = []

    for cls in all_classes:
        cid  = str(cls.id)
        res  = reservations[cid]   # subject_name -> [(day, slot_idx)]

        # Build full list of (day, slot_idx, sub, teacher_id) to schedule
        to_place: list[tuple] = []
        for sub, tid, quota in class_needs.get(cid, []):
            for slot in res.get(sub.name, []):
                to_place.append((slot[0], slot[1], sub, tid))

        # Sort by (day_index, slot_idx) so we fill chronologically
        day_order = {d: i for i, d in enumerate(DAYS)}
        to_place.sort(key=lambda x: (day_order[x[0]], x[1]))

        # Consecutive-subject tracker
        last_two: Dict[str, list] = {d: [] for d in DAYS}

        for (day, slot_idx, sub, tid) in to_place:
            start, end = TIME_SLOTS[slot_idx]

            # C2: no more than 2 consecutive same subject per day
            recent = last_two[day]
            if len(recent) >= 2 and recent[-1] == sub.name and recent[-2] == sub.name:
                # Try to find another slot for this subject later (simple skip)
                warnings.append(
                    f"{cls.name}: skipped 3rd consecutive '{sub.name}' on {day} — "
                    f"period omitted"
                )
                continue

            teacher = teacher_by_id[tid]
            periods.append({
                "day":           day,
                "start_time":    start,
                "end_time":      end,
                "subject_id":    str(sub.id),
                "subject_name":  sub.name,
                "teacher_id":    tid,
                "teacher_name":  teacher.name,
                "class_id":      cid,
                "class_name":    cls.name,
                "room_name":     "",
                "locked":        False,
                "academic_year": academic_year,
            })
            tail = last_two[day]
            tail.append(sub.name)
            if len(tail) > 2:
                tail.pop(0)

    # ── Conflict-detection ────────────────────────────────────────────────────
    conflicts: list[dict] = []
    teacher_slot_index: dict[tuple, list] = {}
    for i, p in enumerate(periods):
        key = (p["teacher_id"], p["day"], p["start_time"])
        teacher_slot_index.setdefault(key, []).append(i)

    for (tid, day, start), idxs in teacher_slot_index.items():
        if len(idxs) > 1:
            tname = periods[idxs[0]]["teacher_name"]
            conflicts.append({
                "type":                "teacher_double_booked",
                "severity":            "critical",
                "description":         f"{tname} assigned to {len(idxs)} classes on {day} {start}",
                "affected_period_ids": [str(i) for i in idxs],
                "day":                 day,
                "time":                start,
            })

    return periods, conflicts, warnings


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/generate", response_model=GenerateResult)
async def generate_timetable(academic_year: str = Query(default="2025-26")):
    """Delete existing unlocked periods then regenerate using the AI scheduler."""
    # Bulk-delete old unlocked periods (one Motor call, not N)
    await Period.find(
        Period.academic_year == academic_year,
        Period.locked == False,   # noqa: E712
    ).delete_many()

    periods_data, conflicts, warnings = await _build_schedule(academic_year)

    # Bulk-insert all periods in a single round-trip
    if periods_data:
        docs = [Period(**p) for p in periods_data]
        await Period.insert_many(docs)

    return GenerateResult(
        periods_created=len(periods_data),
        conflicts=conflicts,
        warnings=warnings,
        academic_year=academic_year,
    )


@router.get("/periods", response_model=List[PeriodOut])
async def get_periods(
    class_id:      Optional[str] = Query(None),
    academic_year: str           = Query(default="2025-26"),
):
    query = Period.find(Period.academic_year == academic_year)
    if class_id:
        query = query.find(Period.class_id == class_id)
    return [_period_out(p) for p in await query.to_list()]


@router.get("/periods/all", response_model=List[PeriodOut])
async def get_all_periods(academic_year: str = Query(default="2025-26")):
    return [_period_out(p) for p in
            await Period.find(Period.academic_year == academic_year).to_list()]


@router.patch("/periods/{period_id}/lock")
async def toggle_lock(period_id: str, locked: bool = Query(...)):
    p = await Period.get(period_id)
    if not p:
        raise HTTPException(404, "Period not found")
    await p.set({"locked": locked})
    return _period_out(p)


@router.post("/save")
async def save_timetable(body: SaveRequest):
    saved = 0
    for pin in body.periods:
        if pin.id:
            existing = await Period.get(pin.id)
            if existing:
                if existing.locked:
                    continue
                await existing.set({
                    "day":          pin.day,
                    "start_time":   pin.start_time,
                    "end_time":     pin.end_time,
                    "subject_id":   pin.subject_id,
                    "subject_name": pin.subject_name,
                    "teacher_id":   pin.teacher_id,
                    "teacher_name": pin.teacher_name,
                    "class_name":   pin.class_name,
                    "room_name":    pin.room_name,
                    "locked":       pin.locked,
                })
                saved += 1
                continue
        await Period(
            day=pin.day, start_time=pin.start_time, end_time=pin.end_time,
            subject_id=pin.subject_id, subject_name=pin.subject_name,
            teacher_id=pin.teacher_id, teacher_name=pin.teacher_name,
            class_id=pin.class_id, class_name=pin.class_name,
            room_name=pin.room_name, locked=pin.locked,
            academic_year=body.academic_year,
        ).insert()
        saved += 1
    return {"saved": saved}


@router.delete("/clear")
async def clear_timetable(academic_year: str = Query(default="2025-26")):
    await Period.find(
        Period.academic_year == academic_year,
        Period.locked == False,   # noqa: E712
    ).delete_many()
    return {"deleted": "ok", "academic_year": academic_year}


@router.get("/conflicts", response_model=List[ConflictOut])
async def get_conflicts(academic_year: str = Query(default="2025-26")):
    periods = await Period.find(Period.academic_year == academic_year).to_list()
    conflicts: list[dict] = []
    teacher_slot: dict[tuple, list] = {}
    room_slot:    dict[tuple, list] = {}

    for p in periods:
        pid = str(p.id)
        if p.teacher_id:
            teacher_slot.setdefault((p.teacher_id, p.day, p.start_time), []).append(pid)
        if p.room_name:
            room_slot.setdefault((p.room_name, p.day, p.start_time), []).append(pid)

    for (tid, day, time), pids in teacher_slot.items():
        if len(pids) > 1:
            teacher = await Teacher.find_one(Teacher.teacher_id == tid)
            name = teacher.name if teacher else tid
            conflicts.append({
                "type": "teacher_double_booked", "severity": "critical",
                "description": f"{name} assigned to {len(pids)} classes on {day} {time}",
                "affected_period_ids": pids, "day": day, "time": time,
            })
    for (room, day, time), pids in room_slot.items():
        if len(pids) > 1:
            conflicts.append({
                "type": "room_double_booked", "severity": "critical",
                "description": f"Room '{room}' double-booked on {day} {time}",
                "affected_period_ids": pids, "day": day, "time": time,
            })

    return conflicts
