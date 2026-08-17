import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  Layers, Users, BookOpen, ChevronRight, X,
  User, Plus, Pencil, Trash2, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Class } from '@/types';

const GRADE_COLORS: Record<number, string> = {
  6:  'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400',
  7:  'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
  8:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  9:  'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  10: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
  11: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400',
  12: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
};

// ── Subject multi-select ──────────────────────────────────────────────────────
function SubjectPicker({
  allSubjectNames,
  selected,
  onChange,
}: {
  allSubjectNames: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  function toggle(name: string) {
    onChange(selected.includes(name)
      ? selected.filter(s => s !== name)
      : [...selected, name]);
  }
  return (
    <div className="relative">
      <div
        onClick={() => setOpen(o => !o)}
        className="min-h-[32px] w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background cursor-pointer flex flex-wrap gap-1"
      >
        {selected.length === 0
          ? <span className="text-muted-foreground">Select subjects…</span>
          : selected.map(s => (
              <span key={s} className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded font-medium">
                {s}
                <button type="button" onClick={e => { e.stopPropagation(); toggle(s); }}
                  className="hover:text-destructive"><X size={8} /></button>
              </span>
            ))
        }
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {allSubjectNames.length === 0
            ? <div className="px-3 py-2 text-xs text-muted-foreground">No subjects loaded yet</div>
            : allSubjectNames.map(name => (
                <button key={name} type="button" onClick={() => toggle(name)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left">
                  {name}
                  {selected.includes(name) && <Check size={12} className="text-primary" />}
                </button>
              ))
          }
        </div>
      )}
    </div>
  );
}

const EMPTY_FORM = {
  name: '', grade: '6', section: 'A',
  classTeacherId: '', academicYear: '2025-26',
  selectedSubjects: [] as string[],
};

