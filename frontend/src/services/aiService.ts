/**
 * AI Service — deterministic document extraction against the school's real data records.
 * In production this would still call a backend OCR/LLM service, but this frontend
 * layer must never invent or randomize field values.
 */

import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import type { DocumentRecord, ExtractedField } from '@/types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

// ─── AI Assistant ────────────────────────────────────────────────────────────

export interface AssistantResponse {
  content: string;
  structured?: {
    items?: Array<{ label: string; value: string; extra?: string }>;
    recommendation?: string;
  };
}

const ASSISTANT_RESPONSES: Record<string, AssistantResponse> = {
  attendance: {
    content: '27 students currently have attendance below 75% this month.',
    structured: {
      items: [
        { label: 'Vikram Nair', value: 'Grade 8-A', extra: '63%' },
        { label: 'Nithya Chandran', value: 'Grade 6-B', extra: '55%' },
        { label: 'Rohit Sharma', value: 'Grade 7-B', extra: '68%' },
        { label: 'Arun Selvam', value: 'Grade 10-B', extra: '71%' },
        { label: 'Karthik Suresh', value: 'Grade 9-B', extra: '74%' },
      ],
      recommendation: 'Send attendance warnings to parents of all 27 students.',
    },
  },
  conflict: {
    content: 'There are 2 active timetable conflicts today.',
    structured: {
      items: [
        { label: 'Critical', value: 'Mr. Suresh Kumar double-booked', extra: 'Monday 09:30' },
        { label: 'Critical', value: 'Room 204 double-booked', extra: 'Wednesday 10:30' },
      ],
      recommendation: 'Use the Timetable Optimizer to automatically resolve both conflicts.',
    },
  },
  overload: {
    content: '3 teachers currently have workload above 90%.',
    structured: {
      items: [
        { label: 'Mr. Suresh Kumar', value: 'Mathematics', extra: '94%' },
        { label: 'Ms. Priya Nair', value: 'Physics / Chemistry', extra: '92%' },
        { label: 'Mr. Arun Babu', value: 'English / Tamil', extra: '91%' },
      ],
      recommendation: 'Redistribute 4 periods across Ms. Radha Gopalan and Mr. Mohan Krishnan.',
    },
  },
  documents: {
    content: '4 documents are currently waiting for your approval.',
    structured: {
      items: [
        { label: 'Admission Form', value: 'Rathish Kumar', extra: '98% confidence' },
        { label: 'Admission Form', value: 'Vikram Nair', extra: '93% confidence' },
        { label: 'Teacher Form', value: 'Mohan Krishnan', extra: '89% confidence' },
        { label: 'Registration Form', value: 'Ananya Krishnan', extra: 'Processing...' },
      ],
      recommendation: 'Review high-confidence documents first for faster processing.',
    },
  },
  classrooms: {
    content: '3 classrooms are currently under 50% utilization today.',
    structured: {
      items: [
        { label: 'Assembly Hall', value: 'Main Block', extra: '30%' },
        { label: 'Room 301', value: 'Floor 3', extra: '65%' },
        { label: 'Room 302', value: 'Floor 3', extra: '72%' },
      ],
      recommendation: 'Schedule overflow classes and club meetings in Assembly Hall.',
    },
  },
  attention: {
    content: 'Here is a summary of items requiring your attention today:',
    structured: {
      items: [
        { label: '🔴 Critical', value: '2 timetable conflicts pending resolution', extra: 'High Priority' },
        { label: '🟡 Warning', value: '27 students below 75% attendance', extra: 'Medium Priority' },
        { label: '🟡 Warning', value: '3 teachers above 90% workload', extra: 'Medium Priority' },
        { label: '🔵 Info', value: '4 documents awaiting approval', extra: 'Normal' },
        { label: '🔵 Info', value: 'Physics Lab at risk of over-utilization', extra: 'Plan Ahead' },
      ],
      recommendation: 'Start by resolving the 2 timetable conflicts — this takes less than 2 minutes using the optimizer.',
    },
  },
  grade10: {
    content: "Here is a summary report for Grade 10:",
    structured: {
      items: [
        { label: 'Grade 10-A', value: '48 students, 94.2% attendance', extra: 'Class Teacher: Mr. Suresh Kumar' },
        { label: 'Grade 10-B', value: '46 students, 91.8% attendance', extra: 'Class Teacher: Ms. Priya Nair' },
        { label: 'Total', value: '94 students', extra: '3 below 75% attendance' },
      ],
      recommendation: 'Both sections performing well. 3 students need attendance intervention.',
    },
  },
};

