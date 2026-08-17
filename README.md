# EduCore ERP — Intelligent School Administration Platform

A production-quality, AI-powered School Administration ERP with a command-center dashboard, document AI, timetable optimization, attendance automation, and predictive resource allocation.

---

## Project Structure

```
SchoolWork_Automation/
├── frontend/          React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── components/    UI, layout, and page components
│   │   ├── data/          Demo seed data
│   │   ├── services/      Mock API service layer
│   │   ├── store/         Zustand global state
│   │   └── types/         TypeScript domain types
│   └── package.json
│
└── backend/           FastAPI + Python + SQLAlchemy
    ├── app/
    │   ├── api/v1/        REST endpoints
    │   ├── core/          Config, security, JWT
    │   ├── db/            Database session, seeder
    │   ├── models/        SQLAlchemy ORM models
    │   ├── schemas/       Pydantic request/response schemas
    │   └── services/      AI assistant, document OCR service
    ├── requirements.txt
    └── .env.example
```

---

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

**Demo credentials:**
- Email: `admin@school.edu` / Password: `admin123`
- Email: `demo@school.edu` / Password: `demo123`

---

## Running the Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
python -m app.db.seed
uvicorn app.main:app --reload --port 8000
```

API docs: https://schoolworkautomation.onrender.com/api/docs

> The frontend currently uses a Zustand mock service layer and does **not** require the backend to be running. The backend is ready to connect once you switch the service layer from mock to real API calls.

---

## Tech Stack

| Layer     | Technology                                        |
|-----------|---------------------------------------------------|
| Frontend  | React 19, TypeScript, Vite 8, Tailwind CSS 3      |
| State     | Zustand (persisted), TanStack React Query         |
| Charts    | Recharts                                          |
| Backend   | FastAPI, Python, Pydantic v2                      |
| ORM       | SQLAlchemy 2                                      |
| Database  | SQLite (dev) / PostgreSQL (production)            |
| Auth      | JWT (python-jose + passlib)                       |
| AI / OCR  | Mock service (pluggable: Tesseract / OpenAI)      |
