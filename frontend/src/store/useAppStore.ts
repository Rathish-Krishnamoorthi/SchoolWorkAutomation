import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Student, Teacher, Class, Subject, Room, Period, TimetableConflict,
  AttendanceRecord, DocumentRecord, Alert, Notification,
  ResourcePrediction, AuditLog, User, ExtractedField
} from '@/types';
import {
  DEMO_ROOMS, DEMO_ATTENDANCE, DEMO_DOCUMENTS,
  DEMO_ALERTS, DEMO_NOTIFICATIONS, DEMO_RESOURCE_PREDICTIONS, DEMO_AUDIT_LOGS,
  DEMO_CLASSES, DEMO_TEACHERS, DEMO_SUBJECTS, DEMO_PERIODS, DEMO_CONFLICTS,
  DEMO_STUDENTS
} from '@/data/demoData';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'https://schoolworkautomation.onrender.com/api/v1';

const mapStudentFromApi = (student: any): Student => ({
  id: student.id ?? student._id ?? student.student_id ?? '',
  studentId: student.student_id ?? student.studentId ?? '',
  name: student.name ?? '',
  photo: student.photo ?? student.photo_url ?? '',
  dateOfBirth: student.date_of_birth ?? student.dateOfBirth ?? '',
  gender: (student.gender ?? 'male') as Student['gender'],
  classId: student.class_id ?? student.classId ?? '',
  className: student.class_name ?? student.className ?? '',
  section: student.section ?? '',
  parentName: student.parent_name ?? student.parentName ?? '',
  parentContact: student.parent_contact ?? student.parentContact ?? '',
  email: student.email ?? '',
  address: student.address ?? '',
  admissionDate: student.admission_date ?? student.admissionDate ?? '',
  attendancePercentage: Number(student.attendance_percentage ?? student.attendancePercentage ?? 0),
  status: (student.status ?? 'active') as Student['status'],
  bloodGroup: student.blood_group ?? student.bloodGroup ?? '',
  nationality: student.nationality ?? 'Indian',
});

const mapTeacherFromApi = (teacher: any): Teacher => ({
  id: teacher.id ?? teacher._id ?? teacher.teacher_id ?? '',
  teacherId: teacher.teacher_id ?? teacher.teacherId ?? '',
  name: teacher.name ?? '',
  photo: teacher.photo ?? teacher.photo_url ?? '',
  department: teacher.department ?? '',
  subjects: Array.isArray(teacher.subjects) ? teacher.subjects : [],
  classes: Array.isArray(teacher.classes) ? teacher.classes : [],
  email: teacher.email ?? '',
  phone: teacher.phone ?? '',
  qualification: teacher.qualification ?? '',
  experience: Number(teacher.experience ?? 0),
  joiningDate: teacher.joining_date ?? teacher.joiningDate ?? '',
  workload: Number(teacher.workload ?? 0),
  status: (teacher.status ?? 'active') as Teacher['status'],
  availability: teacher.availability ?? {},
});

const mapClassFromApi = (cls: any): Class => ({
  id: cls.id ?? '',
  name: cls.name ?? '',
  grade: Number(cls.grade ?? 0),
  section: cls.section ?? '',
  classTeacherId: cls.class_teacher_id ?? cls.classTeacherId ?? '',
  classTeacherName: cls.class_teacher_name ?? cls.classTeacherName ?? '',
  roomId: cls.room_id ?? cls.roomId ?? '',
  studentCount: Number(cls.student_count ?? cls.studentCount ?? 0),
  subjects: Array.isArray(cls.subjects) ? cls.subjects : [],
  academicYear: cls.academic_year ?? cls.academicYear ?? '2025-26',
});

const getFieldValue = (fields: ExtractedField[] | undefined, key: string): string => {
  const match = fields?.find(field => field.key === key || field.label.toLowerCase() === key.toLowerCase());
  return match?.value ?? '';
};

const normalizeGender = (value: string): Student['gender'] => {
  const normalized = value.toLowerCase();
  if (normalized.includes('female')) return 'female';
  if (normalized.includes('other')) return 'other';
  return 'male';
};

const normalizeDate = (value: string): string => {
  if (!value) return '';
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!match) return trimmed;
  const [, day, month, yearPart] = match;
  const fullYear = yearPart.length === 2 ? `20${yearPart}` : yearPart;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