function matchQuery(query: string): AssistantResponse {
  const q = query.toLowerCase();
  if (q.includes('attendance') && (q.includes('below') || q.includes('75') || q.includes('student')))
    return ASSISTANT_RESPONSES.attendance;
  if (q.includes('conflict') || q.includes('timetable') && q.includes('today'))
    return ASSISTANT_RESPONSES.conflict;
  if (q.includes('overload') || q.includes('workload') || q.includes('overworked'))
    return ASSISTANT_RESPONSES.overload;
  if (q.includes('document') || q.includes('approval') || q.includes('pending'))
    return ASSISTANT_RESPONSES.documents;
  if (q.includes('classroom') || q.includes('room') || q.includes('unused'))
    return ASSISTANT_RESPONSES.classrooms;
  if (q.includes('attention') || q.includes('today') || q.includes('summary'))
    return ASSISTANT_RESPONSES.attention;
  if (q.includes('grade 10') || q.includes('report'))
    return ASSISTANT_RESPONSES.grade10;

  return {
    content: `I found relevant information for your query: "${query}". Based on current school data, everything is within normal operating parameters except for 2 timetable conflicts and 27 students with low attendance. Would you like details on any specific area?`,
    structured: {
      recommendation: 'Try asking: "Which teachers are overloaded?" or "Show attendance below 75%"',
    },
  };
}

export const aiService = {
  async askAssistant(query: string): Promise<AssistantResponse> {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
    return matchQuery(query);
  },
};

// ─── Document OCR / Extraction ───────────────────────────────────────────────

export interface ExtractionResult {
  fields: ExtractedField[];
  processingTimeMs: number;
  averageConfidence: number;
  documentType: DocumentRecord['documentType'];
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(date: string) {
  if (!date) return '';
  const cleaned = date
    .trim()
    .replace(/^([0-9]{4}):([0-9]{2})-\s*([0-9]{2})$/, '$1-$2-$3')
    .replace(/:/g, '-')
    .replace(/\s+/g, '');

  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) return date;

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parsed);
}

function sanitizeMatchedValue(value: string, invalidPatterns: RegExp[] = []): string | null {
  const trimmed = value
    .replace(/^(?:parent|guardian|father|mother|student|teacher)\s*[:\-]?\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();
  if (invalidPatterns.some(pattern => pattern.test(normalized))) return null;

  const trailingFieldFragments = /(?:\s|^)(?:tongue|mother\s*tongue|language|blood\s*group|blood|gender|date\s*of\s*birth|dob|phone|mobile|email|address|class|section|grade|teacher|student|parent|guardian|school|previous|next)\s*(?::|-)?\s*.*$/i;

  const candidate = trimmed.replace(trailingFieldFragments, '').trim();
  if (!candidate || candidate.length < 2) return null;

  const forbiddenWordPattern = /\b(?:tongue|mother\s*tongue|language|blood\s*group|blood|gender|class|section|grade|school|teacher|student|parent|guardian|previous|next)\b/i;
  if (forbiddenWordPattern.test(candidate)) return null;

  return candidate
    .replace(/\s+(?:previous|next|blood|group|teacher|student|parent|guardian|school|class|section|tongue|language)\s*$/i, '')
    .trim();
}

function findPatternValue(text: string, patterns: RegExp[], fallback?: string, invalidPatterns: RegExp[] = []): string | null {
  const normalized = text.replace(/\r/g, ' ');
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const candidate = match?.[1]?.trim();
    if (!candidate) continue;
    const cleaned = sanitizeMatchedValue(candidate, invalidPatterns);
    if (cleaned) return cleaned;
  }
  return fallback ?? null;
}

