"""
EduCore ERP — FastAPI Backend
Initialises MongoDB/Beanie on startup via the lifespan handler.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from beanie import init_beanie

from app.core.config import settings
from app.db.database import client, database
from app.models.models import ALL_DOCUMENTS
from app.api.v1 import router as api_v1_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ────────────────────────────────────────────────────────────────
    await init_beanie(database=database, document_models=ALL_DOCUMENTS)
    print(f"[OK] Connected to MongoDB - database: {settings.MONGODB_DB_NAME}")
    yield
    # ── Shutdown ───────────────────────────────────────────────────────────────
    client.close()
    print("[OK] MongoDB connection closed")


app = FastAPI(
    title="EduCore ERP API",
    description="Intelligent School Administration Platform — REST API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(api_v1_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "EduCore ERP API", "version": "1.0.0"}
