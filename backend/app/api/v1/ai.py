"""
AI endpoints — AI Assistant query and document extraction.
All AI calls happen server-side; no API keys are ever sent to the frontend.
"""
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import AIQueryRequest, AIQueryResponse
from app.services.ai_assistant import answer_query

router = APIRouter()


@router.post("/ask", response_model=AIQueryResponse)
async def ask_assistant(payload: AIQueryRequest):
    """Natural-language query interface for the school AI assistant."""
    if len(payload.query.strip()) < 2:
        raise HTTPException(400, "Query too short")
    response = await answer_query(payload.query)
    return response