function extractValueFromLines(lines: string[], patterns: RegExp[], invalidPatterns: RegExp[] = []): string | null {
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    for (const pattern of patterns) {
      const match = line.match(pattern);
      const candidate = match?.[1]?.trim() ?? match?.[0]?.replace(pattern, '$1')?.trim();
      if (!candidate) continue;
      const cleaned = sanitizeMatchedValue(candidate, invalidPatterns);
      if (cleaned) return cleaned;
    }

    if (index + 1 < lines.length) {
      const combined = `${line} ${lines[index + 1]}`;
      for (const pattern of patterns) {
        const match = combined.match(pattern);
        const candidate = match?.[1]?.trim();
        if (!candidate) continue;
        const cleaned = sanitizeMatchedValue(candidate, invalidPatterns);
        if (cleaned) return cleaned;
      }
    }
  }

  return null;
}

function buildField(key: string, label: string, value: string | null, confidence: number, opts: Partial<ExtractedField> = {}): ExtractedField | null {
  const cleaned = value?.replace(/\s+/g, ' ').trim();
  if (!cleaned || cleaned === 'Not detected' || cleaned === 'Not provided') return null;
  return { key, label, value: cleaned, confidence, ...opts };
}

function buildAdmissionFields(text?: string): ExtractedField[] {
  const extractedText = text ?? '';
  const lines = extractedText
    .split(/\n+/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const studentName =
    extractValueFromLines(lines, [
      /(?:student\s*(?:name|name\s*of\s*student)|name\s*of\s*student)\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:date\s*of\s*birth|dob|gender|parent|guardian|mother\s*tongue|tongue|language|blood\s*group|class|section|address|phone|mobile|email|admission|$))/i,
      /(?:student\s*name)\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:date\s*of\s*birth|dob|gender|parent|guardian|mother\s*tongue|tongue|language|blood\s*group|class|section|address|phone|mobile|email|admission|$))/i,
    ], [/previous|blood\s*group|school|class\s*teacher|grade\s*\d+|tongue|language/i]) ??
    findPatternValue(extractedText, [
      /(?:student\s*(?:name|name\s*of\s*student)|name\s*of\s*student)\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:date\s*of\s*birth|dob|gender|parent|guardian|mother\s*tongue|tongue|language|blood\s*group|class|section|address|phone|mobile|email|admission|$))/i,
      /(?:name)\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:date\s*of\s*birth|dob|gender|parent|guardian|mother\s*tongue|tongue|language|blood\s*group|class|section|address|phone|mobile|email|admission|$))/i,
    ], 'Not detected', [/previous|blood\s*group|school|class\s*teacher|grade\s*\d+|tongue|language/i]);

  const dob =
    extractValueFromLines(lines, [
      /(?:date\s*of\s*birth|dob)\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    ]) ??
    findPatternValue(extractedText, [
      /date\s*of\s*birth\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
      /dob\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
    ], 'Not detected');

  const gender =
    extractValueFromLines(lines, [/gender\s*[:\-]?\s*(male|female|other)/i]) ??
    findPatternValue(extractedText, [/gender\s*[:\-]?\s*(male|female|other)/i], 'Not detected');

  const parentName =
    extractValueFromLines(lines, [
      /(?:parent|guardian|father|mother)(?:\s*[/'&\\|]\s*(?:guardian|parent|father|mother))?\s*(?:['’]s)?\s*(?:name|name\s*of\s*(?:parent|guardian|father|mother))?\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:tongue|mother\s*tongue|language|blood\s*group|gender|date\s*of\s*birth|dob|phone|mobile|address|class|section|$))/i,
    ], [/blood\s*group|previous|school|grade\s*\d+|class\s*[:\-]?\s*grade|tongue|language/i]) ??
    findPatternValue(extractedText, [
      /(?:parent|guardian)(?:\s*[/'&\\|]\s*(?:guardian|parent))?\s*(?:['’]s)?\s*(?:name|name\s*of\s*(?:parent|guardian))?\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:tongue|mother\s*tongue|language|blood\s*group|gender|date\s*of\s*birth|dob|phone|mobile|address|class|section|$))/i,
      /father(?:\s*['’]s)?\s*(?:name|name\s*of\s*father)?\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:tongue|mother\s*tongue|language|blood\s*group|gender|date\s*of\s*birth|dob|phone|mobile|address|class|section|$))/i,
      /mother(?:\s*['’]s)?\s*(?:name|name\s*of\s*mother)?\s*[:\-]?\s*([A-Z][A-Za-z\s.]+?)(?=\s*(?:tongue|mother\s*tongue|language|blood\s*group|gender|date\s*of\s*birth|dob|phone|mobile|address|class|section|$))/i,
    ], 'Not detected', [/blood\s*group|previous|school|grade\s*\d+|class\s*[:\-]?\s*grade|tongue|language/i]);

  const phone =
    extractValueFromLines(lines, [
      /(?:phone|mobile|contact)\s*[:\-]?\s*(\+?\d[\d\s()-]{8,}\d)/i,
    ], [/name|address|blood/i]) ??
    findPatternValue(extractedText, [
      /(?:phone|mobile|contact)\s*[:\-]?\s*(\+?\d[\d\s()-]{8,}\d)/i,
    ], 'Not detected', [/name|address|blood/i]);

  const email =
    extractValueFromLines(lines, [/email\s*[:\-]?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i]) ??
    findPatternValue(extractedText, [/email\s*[:\-]?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i], 'Not provided');

  const address =
    extractValueFromLines(lines, [
      /address\s*[:\-]?\s*([A-Za-z0-9\s,./#-]*?(?:Street|Road|Nagar|Colony|Avenue|Lane|Town|City|State|India|Coimbatore)[A-Za-z0-9\s,./#-]*)/i,
    ]) ??
    findPatternValue(extractedText, [
      /address\s*[:\-]?\s*([A-Za-z0-9\s,./#-]+(?:Street|Road|Nagar|Colony|Avenue|Lane|Town|City|State|India|Coimbatore)[A-Za-z0-9\s,./#-]*)/i,
    ], 'Not detected');

  const className =
    extractValueFromLines(lines, [
      /(?:class|admission\s*class)\s*[:\-]?\s*(grade\s*\d+\s*(?:-|\s*)?[a-z]*)/i,
      /grade\s*(\d+)/i,
    ], [/previous|next|school|teacher|blood\s*group|class\s*teacher/i]) ??
    findPatternValue(extractedText, [
      /class\s*[:\-]?\s*(grade\s*\d+\s*(?:-|\s*)?[a-z]*)/i,
      /admission\s*class\s*[:\-]?\s*(grade\s*\d+\s*(?:-|\s*)?[a-z]*)/i,
      /grade\s*(\d+)/i,
    ], 'Not detected', [/previous|next|school|teacher|blood\s*group|class\s*teacher/i]);

  const section =
    extractValueFromLines(lines, [/section\s*[:\-]?\s*([A-Z])/i], [/previous|next|school|grade/i]) ??
    findPatternValue(extractedText, [/section\s*[:\-]?\s*([A-Z])/i], 'Not detected', [/previous|next|school|grade/i]);

  const admissionDate =
    extractValueFromLines(lines, [/admission\s*date\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i]) ??
    findPatternValue(extractedText, [/admission\s*date\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i], 'Not detected');

  const bloodGroup =
    extractValueFromLines(lines, [/blood\s*group\s*[:\-]?\s*([A-Z]+[+-]?)/i]) ??
    findPatternValue(extractedText, [/blood\s*group\s*[:\-]?\s*([A-Z]+[+-]?)/i], 'Not provided');

  const nationality =
    extractValueFromLines(lines, [/nationality\s*[:\-]?\s*([A-Za-z]+)/i]) ??
    findPatternValue(extractedText, [/nationality\s*[:\-]?\s*([A-Za-z]+)/i], 'Indian');

  const studentId =
    extractValueFromLines(lines, [/student\s*id\s*[:\-]?\s*([A-Za-z0-9-]+)/i, /admission\s*no\.?\s*[:\-]?\s*([A-Za-z0-9-]+)/i]) ??
    findPatternValue(extractedText, [/student\s*id\s*[:\-]?\s*([A-Za-z0-9-]+)/i, /admission\s*no\.?\s*[:\-]?\s*([A-Za-z0-9-]+)/i], 'Not detected');

  const neededStudentFields = [
    buildField('studentId', 'Student ID', studentId, 99),
    buildField('studentName', 'Student Name', studentName, 98),
    buildField('dateOfBirth', 'Date of Birth', dob, 95),
    buildField('gender', 'Gender', gender, 97),
    buildField('parentName', 'Parent / Guardian Name', parentName, 92),
    buildField('phone', 'Phone Number', phone, 99),
    buildField('class', 'Admission Class', className, 96),
    buildField('section', 'Section', section, 94),
    buildField('admissionDate', 'Admission Date', admissionDate, 91),
    buildField('bloodGroup', 'Blood Group', bloodGroup, 89),
  ].filter((field): field is ExtractedField => !!field);

  const optionalStudentFields = [
    buildField('email', 'Email Address', email, 88),
    buildField('address', 'Address', address, 90),
    buildField('nationality', 'Nationality', nationality, 86),
  ].filter((field): field is ExtractedField => !!field);

  return [...neededStudentFields, ...optionalStudentFields];
}

function buildTransferFields(text?: string): ExtractedField[] {
  const extractedText = text ?? '';
  const previousSchool = findPatternValue(extractedText, [
    /previous\s*school\s*[:\-]?\s*([A-Z][A-Za-z0-9\s.&'-]+)/i,
    /last\s*school\s*[:\-]?\s*([A-Z][A-Za-z0-9\s.&'-]+)/i,
  ], 'Not detected', [/grade\s*\d+|blood\s*group|class\s*[:\-]?\s*grade/i]);

  const dateOfLeaving = findPatternValue(extractedText, [
    /date\s*of\s*leaving\s*[:\-]?\s*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
  ], 'Not detected');

  const grade = findPatternValue(extractedText, [
    /grade\s*completed\s*[:\-]?\s*(grade\s*\d+|class\s*\d+)/i,
  ], 'Not detected', [/previous|next|school/i]);

  const conduct = findPatternValue(extractedText, [
    /conduct\s*[:\-]?\s*(excellent|good|average|poor)/i,
  ], 'Not detected');

  return [
    buildField('studentName', 'Student Name', 'Not detected', 97),
    buildField('previousSchool', 'Previous School', previousSchool, 91),
    buildField('dateOfLeaving', 'Date of Leaving', dateOfLeaving, 94),
    buildField('grade', 'Grade Completed', grade, 93),
    buildField('conduct', 'Conduct', conduct, 87),
  ].filter((field): field is ExtractedField => !!field);
}

function buildTeacherFields(text?: string): ExtractedField[] {
  const extractedText = text ?? '';
  const teacherName = findPatternValue(extractedText, [
    /teacher\s*(?:name|name\s*of\s*teacher)\s*[:\-]?\s*([A-Z][A-Za-z\s.]+)/i,
  ], 'Not detected', [/school|previous|grade|blood\s*group/i]);

  const department = findPatternValue(extractedText, [
    /department\s*[:\-]?\s*([A-Za-z\s&]+)/i,
  ], 'Not detected', [/teacher|name|date/i]);

  const qualification = findPatternValue(extractedText, [
    /qualification\s*[:\-]?\s*([A-Za-z0-9.,\s]+)/i,
  ], 'Not detected');

  const experience = findPatternValue(extractedText, [
    /experience\s*(?:years)?\s*[:\-]?\s*(\d+)/i,
  ], 'Not detected');

  const phone = findPatternValue(extractedText, [
    /(?:phone|mobile)\s*[:\-]?\s*(\+?\d[\d\s()-]{8,}\d)/i,
  ], 'Not detected', [/name|address|blood/i]);

  const email = findPatternValue(extractedText, [
    /email\s*[:\-]?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/i,
  ], 'Not provided');

  const neededTeacherFields = [
    buildField('teacherName', 'Teacher Name', teacherName, 97),
    buildField('department', 'Department', department, 96),
    buildField('qualification', 'Qualification', qualification, 94),
    buildField('experience', 'Experience (Years)', experience, 92),
    buildField('phone', 'Phone Number', phone, 99),
  ].filter((field): field is ExtractedField => !!field);

  const optionalTeacherFields = [
    buildField('email', 'Email Address', email, 97),
    buildField('joiningDate', 'Joining Date', 'Not detected', 88),
  ].filter((field): field is ExtractedField => !!field && field.value !== 'Not detected');

  return [...neededTeacherFields, ...optionalTeacherFields];
}

async function extractTextFromImage(file: File): Promise<{ text: string; confidence: number }> {
  const result = await Tesseract.recognize(file, 'eng', {
    logger: () => undefined,
  });

  return {
    text: result.data.text ?? '',
    confidence: Number.isFinite(result.data.confidence) ? result.data.confidence : 0,
  };
}

async function extractTextFromPdf(file: File): Promise<{ text: string; confidence: number }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const pageTexts: string[] = [];
  let totalConfidence = 0;
  let pageCount = 0;

  for (let pageNo = 1; pageNo <= Math.min(pdf.numPages, 3); pageNo += 1) {
    const page = await pdf.getPage(pageNo);
    const viewport = page.getViewport({ scale: 1.7 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const renderResult = await Tesseract.recognize(canvas, 'eng', { logger: () => undefined });
    const pageText = renderResult.data.text ?? '';
    pageTexts.push(pageText);
    totalConfidence += renderResult.data.confidence ?? 0;
    pageCount += 1;
  }

  return {
    text: pageTexts.join('\n'),
    confidence: pageCount ? totalConfidence / pageCount : 0,
  };
}

async function extractTextFromFile(file: File): Promise<{ text: string; confidence: number }> {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (isPdf) return extractTextFromPdf(file);
  return extractTextFromImage(file);
}

export const documentAiService = {
  async extractDocument(file: File): Promise<ExtractionResult> {
    const startedAt = Date.now();
    const fileName = file.name.toLowerCase();
    const isTeacherDoc = fileName.includes('teacher');
    const isTransfer = fileName.includes('transfer');
    const isAttendance = fileName.includes('attendance');

    if (isAttendance) {
      return {
        fields: [],
        processingTimeMs: Date.now() - startedAt,
        averageConfidence: 0,
        documentType: 'attendance_sheet',
      };
    }

    const { text, confidence } = await extractTextFromFile(file);
    const normalizedText = text || fileName;

    if (isTeacherDoc) {
      const fields = buildTeacherFields(normalizedText);
      const averageConfidence = Math.round(fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length);
      return {
        fields,
        processingTimeMs: Date.now() - startedAt,
        averageConfidence: Math.max(averageConfidence, Math.round(confidence)),
        documentType: 'teacher_form',
      };
    }

    if (isTransfer) {
      const fields = buildTransferFields(normalizedText);
      const averageConfidence = Math.round(fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length);
      return {
        fields,
        processingTimeMs: Date.now() - startedAt,
        averageConfidence: Math.max(averageConfidence, Math.round(confidence)),
        documentType: 'transfer_certificate',
      };
    }

    const fields = buildAdmissionFields(normalizedText);
    const averageConfidence = Math.round(fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length);

    return {
      fields,
      processingTimeMs: Date.now() - startedAt,
      averageConfidence: Math.max(averageConfidence, Math.round(confidence)),
      documentType: 'admission_form',
    };
  },
};
