"""
MongoDB seeder — populates:
  - Users  (admin accounts)
  - Teachers
  - Classes  (class_teacher_id/name resolved from inserted teachers)
  - Subjects (teacher_id/name resolved from inserted teachers)
  - Students (class_id resolved from inserted classes)

Run from the backend/ directory:
    python -m app.db.seed
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from beanie import init_beanie
from app.db.database import client, database
from app.models.models import ALL_DOCUMENTS, User, Teacher, Class, Subject, Student
from app.core.security import hash_password


# ── Raw seed data ─────────────────────────────────────────────────────────────

SEED_USERS = [
    {"name": "Admin",     "email": "admin@school.edu", "password": "admin123", "role": "admin"},
    {"name": "Demo User", "email": "demo@school.edu",  "password": "demo123",  "role": "admin"},
]

SEED_TEACHERS = [
    {"teacher_id": "TCH-001", "name": "Mr. Suresh Kumar",   "department": "Mathematics",     "subjects": ["Mathematics", "Statistics"],             "email": "suresh.kumar@school.edu",   "phone": "9876500001", "qualification": "M.Sc. Mathematics, B.Ed", "experience": 12},
    {"teacher_id": "TCH-002", "name": "Ms. Priya Nair",     "department": "Science",         "subjects": ["Physics", "Chemistry"],                  "email": "priya.nair@school.edu",     "phone": "9876500002", "qualification": "M.Sc. Physics, B.Ed",     "experience": 9},
    {"teacher_id": "TCH-003", "name": "Mr. Arun Babu",      "department": "Languages",       "subjects": ["English", "Tamil"],                      "email": "arun.babu@school.edu",      "phone": "9876500003", "qualification": "M.A. English, B.Ed",      "experience": 7},
    {"teacher_id": "TCH-004", "name": "Ms. Kavitha Rajan",  "department": "Social Science",  "subjects": ["History", "Geography", "Civics"],        "email": "kavitha.rajan@school.edu",  "phone": "9876500004", "qualification": "M.A. History, B.Ed",      "experience": 5},
    {"teacher_id": "TCH-005", "name": "Mr. Rajesh Pillai",  "department": "Computer Science","subjects": ["Computer Science", "Information Technology"], "email": "rajesh.pillai@school.edu", "phone": "9876500005", "qualification": "MCA, B.Ed",              "experience": 8},
    {"teacher_id": "TCH-006", "name": "Ms. Deepa Sharma",   "department": "Science",         "subjects": ["Biology"],                               "email": "deepa.sharma@school.edu",   "phone": "9876500006", "qualification": "M.Sc. Biology, B.Ed",     "experience": 6},
    {"teacher_id": "TCH-007", "name": "Mr. Mohan Krishnan", "department": "Mathematics",     "subjects": ["Mathematics"],                           "email": "mohan.krishnan@school.edu", "phone": "9876500007", "qualification": "M.Sc. Mathematics, B.Ed", "experience": 15},
    {"teacher_id": "TCH-008", "name": "Ms. Anitha Menon",   "department": "Languages",       "subjects": ["Hindi", "Sanskrit"],                     "email": "anitha.menon@school.edu",   "phone": "9876500008", "qualification": "M.A. Hindi, B.Ed",        "experience": 10},
    {"teacher_id": "TCH-009", "name": "Mr. Subramaniam V",  "department": "Arts & PE",       "subjects": ["Physical Education", "Art"],             "email": "subbu.v@school.edu",        "phone": "9876500009", "qualification": "B.P.Ed, M.P.Ed",          "experience": 11},
    {"teacher_id": "TCH-010", "name": "Ms. Meena Sundaram", "department": "Science",         "subjects": ["Chemistry", "Physics"],                  "email": "meena.sundaram@school.edu", "phone": "9876500010", "qualification": "M.Sc. Chemistry, B.Ed",   "experience": 4},
    {"teacher_id": "TCH-011", "name": "Mr. Vijay Chandran", "department": "Social Science",  "subjects": ["Economics", "Commerce"],                 "email": "vijay.chandran@school.edu", "phone": "9876500011", "qualification": "M.Com, B.Ed",             "experience": 13},
    {"teacher_id": "TCH-012", "name": "Ms. Radha Gopalan",  "department": "Mathematics",     "subjects": ["Mathematics", "Statistics"],             "email": "radha.gopalan@school.edu",  "phone": "9876500012", "qualification": "M.Sc. Statistics, B.Ed",  "experience": 3},
]

# class_teacher_id references teacher_id strings above
SEED_CLASSES = [
    {"name": "Grade 6 - A",  "grade": 6,  "section": "A", "class_teacher_id": "TCH-003", "subjects": ["Mathematics", "English", "Tamil", "Biology", "History", "Hindi", "Physical Education"]},
    {"name": "Grade 6 - B",  "grade": 6,  "section": "B", "class_teacher_id": "TCH-008", "subjects": ["Mathematics", "English", "Tamil", "Biology", "History", "Hindi", "Physical Education"]},
    {"name": "Grade 7 - A",  "grade": 7,  "section": "A", "class_teacher_id": "TCH-007", "subjects": ["Mathematics", "English", "Tamil", "Biology", "History", "Hindi", "Physical Education"]},
    {"name": "Grade 7 - B",  "grade": 7,  "section": "B", "class_teacher_id": "TCH-003", "subjects": ["Mathematics", "English", "Tamil", "Biology", "History", "Hindi", "Physical Education"]},
    {"name": "Grade 8 - A",  "grade": 8,  "section": "A", "class_teacher_id": "TCH-010", "subjects": ["Mathematics", "English", "Tamil", "Physics", "Chemistry", "Biology", "History", "Hindi", "Physical Education"]},
    {"name": "Grade 8 - B",  "grade": 8,  "section": "B", "class_teacher_id": "TCH-004", "subjects": ["Mathematics", "English", "Tamil", "Physics", "Chemistry", "Biology", "History", "Hindi", "Physical Education"]},
    {"name": "Grade 9 - A",  "grade": 9,  "section": "A", "class_teacher_id": "TCH-006", "subjects": ["Mathematics", "English", "Tamil", "Physics", "Chemistry", "Biology", "History", "Computer Science", "Physical Education"]},
    {"name": "Grade 9 - B",  "grade": 9,  "section": "B", "class_teacher_id": "TCH-004", "subjects": ["Mathematics", "English", "Tamil", "Physics", "Chemistry", "Biology", "History", "Computer Science", "Physical Education"]},
    {"name": "Grade 10 - A", "grade": 10, "section": "A", "class_teacher_id": "TCH-001", "subjects": ["Mathematics", "English", "Tamil", "Physics", "Chemistry", "Biology", "History", "Computer Science", "Physical Education"]},
    {"name": "Grade 10 - B", "grade": 10, "section": "B", "class_teacher_id": "TCH-002", "subjects": ["Mathematics", "English", "Tamil", "Physics", "Chemistry", "Biology", "History", "Computer Science", "Physical Education"]},
    {"name": "Grade 11 - A", "grade": 11, "section": "A", "class_teacher_id": "TCH-005", "subjects": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "Economics"]},
    {"name": "Grade 12 - A", "grade": 12, "section": "A", "class_teacher_id": "TCH-011", "subjects": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science", "English", "Economics", "Statistics"]},
]

# teacher_id references teacher_id strings; class_ids will be filled at runtime
# using class names to map to inserted IDs
SEED_SUBJECTS = [
    {"name": "Mathematics",           "code": "MAT", "teacher_id": "TCH-001", "department": "Mathematics",     "weekly_periods": 6, "priority": "core",     "class_names": ["Grade 6 - A", "Grade 6 - B", "Grade 7 - A", "Grade 7 - B", "Grade 8 - A", "Grade 8 - B", "Grade 9 - A", "Grade 9 - B", "Grade 10 - A", "Grade 10 - B", "Grade 11 - A", "Grade 12 - A"]},
    {"name": "Physics",               "code": "PHY", "teacher_id": "TCH-002", "department": "Science",         "weekly_periods": 5, "priority": "core",     "class_names": ["Grade 8 - A", "Grade 8 - B", "Grade 9 - A", "Grade 9 - B", "Grade 10 - A", "Grade 10 - B", "Grade 11 - A", "Grade 12 - A"]},
    {"name": "Chemistry",             "code": "CHM", "teacher_id": "TCH-010", "department": "Science",         "weekly_periods": 5, "priority": "core",     "class_names": ["Grade 8 - A", "Grade 8 - B", "Grade 9 - A", "Grade 9 - B", "Grade 10 - A", "Grade 10 - B", "Grade 11 - A", "Grade 12 - A"]},
    {"name": "Biology",               "code": "BIO", "teacher_id": "TCH-006", "department": "Science",         "weekly_periods": 4, "priority": "core",     "class_names": ["Grade 6 - A", "Grade 6 - B", "Grade 7 - A", "Grade 7 - B", "Grade 8 - A", "Grade 8 - B", "Grade 9 - A", "Grade 9 - B", "Grade 10 - A", "Grade 10 - B"]},
    {"name": "English",               "code": "ENG", "teacher_id": "TCH-003", "department": "Languages",       "weekly_periods": 5, "priority": "core",     "class_names": ["Grade 6 - A", "Grade 6 - B", "Grade 7 - A", "Grade 7 - B", "Grade 8 - A", "Grade 8 - B", "Grade 9 - A", "Grade 9 - B", "Grade 10 - A", "Grade 10 - B", "Grade 11 - A", "Grade 12 - A"]},
    {"name": "Tamil",                 "code": "TAM", "teacher_id": "TCH-003", "department": "Languages",       "weekly_periods": 4, "priority": "core",     "class_names": ["Grade 6 - A", "Grade 6 - B", "Grade 7 - A", "Grade 7 - B", "Grade 8 - A", "Grade 8 - B", "Grade 9 - A", "Grade 9 - B", "Grade 10 - A", "Grade 10 - B"]},
    {"name": "Hindi",                 "code": "HIN", "teacher_id": "TCH-008", "department": "Languages",       "weekly_periods": 3, "priority": "core",     "class_names": ["Grade 6 - A", "Grade 6 - B", "Grade 7 - A", "Grade 7 - B", "Grade 8 - A", "Grade 8 - B"]},
    {"name": "History",               "code": "HIS", "teacher_id": "TCH-004", "department": "Social Science",  "weekly_periods": 3, "priority": "core",     "class_names": ["Grade 6 - A", "Grade 6 - B", "Grade 7 - A", "Grade 7 - B", "Grade 8 - A", "Grade 8 - B", "Grade 9 - A", "Grade 9 - B", "Grade 10 - A"]},
    {"name": "Computer Science",      "code": "CS",  "teacher_id": "TCH-005", "department": "Computer Science","weekly_periods": 4, "priority": "core",     "class_names": ["Grade 9 - A", "Grade 9 - B", "Grade 10 - A", "Grade 10 - B", "Grade 11 - A", "Grade 12 - A"]},
    {"name": "Physical Education",    "code": "PE",  "teacher_id": "TCH-009", "department": "Arts & PE",       "weekly_periods": 2, "priority": "activity", "class_names": ["Grade 6 - A", "Grade 6 - B", "Grade 7 - A", "Grade 7 - B", "Grade 8 - A", "Grade 8 - B", "Grade 9 - A", "Grade 9 - B", "Grade 10 - A"]},
    {"name": "Economics",             "code": "ECO", "teacher_id": "TCH-011", "department": "Social Science",  "weekly_periods": 4, "priority": "core",     "class_names": ["Grade 11 - A", "Grade 12 - A"]},
    {"name": "Statistics",            "code": "STA", "teacher_id": "TCH-012", "department": "Mathematics",     "weekly_periods": 3, "priority": "elective", "class_names": ["Grade 11 - A", "Grade 12 - A"]},
]

# Students: class_name maps to the class names above
SEED_STUDENTS = [
    # Grade 10 - A (3 students)
    {"name": "Rathish Kumar",    "date_of_birth": "2010-04-12", "gender": "male",   "class_name": "Grade 10 - A", "section": "A", "parent_name": "Rajesh Kumar",    "parent_contact": "9876543210", "address": "14, Gandhi Street, Coimbatore",      "blood_group": "B+"},
    {"name": "Priya Venkatesh",  "date_of_birth": "2010-07-22", "gender": "female", "class_name": "Grade 10 - A", "section": "A", "parent_name": "Venkatesh R",     "parent_contact": "9845321100", "address": "32, Anna Nagar, Chennai",            "blood_group": "O+"},
    {"name": "Bharath Rajan",    "date_of_birth": "2010-06-02", "gender": "male",   "class_name": "Grade 10 - A", "section": "A", "parent_name": "Rajan B",         "parent_contact": "7876543210", "address": "67, Pappanaickenpalayam, Coimbatore","blood_group": "O-"},
    # Grade 10 - B (2 students)
    {"name": "Arun Selvam",      "date_of_birth": "2010-01-15", "gender": "male",   "class_name": "Grade 10 - B", "section": "B", "parent_name": "Selvam K",        "parent_contact": "9900112233", "address": "7, RS Puram, Coimbatore",            "blood_group": "A+"},
    {"name": "Divya Lakshmi",    "date_of_birth": "2010-09-05", "gender": "female", "class_name": "Grade 10 - B", "section": "B", "parent_name": "Lakshmi M",       "parent_contact": "9988776655", "address": "22, Peelamedu, Coimbatore",          "blood_group": "AB+"},
    # Grade 9 - A (3 students)
    {"name": "Mohammed Irfan",   "date_of_birth": "2011-03-18", "gender": "male",   "class_name": "Grade 9 - A",  "section": "A", "parent_name": "Irfan Sheikh",    "parent_contact": "9765432100", "address": "45, Ukkadam, Coimbatore",            "blood_group": "O-"},
    {"name": "Sneha Ramesh",     "date_of_birth": "2011-11-30", "gender": "female", "class_name": "Grade 9 - A",  "section": "A", "parent_name": "Ramesh N",        "parent_contact": "9655432199", "address": "12, Saibaba Colony, Coimbatore",     "blood_group": "B+"},
    {"name": "Deepa Murugan",    "date_of_birth": "2011-09-17", "gender": "female", "class_name": "Grade 9 - A",  "section": "A", "parent_name": "Murugan R",       "parent_contact": "7765432109", "address": "45, Kovilpalayam, Coimbatore",       "blood_group": "A+"},
    # Grade 9 - B (1 student)
    {"name": "Karthik Suresh",   "date_of_birth": "2011-06-25", "gender": "male",   "class_name": "Grade 9 - B",  "section": "B", "parent_name": "Suresh B",        "parent_contact": "9543219876", "address": "88, Race Course, Coimbatore",        "blood_group": "A-"},
    # Grade 8 - A (2 students)
    {"name": "Ananya Krishnan",  "date_of_birth": "2012-02-14", "gender": "female", "class_name": "Grade 8 - A",  "section": "A", "parent_name": "Krishnan S",      "parent_contact": "9432187650", "address": "56, Singanallur, Coimbatore",        "blood_group": "O+"},
    {"name": "Vikram Nair",      "date_of_birth": "2012-08-19", "gender": "male",   "class_name": "Grade 8 - A",  "section": "A", "parent_name": "Nair V",          "parent_contact": "9321098765", "address": "23, Ganapathy, Coimbatore",          "blood_group": "B-"},
    # Grade 8 - B (2 students)
    {"name": "Kavya Mohan",      "date_of_birth": "2012-12-03", "gender": "female", "class_name": "Grade 8 - B",  "section": "B", "parent_name": "Mohan R",         "parent_contact": "9210987654", "address": "11, Vadavalli, Coimbatore",          "blood_group": "AB-"},
    {"name": "Vishal Anand",     "date_of_birth": "2012-04-08", "gender": "male",   "class_name": "Grade 8 - B",  "section": "B", "parent_name": "Anand V",         "parent_contact": "7654321098", "address": "12, Thudiyalur, Coimbatore",         "blood_group": "B+"},
    # Grade 7 - A (2 students)
    {"name": "Sanjay Pillai",    "date_of_birth": "2013-04-07", "gender": "male",   "class_name": "Grade 7 - A",  "section": "A", "parent_name": "Pillai M",        "parent_contact": "9109876543", "address": "67, Saravanampatti, Coimbatore",     "blood_group": "O+"},
    {"name": "Meera Subramanian","date_of_birth": "2013-07-21", "gender": "female", "class_name": "Grade 7 - A",  "section": "A", "parent_name": "Subramanian P",   "parent_contact": "9098765432", "address": "34, Ondipudur, Coimbatore",          "blood_group": "A+"},
    # Grade 7 - B (2 students)
    {"name": "Rohit Sharma",     "date_of_birth": "2013-10-15", "gender": "male",   "class_name": "Grade 7 - B",  "section": "B", "parent_name": "Sharma A",        "parent_contact": "8987654321", "address": "90, Sowripalayam, Coimbatore",       "blood_group": "B+"},
    {"name": "Anjali Menon",     "date_of_birth": "2013-12-29", "gender": "female", "class_name": "Grade 7 - B",  "section": "B", "parent_name": "Menon P",         "parent_contact": "7543210987", "address": "78, Perur, Coimbatore",              "blood_group": "AB-"},
    # Grade 6 - A (2 students)
    {"name": "Pooja Rajendran",  "date_of_birth": "2014-01-28", "gender": "female", "class_name": "Grade 6 - A",  "section": "A", "parent_name": "Rajendran K",     "parent_contact": "8876543210", "address": "45, Hopes College, Coimbatore",      "blood_group": "O+"},
    {"name": "Arjun Babu",       "date_of_birth": "2014-05-10", "gender": "male",   "class_name": "Grade 6 - A",  "section": "A", "parent_name": "Babu S",          "parent_contact": "8765432109", "address": "78, Eachanari, Coimbatore",          "blood_group": "A-"},
    # Grade 6 - B (2 students)
    {"name": "Nithya Chandran",  "date_of_birth": "2014-09-12", "gender": "female", "class_name": "Grade 6 - B",  "section": "B", "parent_name": "Chandran T",      "parent_contact": "8654321098", "address": "23, Podanur, Coimbatore",            "blood_group": "B-"},
    {"name": "Nikhil Venu",      "date_of_birth": "2014-08-11", "gender": "male",   "class_name": "Grade 6 - B",  "section": "B", "parent_name": "Venu S",          "parent_contact": "7432109876", "address": "34, Kinathukadavu, Coimbatore",      "blood_group": "O+"},
    # Grade 11 - A (2 students)
    {"name": "Surya Prakash",    "date_of_birth": "2009-11-06", "gender": "male",   "class_name": "Grade 11 - A", "section": "A", "parent_name": "Prakash N",       "parent_contact": "8543210987", "address": "12, Civil Aerodrome, Coimbatore",    "blood_group": "AB+"},
    {"name": "Lakshmi Priya",    "date_of_birth": "2009-03-14", "gender": "female", "class_name": "Grade 11 - A", "section": "A", "parent_name": "Priya V",         "parent_contact": "8432109876", "address": "56, Maruthamalai Road, Coimbatore",  "blood_group": "O+"},
    # Grade 12 - A (2 students)
    {"name": "Dinesh Babu",      "date_of_birth": "2008-07-19", "gender": "male",   "class_name": "Grade 12 - A", "section": "A", "parent_name": "Babu K",          "parent_contact": "8321098765", "address": "33, Sulur, Coimbatore",              "blood_group": "A+"},
    {"name": "Sangeetha Raj",    "date_of_birth": "2008-12-25", "gender": "female", "class_name": "Grade 12 - A", "section": "A", "parent_name": "Raj M",           "parent_contact": "8210987654", "address": "89, Kuniyamuthur, Coimbatore",       "blood_group": "B+"},
]


# ── Seed runner ───────────────────────────────────────────────────────────────

async def seed():
    await init_beanie(database=database, document_models=ALL_DOCUMENTS)

    # ── 1. Users ───────────────────────────────────────────────────────────────
    print("\n── Users ──")
    for s in SEED_USERS:
        existing = await User.find_one(User.email == s["email"])
        if existing:
            print(f"  skip  {s['email']} (already exists)")
            continue
        await User(
            name=s["name"],
            email=s["email"],
            hashed_password=hash_password(s["password"]),
            role=s["role"],
            is_active=True,
        ).insert()
        print(f"  [OK]  {s['email']}")

    # ── 2. Teachers ────────────────────────────────────────────────────────────
    print("\n── Teachers ──")
    for td in SEED_TEACHERS:
        existing = await Teacher.find_one(Teacher.teacher_id == td["teacher_id"])
        if existing:
            print(f"  skip  {td['teacher_id']} {td['name']}")
            continue
        from datetime import date
        await Teacher(
            teacher_id=td["teacher_id"],
            name=td["name"],
            department=td["department"],
            subjects=td["subjects"],
            classes=[],
            email=td["email"],
            phone=td["phone"],
            qualification=td["qualification"],
            experience=td["experience"],
            joining_date=str(date.today()),
            workload=0.0,
            status="active",
            availability={},
        ).insert()
        print(f"  [OK]  {td['teacher_id']} {td['name']}")

    # Build teacher_id → name lookup (for denormalization)
    teacher_map: dict[str, str] = {}
    async for t in Teacher.find():
        teacher_map[t.teacher_id] = t.name

    # ── 3. Classes ────────────────────────────────────────────────────────────
    print("\n── Classes ──")
    class_name_to_id: dict[str, str] = {}
    for cd in SEED_CLASSES:
        existing = await Class.find_one(Class.name == cd["name"])
        if existing:
            class_name_to_id[cd["name"]] = str(existing.id)
            print(f"  skip  {cd['name']}")
            continue
        teacher_name = teacher_map.get(cd["class_teacher_id"], "")
        cls = Class(
            name=cd["name"],
            grade=cd["grade"],
            section=cd["section"],
            class_teacher_id=cd["class_teacher_id"],
            class_teacher_name=teacher_name,
            subjects=cd["subjects"],
            academic_year="2025-26",
            student_count=0,
        )
        await cls.insert()
        class_name_to_id[cd["name"]] = str(cls.id)
        print(f"  [OK]  {cd['name']}  (teacher: {teacher_name})")

    # ── 4. Subjects ───────────────────────────────────────────────────────────
    print("\n── Subjects ──")
    for sd in SEED_SUBJECTS:
        existing = await Subject.find_one(Subject.name == sd["name"])
        if existing:
            print(f"  skip  {sd['name']}")
            continue
        teacher_name = teacher_map.get(sd["teacher_id"], "")
        # Resolve class_names → MongoDB IDs
        class_ids = [
            class_name_to_id[cn]
            for cn in sd["class_names"]
            if cn in class_name_to_id
        ]
        await Subject(
            name=sd["name"],
            code=sd["code"],
            teacher_id=sd["teacher_id"],
            teacher_name=teacher_name,
            classes=class_ids,
            weekly_periods=sd["weekly_periods"],
            priority=sd["priority"],
            department=sd["department"],
        ).insert()
        print(f"  [OK]  {sd['name']}  (teacher: {teacher_name}, {len(class_ids)} classes)")

    # ── 5. Students ───────────────────────────────────────────────────────────
    print("\n── Students ──")
    student_counter = 1001
    from datetime import date as _date
    for idx, sd in enumerate(SEED_STUDENTS):
        existing = await Student.find_one(Student.name == sd["name"])
        if existing:
            print(f"  skip  {sd['name']}")
            continue
        class_id = class_name_to_id.get(sd["class_name"], "")
        student_id = f"STU-{student_counter}"
        student_counter += 1
        await Student(
            student_id=student_id,
            name=sd["name"],
            date_of_birth=sd["date_of_birth"],
            gender=sd["gender"],
            class_id=class_id,
            class_name=sd["class_name"],
            section=sd["section"],
            parent_name=sd["parent_name"],
            parent_contact=sd["parent_contact"],
            address=sd["address"],
            blood_group=sd.get("blood_group"),
            nationality="Indian",
            admission_date=str(_date.today()),
            attendance_percentage=0.0,
            status="active",
        ).insert()
        print(f"  [OK]  {student_id}  {sd['name']}  → {sd['class_name']}")

    print("\n[OK] Seed complete\n")
    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
