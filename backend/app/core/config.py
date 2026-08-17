from pydantic_settings import BaseSettings
from typing import List, Any
from pydantic import field_validator


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URI: str = "mongodb+srv://rathishkrishnamoorthi_db_user:TeuDn3Y3k3tJnn46@cluster0.cu2xgi0.mongodb.net/?appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true"
    MONGODB_DB_NAME: str = "school_erp"

    # Auth
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # AI / OCR
    TESSERACT_CMD: str = "tesseract"
    OPENAI_API_KEY: str = ""

    # File storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # CORS
    CORS_ORIGINS: Any = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://schoolworkautomation-1.onrender.com"
]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> Any:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                return json.loads(v)
            except Exception:
                raise ValueError(f"Could not parse JSON list for CORS_ORIGINS: {v}")
        return v

    model_config = {"env_file": ".env", "case_sensitive": True}


settings = Settings()
