// ─────────────────────────────────────────────
// Core domain types for School ERP
// ─────────────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  schoolId?: string;
  createdAt: string;
}

export type StudentStatus = 'active' | 'inactive' | 'transferred' | 'graduated';

export interface Student {
  id: string;
  studentId: string;
  name: string;
  photo?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  classId: string;
  className: string;
  section: string;
  parentName: string;
  parentContact: string;
  email?: string;
  address: string;
  admissionDate: string;
  attendancePercentage: number;
  status: StudentStatus;
  bloodGroup?: string;
  nationality?: string;
}

export type TeacherStatus = 'active' | 'inactive' | 'on_leave';

export interface Teacher {
  id: string;
  teacherId: string;
  name: string;
  photo?: string;
  department: string;
  subjects: string[];
  classes: string[];
  email: string;
  phone: string;
  qualification: string;
  experience: number;
  joiningDate: string;
  workload: number; // percentage
  status: TeacherStatus;
  availability: Record<string, string[]>; // day -> ['08:00','09:00']
}

export interface Class {
  id: string;
  name: string;
  grade: number;
  section: string;
  classTeacherId: string;
  classTeacherName: string;
  roomId: string;
  studentCount: number;
  subjects: string[];
  academicYear: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  teacherName: string;
  classes: string[];
  weeklyPeriods: number;
  priority: 'core' | 'elective' | 'activity';
  department: string;
}

export interface Room {
  id: string;
  name: string;
  type: 'classroom' | 'lab' | 'hall' | 'office';
  capacity: number;
  floor: number;
  building: string;
  facilities: string[];
  utilizationPercent: number;
}

// ─────────────────────────────────────────────
// Timetable
// ─────────────────────────────────────────────
export type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface Period {
  id: string;
  day: Day;
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  roomId: string;
  roomName: string;
  locked?: boolean;
}

export interface TimetableConflict {
  id: string;
  type: 'teacher_double_booked' | 'room_double_booked' | 'class_double_booked' | 'overload';
  severity: 'critical' | 'warning';
  description: string;
  affectedPeriods: string[];
  day: Day;
  time: string;
  resolved?: boolean;
}

export interface TimetableOptimizationResult {
  conflictsFound: number;
  conflictsResolved: number;
  teacherUtilization: number;
  roomUtilization: number;
  scheduleEfficiency: number;
  changes: string[];
}

// ─────────────────────────────────────────────
// Attendance
// ─────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
export type AttendanceMode = 'manual' | 'rfid' | 'computer_vision';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  markedBy: string;
  mode: AttendanceMode;
  time?: string;
  notes?: string;
}

export interface DailyAttendanceSummary {
  date: string;
  classId: string;
  className: string;
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

// ─────────────────────────────────────────────
// Document AI
// ─────────────────────────────────────────────
export type DocumentType =
  | 'admission_form'
  | 'transfer_certificate'
  | 'registration_form'
  | 'teacher_form'
  | 'attendance_sheet'
  | 'fee_receipt'
  | 'certificate'
  | 'other';

export type DocumentStatus = 'uploaded' | 'processing' | 'extracted' | 'pending_approval' | 'approved' | 'rejected';

export interface ExtractedField {
  key: string;
  label: string;
  value: string;
  confidence: number; // 0–100
  isEdited?: boolean;
  isLowConfidence?: boolean;
}

export interface DocumentRecord {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  documentType: DocumentType;
  status: DocumentStatus;
  uploadedAt: string;
  processedAt?: string;
  approvedAt?: string;
  uploadedBy: string;
  extractedFields: ExtractedField[];
  thumbnailUrl?: string;
  rejectionReason?: string;
}

// ─────────────────────────────────────────────
// Alerts & Notifications
// ─────────────────────────────────────────────
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType =
  | 'timetable_conflict'
  | 'low_attendance'
  | 'document_pending'
  | 'teacher_overload'
  | 'resource_underutilized'
  | 'system'
  | 'ai_recommendation';

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  description: string;
  actionLabel?: string;
  actionRoute?: string;
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: AlertType;
  severity: AlertSeverity;
  read: boolean;
  createdAt: string;
  actionLabel?: string;
  actionRoute?: string;
}

// ─────────────────────────────────────────────
// Resources
// ─────────────────────────────────────────────
export interface ResourcePrediction {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  currentUtilization: number;
  predictedUtilization: number;
  predictionMonth: string;
  recommendation: string;
  expectedImprovement: number;
  priority: 'high' | 'medium' | 'low';
}

// ─────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────
export interface AttendanceDataPoint {
  date: string;
  percentage: number;
  present: number;
  absent: number;
}

export interface TeacherWorkloadDataPoint {
  teacherName: string;
  workload: number;
  classes: number;
  periods: number;
}

// ─────────────────────────────────────────────
// Audit Log
// ─────────────────────────────────────────────
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress?: string;
}

// ─────────────────────────────────────────────
// AI Assistant
// ─────────────────────────────────────────────
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  structured?: {
    items?: Array<{ label: string; value: string; extra?: string }>;
    recommendation?: string;
  };
}

// ─────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceToday: number;
  pendingDocuments: number;
  activeAlerts: number;
  teachersPresent: number;
  studentsPresent: number;
}
