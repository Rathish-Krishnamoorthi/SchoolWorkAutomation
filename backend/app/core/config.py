from pydantic_settings import BaseSettings
from typing import List, Any
from pydantic import field_validator


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URI: str 
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
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://schoolworkautomation-1.onrender.com",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            if v.startswith("["):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    raise ValueError(
                        f"Could not parse JSON list for CORS_ORIGINS: {v}"
                    )

            return [i.strip() for i in v.split(",") if i.strip()]

        if isinstance(v, list):
            return v

        return v

    model_config = {
        "env_file": ".env",
        "case_sensitive": True,
    }


settings = Settings()