export default function ClassesPage() {
  const classes       = useAppStore(s => s.classes);
  const students      = useAppStore(s => s.students);
  const teachers      = useAppStore(s => s.teachers);
  const subjects      = useAppStore(s => s.subjects);
  const loadClasses   = useAppStore(s => s.loadClasses);
  const loadStudents  = useAppStore(s => s.loadStudents);
  const loadTeachers  = useAppStore(s => s.loadTeachers);
  const loadSubjects  = useAppStore(s => s.loadSubjects);
  const addClass      = useAppStore(s => s.addClass);
  const updateClass   = useAppStore(s => s.updateClass);
  const deleteClass   = useAppStore(s => s.deleteClass);

  const [loading, setLoading]         = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<Class | null>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [form, setForm]               = useState({ ...EMPTY_FORM });

  useEffect(() => {
    Promise.all([
      loadClasses(), loadStudents(),
      loadTeachers(), loadSubjects(),
    ]).finally(() => setLoading(false));
  }, [loadClasses, loadStudents, loadTeachers, loadSubjects]);

  const selectedClass   = classes.find(c => c.id === selectedClassId) ?? null;
  const classStudents   = selectedClassId ? students.filter(s => s.classId === selectedClassId) : [];
  const allSubjectNames = [...new Set(subjects.map(s => s.name))].sort();

  function liveCount(classId: string) {
    return students.filter(s => s.classId === classId && s.status === 'active').length;
  }

  // ── Form helpers ────────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEdit(c: Class, e: React.MouseEvent) {
    e.stopPropagation();
    setEditing(c);
    setForm({
      name:              c.name,
      grade:             String(c.grade),
      section:           c.section,
      classTeacherId:    c.classTeacherId ?? '',
      academicYear:      c.academicYear,
      selectedSubjects:  c.subjects,
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error('Class name is required'); return; }

    const chosenTeacher = teachers.find(t => t.teacherId === form.classTeacherId);

    const payload: Omit<Class, 'id' | 'studentCount'> = {
      name:             form.name.trim(),
      grade:            parseInt(form.grade) || 6,
      section:          form.section,
      classTeacherId:   form.classTeacherId,
      classTeacherName: chosenTeacher?.name ?? '',
      roomId:           editing?.roomId ?? '',
      subjects:         form.selectedSubjects,
      academicYear:     form.academicYear,
    };

    if (editing) {
      void updateClass(editing.id, payload);
      toast.success('Class updated');
    } else {
      void addClass(payload);
      toast.success('Class created');
    }
    setShowForm(false);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Layers size={20} className="text-primary" /> Classes
          </h1>
          <p className="text-sm text-muted-foreground">
            {loading ? 'Loading…' : `${classes.length} classes · ${students.length} students`}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus size={14} /> Add Class
        </button>
      </div>

      {/* ── Class cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse h-44" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map(c => {
            const count = liveCount(c.id);
            const gradeColor = GRADE_COLORS[c.grade] ?? 'bg-muted text-muted-foreground';
            return (
              <div
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group relative"
              >
                {/* Edit + Delete buttons */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={e => openEdit(c, e)}
                    className="p-1 rounded bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
                  >
                    <Pencil size={11} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteId(c.id); }}
                    className="p-1 rounded bg-card hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 border border-border"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

                {/* Grade badge + year */}
                <div className="flex items-center justify-between mb-3">
                  <span className={cn('w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm', gradeColor)}>
                    {c.grade}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {c.academicYear}
                  </span>
                </div>

                {/* Name */}
                <div className="font-semibold pr-14">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Section {c.section}</div>

                {/* Stats */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User size={11} />
                    <span className="truncate">
                      {c.classTeacherName
                        ? c.classTeacherName.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s*/i, '')
                        : <span className="italic">No class teacher</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Users size={11} className="text-muted-foreground" />
                    <span className={cn('font-medium', count === 0 ? 'text-muted-foreground' : 'text-foreground')}>
                      {count} student{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BookOpen size={11} />
                    {c.subjects.length} subject{c.subjects.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Subject chips */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {c.subjects.slice(0, 4).map(s => (
                    <span key={s} className="px-1.5 py-0.5 text-[10px] bg-muted rounded">{s}</span>
                  ))}
                  {c.subjects.length > 4 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-muted rounded text-muted-foreground">
                      +{c.subjects.length - 4}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 right-4">
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Class detail drawer ── */}
      {selectedClass && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setSelectedClassId(null)}>
          <div
            className="w-full max-w-md bg-card border-l border-border h-full overflow-y-auto shadow-2xl animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-base">{selectedClass.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedClass.academicYear}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { setSelectedClassId(null); openEdit(selectedClass, e); }}
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setSelectedClassId(null)}
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-6">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Grade',        value: `Grade ${selectedClass.grade}` },
                  { label: 'Section',      value: selectedClass.section || '—' },
                  { label: 'Class Teacher', value: selectedClass.classTeacherName || '—' },
                  { label: 'Students',     value: `${liveCount(selectedClass.id)} active` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                    <div className="text-sm font-medium">{value}</div>
                  </div>
                ))}
              </div>

              {/* Subjects */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <BookOpen size={14} className="text-primary" /> Subjects
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedClass.subjects.length > 0
                    ? selectedClass.subjects.map(s => (
                        <span key={s} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-md font-medium">
                          {s}
                        </span>
                      ))
                    : <span className="text-xs text-muted-foreground">No subjects assigned</span>
                  }
                </div>
              </div>

              {/* Students list */}
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <GraduationCapIcon size={14} className="text-primary" />
                  Students
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {classStudents.length} total
                  </span>
                </h3>
                {classStudents.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-lg">
                    No students assigned to this class yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {classStudents.map(s => (
                      <div key={s.id} className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2">
                        <div>
                          <div className="text-sm font-medium">{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.studentId}</div>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            s.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          )}>
                            {s.status}
                          </span>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {s.attendancePercentage}% att.
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">{editing ? 'Edit Class' : 'Add New Class'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Class name */}
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Class Name*</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Grade 8 - C"
                  className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Grade + Section row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Grade</label>
                  <select
                    value={form.grade}
                    onChange={e => setForm(p => ({ ...p, grade: e.target.value }))}
                    className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => (
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Section</label>
                  <select
                    value={form.section}
                    onChange={e => setForm(p => ({ ...p, section: e.target.value }))}
                    className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {['A','B','C','D','E'].map(s => (
                      <option key={s} value={s}>Section {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Class Teacher */}
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                  Class Teacher
                  {form.classTeacherId && (
                    <span className="ml-1 text-primary font-normal">
                      — {teachers.find(t => t.teacherId === form.classTeacherId)?.name}
                    </span>
                  )}
                </label>
                <select
                  value={form.classTeacherId}
                  onChange={e => setForm(p => ({ ...p, classTeacherId: e.target.value }))}
                  className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">— Unassigned —</option>
                  {teachers.filter(t => t.status === 'active').map(t => (
                    <option key={t.teacherId} value={t.teacherId}>
                      {t.name} ({t.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Academic Year</label>
                <input
                  value={form.academicYear}
                  onChange={e => setForm(p => ({ ...p, academicYear: e.target.value }))}
                  placeholder="e.g. 2025-26"
                  className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              {/* Subjects */}
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                  Subjects ({form.selectedSubjects.length} selected)
                </label>
                <SubjectPicker
                  allSubjectNames={allSubjectNames}
                  selected={form.selectedSubjects}
                  onChange={v => setForm(p => ({ ...p, selectedSubjects: v }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-1.5 text-sm border border-border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {editing ? 'Save Changes' : 'Create Class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl p-5 animate-fade-in">
            <h2 className="font-semibold mb-2">Remove Class</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This will remove the class record. Students in this class will not be deleted but will lose their class assignment.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-1.5 text-sm border border-border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  void deleteClass(deleteId);
                  toast.success('Class removed');
                  setDeleteId(null);
                }}
                className="px-4 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GraduationCapIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
