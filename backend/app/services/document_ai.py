"""
Document AI Service.

MOCK IMPLEMENTATION — returns realistic extracted fields based on filename/type.

To connect real OCR:
  - Install pytesseract + Tesseract binary (or use Azure/AWS/Google Vision)
  - Replace extract_document_mock() with a real implementation
  - Keep this file as the single integration point; the API router does not change.
"""
from typing import List, Dict, Any


def _field(key: str, label: str, value: str, confidence: float) -> Dict[str, Any]:
    return {
        "key": key,
        "label": label,
        "value": value,
        "confidence": confidence,
        "isEdited": False,
        "isLowConfidence": confidence < 80,
    }


def extract_document_mock(filename: str, document_type: str) -> List[Dict[str, Any]]:
    """
    Mock OCR extraction. Returns simulated fields with confidence scores.
    Confidence < 80 is flagged as low-confidence so the UI highlights it.
    """
    fn = filename.lower()

    if document_type == "teacher_form" or "teacher" in fn:
        return [
            _field("teacherName", "Teacher Name", "New Teacher", 94),
            _field("department", "Department", "Mathematics", 89),
            _field("qualification", "Qualification", "M.Sc. Mathematics, B.Ed", 86),
            _field("experience", "Experience (Years)", "5", 79),
            _field("phone", "Phone Number", "9876500099", 98),
            _field("email", "Email Address", "new.teacher@school.edu", 97),
            _field("dob", "Date of Birth", "01/01/1990", 72),
        ]

    if document_type == "transfer_certificate" or "transfer" in fn:
        return [
            _field("studentName", "Student Name", "New Student", 96),
            _field("previousSchool", "Previous School", "Previous High School", 88),
            _field("dateOfLeaving", "Date of Leaving", "31/05/2025", 93),
            _field("grade", "Grade Completed", "Grade 9", 91),
            _field("conduct", "Conduct", "Good", 84),
        ]

    if document_type == "attendance_sheet" or "attendance" in fn:
        # Simulate a poor-quality scan
        return []

    # Default: admission form
    return [
        _field("studentName", "Student Name", "New Student", 97),
        _field("dateOfBirth", "Date of Birth", "01/01/2011", 93),
        _field("gender", "Gender", "Male", 95),
        _field("parentName", "Parent / Guardian Name", "Parent Name", 86),
        _field("phone", "Phone Number", "9876500000", 99),
        _field("address", "Address", "Coimbatore, Tamil Nadu", 78),
        _field("class", "Admission Class", "Grade 9", 91),
        _field("bloodGroup", "Blood Group", "O+", 74),
    ]