const buildStudentFromFields = (fields: ExtractedField[], existingStudents: Student[], classes: Class[]): Student | null => {
  const name = getFieldValue(fields, 'studentName') || getFieldValue(fields, 'name');
  if (!name) return null;

  const existing = existingStudents.find(student =>
    student.name.toLowerCase() === name.toLowerCase() ||
    student.studentId === getFieldValue(fields, 'studentId') ||
    (getFieldValue(fields, 'studentId') && student.studentId.toLowerCase() === getFieldValue(fields, 'studentId').toLowerCase())
  );
  const className = getFieldValue(fields, 'class') || getFieldValue(fields, 'className') || existing?.className || '';
  const section = getFieldValue(fields, 'section') || existing?.section || '';
  const normalizedClassName = className.toLowerCase().replace(/\s+/g, ' ').trim();
  const normalizedSection = section.toLowerCase().replace(/\s+/g, ' ').trim();
  const classMatch = classes.find(cls => {
    const clsName = cls.name.toLowerCase();
    const hasClass = clsName.includes(normalizedClassName) || normalizedClassName.includes(clsName);
    if (!hasClass) return false;
    if (!normalizedSection || normalizedSection === 'not' || normalizedSection === 'detected') return true;
    return clsName.includes(normalizedSection) || clsName.includes(`-${normalizedSection}`) || clsName.includes(` ${normalizedSection}`);
  }) ?? classes.find(cls => cls.name.toLowerCase().includes(normalizedClassName) || normalizedClassName.includes(cls.name.toLowerCase()));

  return {
    id: existing?.id ?? `s${Date.now()}`,
    studentId: getFieldValue(fields, 'studentId') || existing?.studentId || `STU-${1000 + existingStudents.length}`,
    name,
    photo: existing?.photo ?? '',
    dateOfBirth: normalizeDate(getFieldValue(fields, 'dateOfBirth')) || existing?.dateOfBirth || '',
    gender: normalizeGender(getFieldValue(fields, 'gender') || existing?.gender || 'male'),
    classId: classMatch?.id || existing?.classId || '',
    className,
    section,
    parentName: getFieldValue(fields, 'parentName') || existing?.parentName || '',
    parentContact: getFieldValue(fields, 'phone') || getFieldValue(fields, 'parentContact') || existing?.parentContact || '',
    email: getFieldValue(fields, 'email') || existing?.email || '',
    address: getFieldValue(fields, 'address') || existing?.address || '',
    admissionDate: normalizeDate(getFieldValue(fields, 'admissionDate')) || existing?.admissionDate || '',
    attendancePercentage: existing?.attendancePercentage ?? 0,
    status: existing?.status ?? 'active',
    bloodGroup: getFieldValue(fields, 'bloodGroup') || existing?.bloodGroup || '',
    nationality: getFieldValue(fields, 'nationality') || existing?.nationality || '',
  };
};

const buildTeacherFromFields = (fields: ExtractedField[], existingTeachers: Teacher[]): Teacher | null => {
  const name = getFieldValue(fields, 'teacherName') || getFieldValue(fields, 'name');
  if (!name) return null;

  const existing = existingTeachers.find(teacher => teacher.name.toLowerCase() === name.toLowerCase() || teacher.email === getFieldValue(fields, 'email'));
  const experience = Number.parseInt(getFieldValue(fields, 'experience') || `${existing?.experience ?? 0}`, 10) || existing?.experience || 0;

  return {
    id: existing?.id ?? `t${Date.now()}`,
    teacherId: existing?.teacherId || `TCH-${100 + existingTeachers.length}`,
    name,
    photo: existing?.photo ?? '',
    department: getFieldValue(fields, 'department') || existing?.department || '',
    subjects: existing?.subjects ?? [],
    classes: existing?.classes ?? [],
    email: getFieldValue(fields, 'email') || existing?.email || '',
    phone: getFieldValue(fields, 'phone') || existing?.phone || '',
    qualification: getFieldValue(fields, 'qualification') || existing?.qualification || '',
    experience,
    joiningDate: normalizeDate(getFieldValue(fields, 'joiningDate')) || existing?.joiningDate || '',
    workload: existing?.workload ?? 0,
    status: existing?.status ?? 'active',
    availability: existing?.availability ?? {},
  };
};

