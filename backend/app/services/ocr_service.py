import io
import os
from typing import Dict, Any
from datetime import datetime

try:
    import pytesseract
except Exception:  # pragma: no cover
    pytesseract = None

try:
    from PIL import Image
except Exception:  # pragma: no cover
    Image = None

try:
    import fitz
except Exception:  # pragma: no cover
    fitz = None

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover
    PdfReader = None


def _detect_document_mime(file_name: str, file_path: str, mime_type: str) -> str:
    normalized_name = (file_name or "").lower()
    actual = (mime_type or "").lower()

    try:
        with open(file_path, "rb") as handle:
            header = handle.read(32)
    except OSError:
        header = b""

    if header.startswith(b"%PDF"):
        return "application/pdf"
    if header.startswith((b"\x89PNG\r\n\x1a\n", b"\xff\xd8\xff", b"GIF87a", b"GIF89a", b"\x49\x49\x2a\x00", b"MM\x00\x2a")):
        if header.startswith(b"\x89PNG"):
            return "image/png"
        return "image/jpeg"

    if actual.startswith("image/"):
        return actual

    if actual in {"application/pdf", "application/x-pdf", "application/octet-stream"}:
        if "pdf" in normalized_name or actual == "application/pdf":
            return "application/pdf"

    if any(normalized_name.endswith(ext) for ext in [".pdf", ".png", ".jpg", ".jpeg", ".bmp", ".gif", ".tif", ".tiff", ".webp"]):
        if normalized_name.endswith(".pdf"):
            return "application/pdf"
        return "image/" + normalized_name.rsplit(".", 1)[-1]

    return actual or "application/octet-stream"


def _ocr_pdf_pages(file_path: str) -> str:
    if Image is None or pytesseract is None or fitz is None:
        raise RuntimeError("OCR dependencies are not available")

    pages: list[str] = []
    document = fitz.open(file_path)
    try:
        for page in document:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))
            try:
                text = pytesseract.image_to_string(image)
            finally:
                image.close()
            if text and text.strip():
                pages.append(text.strip())
    finally:
        document.close()

    combined = "\n---PAGE---\n".join(pages)
    if combined.strip():
        return combined
    raise ValueError("Unable to read PDF text. Please upload a valid PDF or image file.")


def extract_text_from_file(file_path: str, mime_type: str = "application/pdf") -> str:
    """Return text from uploaded image or PDF using OCR / PDF parsing."""
    if not os.path.exists(file_path):
        return ""

    detected_type = _detect_document_mime(os.path.basename(file_path), file_path, mime_type)
    if detected_type.startswith("image/"):
        if Image is None or pytesseract is None:
            raise RuntimeError("OCR dependencies are not available")
        image = Image.open(file_path)
        try:
            text = pytesseract.image_to_string(image)
            return text or ""
        finally:
            image.close()

    if detected_type == "application/pdf":
        if fitz is not None:
            try:
                doc = fitz.open(file_path)
                pages = []
                try:
                    for page in doc:
                        text = page.get_text("text") or ""
                        if text.strip():
                            pages.append(text)
                finally:
                    doc.close()
                combined = "\n---PAGE---\n".join(pages)
                if combined.strip():
                    return combined
            except Exception:
                pass

        if PdfReader is not None:
            try:
                reader = PdfReader(file_path)
                pages = []
                for page in reader.pages:
                    text = page.extract_text() or ""
                    if text and text.strip():
                        pages.append(text)
                combined = "\n---PAGE---\n".join(pages)
                if combined.strip():
                    return combined
            except Exception:
                pass

        if Image is not None and pytesseract is not None and fitz is not None:
            try:
                return _ocr_pdf_pages(file_path)
            except Exception:
                pass

        raise ValueError("Unable to read PDF text. Please upload a valid PDF or image file.")

    raise ValueError("Unsupported document type. Please upload a PDF or image file.")


def build_model_payload(file_name: str, file_path: str, mime_type: str) -> Dict[str, Any]:
    """Returns a small internal payload for OCR-backed extraction."""
    try:
        text = extract_text_from_file(file_path, mime_type)
    except Exception as exc:
        return {
            "status": "error",
            "message": str(exc),
            "raw_text": "",
            "file_name": file_name,
            "processed_at": datetime.utcnow().isoformat(),
        }

    normalized = " ".join(filter(None, text.split()))
    if not normalized:
        return {
            "status": "error",
            "message": "The document could not be read or contains no readable text.",
            "raw_text": "",
            "file_name": file_name,
            "processed_at": datetime.utcnow().isoformat(),
        }

    return {
        "status": "ok",
        "message": "OCR processing completed",
        "raw_text": normalized,
        "file_name": file_name,
        "processed_at": datetime.utcnow().isoformat(),
    }
