"""
Document AI endpoints — upload, OCR extraction, approve/reject workflow.
All AI calls stay server-side; no keys are exposed to the frontend.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
from app.models.models import DocumentRecord
from app.schemas.schemas import DocumentOut, DocumentApproveRequest, DocumentRejectRequest
from app.services.document_ai import extract_document_mock
from app.core.config import settings
import os
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[DocumentOut])
async def list_documents(status: Optional[str] = None):
    query = DocumentRecord.find()
    if status:
        query = query.find(DocumentRecord.status == status)
    docs = await query.sort(-DocumentRecord.uploaded_at).to_list()
    return [_doc_out(d) for d in docs]


@router.post("/upload", response_model=DocumentOut, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form("other"),
):
    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(400, f"File exceeds {settings.MAX_UPLOAD_SIZE_MB} MB limit")

    allowed = {"application/pdf", "image/jpeg", "image/png", "image/jpg"}
    if file.content_type not in allowed:
        raise HTTPException(400, "Unsupported format. Upload PDF, JPEG, or PNG.")

    # Persist file to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "doc.pdf")[1]
    doc = DocumentRecord(
        file_name=file.filename or f"document{ext}",
        file_type=file.content_type or "application/octet-stream",
        file_size=len(content),
        document_type=document_type,
        status="processing",
        uploaded_by="Admin",
    )
    await doc.insert()

    file_path = os.path.join(settings.UPLOAD_DIR, f"{str(doc.id)}{ext}")
    with open(file_path, "wb") as f:
        f.write(content)

    # Run mock OCR extraction
    fields = extract_document_mock(file.filename or "", document_type)
    await doc.set({
        "file_path": file_path,
        "extracted_fields": fields,
        "status": "pending_approval",
        "processed_at": datetime.utcnow(),
    })
    return _doc_out(doc)


@router.post("/{doc_id}/approve", response_model=DocumentOut)
async def approve_document(doc_id: str, payload: Optional[DocumentApproveRequest] = None):
    doc = await DocumentRecord.get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.status not in ("pending_approval", "extracted"):
        raise HTTPException(400, f"Cannot approve document in status: {doc.status}")

    update: dict = {"status": "approved", "approved_at": datetime.utcnow()}
    if payload and payload.edited_fields:
        update["extracted_fields"] = payload.edited_fields
    await doc.set(update)
    return _doc_out(doc)


@router.post("/{doc_id}/reject", response_model=DocumentOut)
async def reject_document(doc_id: str, payload: DocumentRejectRequest):
    doc = await DocumentRecord.get(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    await doc.set({"status": "rejected", "rejection_reason": payload.reason})
    return _doc_out(doc)


def _doc_out(d: DocumentRecord) -> dict:
    return {
        "id": str(d.id),
        "file_name": d.file_name,
        "file_type": d.file_type,
        "file_size": d.file_size,
        "document_type": d.document_type,
        "status": d.status,
        "uploaded_at": d.uploaded_at,
        "processed_at": d.processed_at,
        "approved_at": d.approved_at,
        "uploaded_by": d.uploaded_by,
        "extracted_fields": d.extracted_fields,
        "rejection_reason": d.rejection_reason,
    }