const mapSubjectFromApi = (sub: any): Subject => ({
  id: sub.id ?? '',
  name: sub.name ?? '',
  code: sub.code ?? '',
  teacherId: sub.teacher_id ?? sub.teacherId ?? '',
  teacherName: sub.teacher_name ?? sub.teacherName ?? '',
  classes: Array.isArray(sub.classes) ? sub.classes : [],
  weeklyPeriods: Number(sub.weekly_periods ?? sub.weeklyPeriods ?? 4),
  priority: (sub.priority ?? 'core') as Subject['priority'],
  department: sub.department ?? '',
});

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: string) => Promise<boolean>;
  logout: () => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Core data
  students: Student[];
  teachers: Teacher[];
  classes: Class[];
  subjects: Subject[];
  rooms: Room[];
  periods: Period[];
  conflicts: TimetableConflict[];
  attendance: AttendanceRecord[];
  documents: DocumentRecord[];
  alerts: Alert[];
  notifications: Notification[];
  resourcePredictions: ResourcePrediction[];
  auditLogs: AuditLog[];

  // CRUD actions
  loadStudents: () => Promise<void>;
  addStudent: (student: Student) => Promise<void> | void;
  updateStudent: (studentId: string, data: Partial<Student>) => Promise<void> | void;
  deleteStudent: (studentId: string) => Promise<void> | void;

  loadTeachers: () => Promise<void>;
  addTeacher: (teacher: Teacher) => Promise<void> | void;
  updateTeacher: (teacherId: string, data: Partial<Teacher>) => Promise<void> | void;
  deleteTeacher: (teacherId: string) => Promise<void> | void;

  loadClasses: () => Promise<void>;
  addClass: (cls: Omit<Class, 'id' | 'studentCount'>) => Promise<void>;
  updateClass: (id: string, data: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;

  loadSubjects: () => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<void>;
  updateSubject: (id: string, data: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;

  // Attendance
  markAttendance: (record: AttendanceRecord) => void;
  bulkMarkAttendance: (records: AttendanceRecord[]) => void;

  // Timetable
  timetableLoading: boolean;
  timetableGenerated: boolean;
  loadPeriods: (academicYear?: string) => Promise<void>;
  generateTimetable: (academicYear?: string) => Promise<{ periodsCreated: number; conflicts: TimetableConflict[]; warnings: string[] }>;
  clearTimetable: (academicYear?: string) => Promise<void>;
  togglePeriodLock: (periodId: string, locked: boolean) => Promise<void>;
  resolveConflict: (id: string) => void;
  updatePeriod: (id: string, data: Partial<Period>) => void;
  optimizeTimetable: () => { conflictsResolved: number; changes: string[] };

  // Documents
  addDocument: (doc: DocumentRecord) => void;
  updateDocument: (id: string, data: Partial<DocumentRecord>) => void;
  approveDocument: (id: string, fields?: ExtractedField[]) => Promise<void>;
  rejectDocument: (id: string, reason: string) => void;

  // Alerts
  resolveAlert: (id: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadCount: () => number;

  // Audit
  addAuditLog: (log: AuditLog) => void;
}

// Demo admin user
const ADMIN_USER: User = {
  id: 'admin1',
  name: 'Admin',
  email: 'admin@school.edu',
  role: 'admin',
  schoolId: 'sch1',
  createdAt: '2024-01-01',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        try {
          const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });
          if (res.ok) {
            const data = await res.json();
            set({
              user: {
                id: data.user_id,
                name: data.name,
                email: email,
                role: data.role as any,
                schoolId: 'sch1',
                createdAt: new Date().toISOString().split('T')[0],
              },
              isAuthenticated: true,
            });
            localStorage.setItem('auth_token', data.access_token);
            return true;
          }
          return false;
        } catch (err) {
          console.warn('Backend connection failed, falling back to mock login:', err);
          await new Promise(r => setTimeout(r, 900));
          if (
            (email === 'admin@school.edu' && password === 'admin123') ||
            (email === 'demo@school.edu' && password === 'demo123')
          ) {
            const mockUser = { ...ADMIN_USER, email, role: 'admin' as const };
            set({ user: mockUser, isAuthenticated: true });
            localStorage.setItem('auth_token', 'mock-demo-token-for-school-erp');
            return true;
          }
          return false;
        }
      },
      register: async (name, email, password, role) => {
        try {
          const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role }),
          });
          if (res.ok) {
            const data = await res.json();
            set({
              user: {
                id: data.user_id,
                name: data.name,
                email: email,
                role: data.role as any,
                schoolId: 'sch1',
                createdAt: new Date().toISOString().split('T')[0],
              },
              isAuthenticated: true,
            });
            localStorage.setItem('auth_token', data.access_token);
            return true;
          }
          return false;
        } catch (err) {
          console.error('Backend registration failed, falling back to mock registration:', err);
          await new Promise(r => setTimeout(r, 900));
          const mockUser = {
            id: 'mock-user-' + Date.now(),
            name: name,
            email: email,
            role: role as any,
            schoolId: 'sch1',
            createdAt: new Date().toISOString().split('T')[0],
          };
          set({ user: mockUser, isAuthenticated: true });
          localStorage.setItem('auth_token', 'mock-demo-token-for-school-erp');
          return true;
        }
      },
      logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, isAuthenticated: false });
      },

      // Theme
      theme: 'light',
      toggleTheme: () =>
        set(s => {
          const next = s.theme === 'light' ? 'dark' : 'light';
          if (next === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { theme: next };
        }),

      // Sidebar
      sidebarCollapsed: false,
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // Core data
      students: [],
      teachers: [],
      classes: [],
      subjects: [],
      rooms: DEMO_ROOMS,
      periods: [],
      conflicts: [],
      timetableLoading: false,
      timetableGenerated: false,
      attendance: DEMO_ATTENDANCE,
      documents: DEMO_DOCUMENTS,
      alerts: DEMO_ALERTS,
      notifications: DEMO_NOTIFICATIONS,
      resourcePredictions: DEMO_RESOURCE_PREDICTIONS,
      auditLogs: DEMO_AUDIT_LOGS,

      // Students
      loadStudents: async () => {
        try {
          const res = await fetch(`${API_BASE}/students`);
          if (!res.ok) throw new Error('Failed to load students');
          const data = await res.json();
          const mapped = data.map(mapStudentFromApi);
          set(s => {
            const mergedStudents = [
              ...mapped,
              ...s.students.filter(existing =>
                !mapped.some((item: Student) =>
                  item.id === existing.id ||
                  item.studentId === existing.studentId ||
                  item.name.toLowerCase() === existing.name.toLowerCase()
                )
              ),
            ];

            return {
              students: mergedStudents.map((student: Student) => {
                const studentRecords = s.attendance.filter(a => a.studentId === student.id || a.studentId === student.studentId);
                const total = studentRecords.length || 1;
                const attended = studentRecords.filter(a => ['present', 'late', 'excused'].includes(a.status)).length;
                return {
                  ...student,
                  attendancePercentage: Math.round((attended / total) * 100),
                };
              }),
            };
          });
        } catch (error) {
          console.warn('Unable to load students from backend:', error);
          set(s => ({
            students: [
              ...DEMO_STUDENTS,
              ...s.students.filter(existing =>
                !DEMO_STUDENTS.some(student =>
                  student.id === existing.id ||
                  student.studentId === existing.studentId ||
                  student.name.toLowerCase() === existing.name.toLowerCase()
                )
              ),
            ].map((student: Student) => {
              const studentRecords = s.attendance.filter(a => a.studentId === student.id || a.studentId === student.studentId);
              const total = studentRecords.length || 1;
              const attended = studentRecords.filter(a => ['present', 'late', 'excused'].includes(a.status)).length;
              return {
                ...student,
                attendancePercentage: Math.round((attended / total) * 100),
              };
            }),
          }));
        }
      },
      addStudent: async (student) => {
        const payload = {
          name: student.name,
          date_of_birth: student.dateOfBirth,
          gender: student.gender,
          class_id: student.classId,
          class_name: student.className,
          section: student.section,
          parent_name: student.parentName,
          parent_contact: student.parentContact,
          email: student.email || undefined,
          address: student.address,
          blood_group: student.bloodGroup || undefined,
          nationality: student.nationality || undefined,
        };

        try {
          const res = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to create student');
          const created = mapStudentFromApi(await res.json());
          set(s => ({ students: [created, ...s.students.filter(st => st.studentId !== created.studentId)] }));
        } catch (error) {
          console.warn('Backend student create failed, storing locally:', error);
          set(s => ({ students: [student, ...s.students] }));
        }
      },
      updateStudent: async (studentId, data) => {
        const payload: Record<string, any> = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.dateOfBirth !== undefined) payload.date_of_birth = data.dateOfBirth;
        if (data.gender !== undefined) payload.gender = data.gender;
        if (data.classId !== undefined) payload.class_id = data.classId;
        if (data.className !== undefined) payload.class_name = data.className;
        if (data.section !== undefined) payload.section = data.section;
        if (data.parentName !== undefined) payload.parent_name = data.parentName;
        if (data.parentContact !== undefined) payload.parent_contact = data.parentContact;
        if (data.email !== undefined) payload.email = data.email || undefined;
        if (data.address !== undefined) payload.address = data.address;
        if (data.status !== undefined) payload.status = data.status;
        if (data.bloodGroup !== undefined) payload.blood_group = data.bloodGroup || undefined;

        try {
          const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to update student');
          const updated = mapStudentFromApi(await res.json());
          set(s => ({ students: s.students.map(st => st.studentId === updated.studentId ? updated : st) }));
        } catch (error) {
          console.warn('Backend student update failed, updating locally:', error);
          set(s => ({
            students: s.students.map(st => st.studentId === studentId ? { ...st, ...data } : st),
          }));
        }
      },
      deleteStudent: async (studentId) => {
        try {
          const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}`, { method: 'DELETE' });
          if (!res.ok && res.status !== 204) throw new Error('Failed to delete student');
          set(s => ({ students: s.students.filter(st => st.studentId !== studentId) }));
        } catch (error) {
          console.warn('Backend student delete failed, removing locally:', error);
          set(s => ({ students: s.students.filter(st => st.studentId !== studentId) }));
        }
      },

      // Teachers
      loadTeachers: async () => {
        try {
          const res = await fetch(`${API_BASE}/teachers`);
          if (!res.ok) throw new Error('Failed to load teachers');
          const data = await res.json();
          set(s => {
            const mergedTeachers = [
              ...data.map(mapTeacherFromApi),
              ...s.teachers.filter(existing =>
                !data.some((teacher: any) =>
                  (teacher.id ?? teacher._id ?? teacher.teacher_id ?? teacher.teacherId) === existing.id ||
                  (teacher.teacher_id ?? teacher.teacherId ?? '') === existing.teacherId ||
                  (teacher.name ?? '').toLowerCase() === existing.name.toLowerCase()
                )
              ),
            ];
            return { teachers: mergedTeachers };
          });
        } catch (error) {
          console.warn('Unable to load teachers from backend, using demo data:', error);
          set(s => ({
            teachers: [
              ...DEMO_TEACHERS,
              ...s.teachers.filter(existing =>
                !DEMO_TEACHERS.some(teacher =>
                  teacher.id === existing.id ||
                  teacher.teacherId === existing.teacherId ||
                  teacher.name.toLowerCase() === existing.name.toLowerCase()
                )
              ),
            ],
          }));
        }
      },
      addTeacher: async (teacher) => {
        const payload = {
          name: teacher.name,
          department: teacher.department,
          subjects: teacher.subjects,
          classes: teacher.classes,
          email: teacher.email,
          phone: teacher.phone,
          qualification: teacher.qualification,
          experience: teacher.experience,
        };

        try {
          const res = await fetch(`${API_BASE}/teachers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to create teacher');
          const created = mapTeacherFromApi(await res.json());
          set(s => ({ teachers: [created, ...s.teachers.filter(t => t.teacherId !== created.teacherId)] }));
          // Sync teacher→subject and teacher→class linkage, then refresh both stores
          await fetch(`${API_BASE}/teachers/${created.teacherId}/sync-subjects-classes`, { method: 'POST' });
          const [subjRes, clsRes] = await Promise.all([
            fetch(`${API_BASE}/subjects`),
            fetch(`${API_BASE}/classes`),
          ]);
          if (subjRes.ok) set({ subjects: (await subjRes.json()).map(mapSubjectFromApi) });
          if (clsRes.ok)  set({ classes:  (await clsRes.json()).map(mapClassFromApi) });
        } catch (error) {
          console.warn('Backend teacher create failed, storing locally:', error);
          set(s => ({ teachers: [teacher, ...s.teachers] }));
        }
      },
      updateTeacher: async (teacherId, data) => {
        const payload: Record<string, any> = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.department !== undefined) payload.department = data.department;
        if (data.subjects !== undefined) payload.subjects = data.subjects;
        if (data.classes !== undefined) payload.classes = data.classes;
        if (data.email !== undefined) payload.email = data.email;
        if (data.phone !== undefined) payload.phone = data.phone;
        if (data.qualification !== undefined) payload.qualification = data.qualification;
        if (data.experience !== undefined) payload.experience = data.experience;
        if (data.workload !== undefined) payload.workload = data.workload;
        if (data.status !== undefined) payload.status = data.status;

        try {
          const res = await fetch(`${API_BASE}/teachers/${encodeURIComponent(teacherId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to update teacher');
          const updated = mapTeacherFromApi(await res.json());
          set(s => ({ teachers: s.teachers.map(t => t.teacherId === updated.teacherId ? updated : t) }));
          // Sync subject/class linkage then refresh both stores
          await fetch(`${API_BASE}/teachers/${teacherId}/sync-subjects-classes`, { method: 'POST' });
          const [subjRes, clsRes] = await Promise.all([
            fetch(`${API_BASE}/subjects`),
            fetch(`${API_BASE}/classes`),
          ]);
          if (subjRes.ok) set({ subjects: (await subjRes.json()).map(mapSubjectFromApi) });
          if (clsRes.ok)  set({ classes:  (await clsRes.json()).map(mapClassFromApi) });
        } catch (error) {
          console.warn('Backend teacher update failed, updating locally:', error);
          set(s => ({
            teachers: s.teachers.map(t => t.teacherId === teacherId ? { ...t, ...data } : t),
          }));
        }
      },
      deleteTeacher: async (teacherId) => {
        try {
          const res = await fetch(`${API_BASE}/teachers/${encodeURIComponent(teacherId)}`, { method: 'DELETE' });
          if (!res.ok && res.status !== 204) throw new Error('Failed to delete teacher');
          set(s => ({ teachers: s.teachers.filter(t => t.teacherId !== teacherId) }));
        } catch (error) {
          console.warn('Backend teacher delete failed, removing locally:', error);
          set(s => ({ teachers: s.teachers.filter(t => t.teacherId !== teacherId) }));
        }
      },

      // Classes
      loadClasses: async () => {
        try {
          const res = await fetch(`${API_BASE}/classes`);
          if (!res.ok) throw new Error('Failed to load classes');
          const data = await res.json();
          set({ classes: data.map(mapClassFromApi) });
        } catch (error) {
          console.warn('Unable to load classes from backend, using demo data:', error);
          set({ classes: DEMO_CLASSES });
        }
      },
      addClass: async (cls) => {
        const payload = {
          name: cls.name,
          grade: cls.grade,
          section: cls.section,
          class_teacher_id: cls.classTeacherId || undefined,
          class_teacher_name: cls.classTeacherName || undefined,
          room_id: cls.roomId || undefined,
          subjects: cls.subjects,
          academic_year: cls.academicYear,
        };
        try {
          const res = await fetch(`${API_BASE}/classes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to create class');
          const created = mapClassFromApi(await res.json());
          set(s => ({ classes: [...s.classes, created].sort((a, b) => a.grade - b.grade) }));
        } catch (error) {
          console.warn('Backend class create failed:', error);
        }
      },
      updateClass: async (id, data) => {
        const payload: Record<string, any> = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.grade !== undefined) payload.grade = data.grade;
        if (data.section !== undefined) payload.section = data.section;
        if (data.classTeacherId !== undefined) payload.class_teacher_id = data.classTeacherId;
        if (data.classTeacherName !== undefined) payload.class_teacher_name = data.classTeacherName;
        if (data.roomId !== undefined) payload.room_id = data.roomId;
        if (data.subjects !== undefined) payload.subjects = data.subjects;
        if (data.academicYear !== undefined) payload.academic_year = data.academicYear;
        try {
          const res = await fetch(`${API_BASE}/classes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to update class');
          const updated = mapClassFromApi(await res.json());
          set(s => ({ classes: s.classes.map(c => c.id === id ? updated : c) }));
        } catch (error) {
          console.warn('Backend class update failed:', error);
          set(s => ({ classes: s.classes.map(c => c.id === id ? { ...c, ...data } : c) }));
        }
      },
      deleteClass: async (id) => {
        try {
          await fetch(`${API_BASE}/classes/${id}`, { method: 'DELETE' });
        } catch (_) {}
        set(s => ({ classes: s.classes.filter(c => c.id !== id) }));
      },

      // Subjects
      loadSubjects: async () => {
        try {
          const res = await fetch(`${API_BASE}/subjects`);
          if (!res.ok) throw new Error('Failed to load subjects');
          const data = await res.json();
          set({ subjects: data.map(mapSubjectFromApi) });
        } catch (error) {
          console.warn('Unable to load subjects from backend, using demo data:', error);
          set({ subjects: DEMO_SUBJECTS });
        }
      },
      addSubject: async (subject) => {
        const payload = {
          name: subject.name,
          code: subject.code,
          teacher_id: subject.teacherId || undefined,
          teacher_name: subject.teacherName || undefined,
          classes: subject.classes,
          weekly_periods: subject.weeklyPeriods,
          priority: subject.priority,
          department: subject.department,
        };
        try {
          const res = await fetch(`${API_BASE}/subjects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to create subject');
          const created = mapSubjectFromApi(await res.json());
          set(s => ({ subjects: [...s.subjects, created] }));
        } catch (error) {
          console.warn('Backend subject create failed:', error);
        }
      },
      updateSubject: async (id, data) => {
        const payload: Record<string, any> = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.code !== undefined) payload.code = data.code;
        if (data.teacherId !== undefined) payload.teacher_id = data.teacherId;
        if (data.teacherName !== undefined) payload.teacher_name = data.teacherName;
        if (data.classes !== undefined) payload.classes = data.classes;
        if (data.weeklyPeriods !== undefined) payload.weekly_periods = data.weeklyPeriods;
        if (data.priority !== undefined) payload.priority = data.priority;
        if (data.department !== undefined) payload.department = data.department;
        try {
          const res = await fetch(`${API_BASE}/subjects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Failed to update subject');
          const updated = mapSubjectFromApi(await res.json());
          set(s => ({ subjects: s.subjects.map(sub => sub.id === id ? updated : sub) }));
        } catch (error) {
          console.warn('Backend subject update failed:', error);
          set(s => ({ subjects: s.subjects.map(sub => sub.id === id ? { ...sub, ...data } : sub) }));
        }
      },
      deleteSubject: async (id) => {
        try {
          await fetch(`${API_BASE}/subjects/${id}`, { method: 'DELETE' });
        } catch (_) {}
        set(s => ({ subjects: s.subjects.filter(sub => sub.id !== id) }));
      },

      // Attendance
      markAttendance: (record) =>
        set(s => {
          const nextAttendance = (() => {
            const exists = s.attendance.find(a => a.studentId === record.studentId && a.date === record.date);
            if (exists) {
              return s.attendance.map(a => a.id === exists.id ? { ...a, ...record } : a);
            }
            return [record, ...s.attendance];
          })();

          const nextStudents = s.students.map(student => {
            if (student.id !== record.studentId) return student;
            const studentRecords = nextAttendance.filter(a => a.studentId === student.id);
            const total = studentRecords.length || 1;
            const attended = studentRecords.filter(a => ['present', 'late', 'excused'].includes(a.status)).length;
            return { ...student, attendancePercentage: Math.round((attended / total) * 100) };
          });

          return { attendance: nextAttendance, students: nextStudents };
        }),
      bulkMarkAttendance: (records) =>
        set(s => {
          const newRecs = [...s.attendance];
          records.forEach(rec => {
            const idx = newRecs.findIndex(a => a.studentId === rec.studentId && a.date === rec.date);
            if (idx >= 0) newRecs[idx] = { ...newRecs[idx], ...rec };
            else newRecs.unshift(rec);
          });

          const nextStudents = s.students.map(student => {
            const studentRecords = newRecs.filter(a => a.studentId === student.id);
            const total = studentRecords.length || 1;
            const attended = studentRecords.filter(a => ['present', 'late', 'excused'].includes(a.status)).length;
            return {
              ...student,
              attendancePercentage: Math.round((attended / total) * 100),
            };
          });

          return { attendance: newRecs, students: nextStudents };
        }),

      // Timetable
      loadPeriods: async (academicYear = '2025-26') => {
        set({ timetableLoading: true });
        try {
          const res = await fetch(`${API_BASE}/timetable/periods/all?academic_year=${encodeURIComponent(academicYear)}`);
          if (!res.ok) throw new Error('Failed to load periods');
          const data: any[] = await res.json();
          const periods: Period[] = data.map(p => ({
            id: p.id,
            day: p.day,
            startTime: p.start_time,
            endTime: p.end_time,
            subjectId: p.subject_id,
            subjectName: p.subject_name,
            teacherId: p.teacher_id,
            teacherName: p.teacher_name,
            classId: p.class_id,
            className: p.class_name,
            roomId: '',
            roomName: p.room_name,
            locked: p.locked,
          }));
          // Also fetch live conflicts
          const cRes = await fetch(`${API_BASE}/timetable/conflicts?academic_year=${encodeURIComponent(academicYear)}`);
          const rawConflicts: any[] = cRes.ok ? await cRes.json() : [];
          const conflicts: TimetableConflict[] = rawConflicts.map((c, i) => ({
            id: `cf-${i}`,
            type: c.type,
            severity: c.severity,
            description: c.description,
            affectedPeriods: c.affected_period_ids ?? [],
            day: c.day,
            time: c.time,
            resolved: false,
          }));
          set({ periods, conflicts, timetableGenerated: periods.length > 0 });
        } catch (err) {
          console.warn('loadPeriods failed, using demo timetable:', err);
          set({ periods: DEMO_PERIODS, conflicts: DEMO_CONFLICTS, timetableGenerated: DEMO_PERIODS.length > 0 });
        } finally {
          set({ timetableLoading: false });
        }
      },

      generateTimetable: async (academicYear = '2025-26') => {
        set({ timetableLoading: true });
        try {
          const res = await fetch(
            `${API_BASE}/timetable/generate?academic_year=${encodeURIComponent(academicYear)}`,
            { method: 'POST' }
          );
          if (!res.ok) throw new Error(`Generate failed: ${res.status}`);
          const result = await res.json();

          // Reload periods fresh from backend
          const pRes = await fetch(`${API_BASE}/timetable/periods/all?academic_year=${encodeURIComponent(academicYear)}`);
          const pData: any[] = pRes.ok ? await pRes.json() : [];
          const periods: Period[] = pData.map(p => ({
            id: p.id,
            day: p.day,
            startTime: p.start_time,
            endTime: p.end_time,
            subjectId: p.subject_id,
            subjectName: p.subject_name,
            teacherId: p.teacher_id,
            teacherName: p.teacher_name,
            classId: p.class_id,
            className: p.class_name,
            roomId: '',
            roomName: p.room_name,
            locked: p.locked,
          }));

          const conflicts: TimetableConflict[] = (result.conflicts ?? []).map((c: any, i: number) => ({
            id: `cf-${i}`,
            type: c.type,
            severity: c.severity,
            description: c.description,
            affectedPeriods: c.affected_period_ids ?? [],
            day: c.day,
            time: c.time,
            resolved: false,
          }));

          set({ periods, conflicts, timetableGenerated: true });
          return {
            periodsCreated: result.periods_created,
            conflicts,
            warnings: result.warnings ?? [],
          };
        } catch (error) {
          console.warn('Generate timetable failed, using demo timetable:', error);
          set({ periods: DEMO_PERIODS, conflicts: DEMO_CONFLICTS, timetableGenerated: true });
          return {
            periodsCreated: DEMO_PERIODS.length,
            conflicts: DEMO_CONFLICTS,
            warnings: ['Backend unavailable — showing demo timetable data.'],
          };
        } finally {
          set({ timetableLoading: false });
        }
      },

      clearTimetable: async (academicYear = '2025-26') => {
        await fetch(`${API_BASE}/timetable/clear?academic_year=${encodeURIComponent(academicYear)}`, {
          method: 'DELETE',
        });
        set({ periods: [], conflicts: [], timetableGenerated: false });
      },

      togglePeriodLock: async (periodId, locked) => {
        const res = await fetch(
          `${API_BASE}/timetable/periods/${periodId}/lock?locked=${locked}`,
          { method: 'PATCH' }
        );
        if (res.ok) {
          set(s => ({ periods: s.periods.map(p => p.id === periodId ? { ...p, locked } : p) }));
        }
      },

      resolveConflict: (id) => {
        set(s => ({
          conflicts: s.conflicts.map(c => c.id === id ? { ...c, resolved: true } : c),
        }));
      },
      updatePeriod: (id, data) =>
        set(s => ({ periods: s.periods.map(p => p.id === id ? { ...p, ...data } : p) })),
      optimizeTimetable: () => {
        const { conflicts } = get();
        const unresolved = conflicts.filter(c => !c.resolved);
        set(s => ({
          conflicts: s.conflicts.map(c => ({ ...c, resolved: true })),
        }));
        return { conflictsResolved: unresolved.length, changes: ['All conflicts marked resolved'] };
      },

      // Documents
      addDocument: (doc) =>
        set(s => ({ documents: [doc, ...s.documents] })),
      updateDocument: (id, data) =>
        set(s => ({ documents: s.documents.map(d => d.id === id ? { ...d, ...data } : d) })),
      approveDocument: async (id, fields) => {
        const { documents, addAuditLog, students, teachers, classes, addStudent, updateStudent, addTeacher, updateTeacher } = get();
        const doc = documents.find(d => d.id === id);
        const extractedFields = fields ?? doc?.extractedFields ?? [];

        set(s => ({
          documents: s.documents.map(d =>
            d.id === id ? { ...d, status: 'approved' as const, approvedAt: new Date().toISOString() } : d
          ),
          alerts: s.alerts.map(a =>
            a.type === 'document_pending' ? { ...a, description: a.description } : a
          ),
        }));

        if (!doc) return;

        if (doc.documentType === 'admission_form' || doc.documentType === 'transfer_certificate') {
          const student = buildStudentFromFields(extractedFields, students, classes);
          if (student) {
            const existing = students.find(item => item.name.toLowerCase() === student.name.toLowerCase() || item.studentId === student.studentId);
            try {
              if (existing) {
                await updateStudent(existing.studentId, student);
              } else {
                await addStudent(student);
              }
            } catch (error) {
              console.warn('Failed to persist approved student to backend, storing locally:', error);
              set(s => {
                const nextStudents = existing ? s.students.map(item => item.id === existing.id ? { ...existing, ...student } : item) : [student, ...s.students];
                return { students: nextStudents };
              });
            }
          }
        }

        if (doc.documentType === 'teacher_form') {
          const teacher = buildTeacherFromFields(extractedFields, teachers);
          if (teacher) {
            const existing = teachers.find(item => item.name.toLowerCase() === teacher.name.toLowerCase() || item.email === teacher.email);
            try {
              if (existing) {
                await updateTeacher(existing.teacherId, teacher);
              } else {
                await addTeacher(teacher);
              }
            } catch (error) {
              console.warn('Failed to persist approved teacher to backend, storing locally:', error);
              set(s => {
                const nextTeachers = existing ? s.teachers.map(item => item.id === existing.id ? { ...existing, ...teacher } : item) : [teacher, ...s.teachers];
                return { teachers: nextTeachers };
              });
            }
          }
        }

        addAuditLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: 'admin1',
          userName: 'Admin',
          action: 'APPROVE_DOCUMENT',
          entity: 'Document',
          entityId: id,
          details: `Approved ${doc.documentType.replace('_', ' ')} — ${doc.fileName}`,
        });
      },
      rejectDocument: (id, reason) => {
        set(s => ({
          documents: s.documents.map(d =>
            d.id === id ? { ...d, status: 'rejected' as const, rejectionReason: reason } : d
          ),
        }));
      },

      // Alerts
      resolveAlert: (id) =>
        set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, resolved: true } : a) })),

      // Notifications
      markNotificationRead: (id) =>
        set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
      markAllNotificationsRead: () =>
        set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) })),
      unreadCount: () => get().notifications.filter(n => !n.read).length,

      // Audit
      addAuditLog: (log) =>
        set(s => ({ auditLogs: [log, ...s.auditLogs] })),
    }),
    {
      name: 'school-erp-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        students: state.students,
        teachers: state.teachers,
        classes: state.classes,
        subjects: state.subjects,
        rooms: state.rooms,
        periods: state.periods,
        conflicts: state.conflicts,
        attendance: state.attendance,
        documents: state.documents,
        alerts: state.alerts,
        notifications: state.notifications,
        resourcePredictions: state.resourcePredictions,
        auditLogs: state.auditLogs,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      },
    }
  )
);
