import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { BookOpen, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Subject } from '@/types';

const PRIORITY_COLOR: Record<string, string> = {
  core:     'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  elective: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
  activity: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
};

const PRIORITIES = ['core', 'elective', 'activity'] as const;

const DEPARTMENTS = [
  'Mathematics', 'Science', 'Languages', 'Social Science',
  'Computer Science', 'Arts & PE',
];

// ── Reusable class multi-select ───────────────────────────────────────────────
function ClassPicker({
  allClasses,
  selectedIds,
  onChange,
}: {
  allClasses: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id]);
  }

  const selectedNames = allClasses
    .filter(c => selectedIds.includes(c.id))
    .map(c => c.name);

  return (
    <div className="relative">
      <div
        onClick={() => setOpen(o => !o)}
        className="min-h-[32px] w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background cursor-pointer flex flex-wrap gap-1"
      >
        {selectedNames.length === 0
          ? <span className="text-muted-foreground">Select classes…</span>
          : selectedNames.map(name => (
              <span key={name} className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded font-medium">
                {name}
              </span>
            ))
        }
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
          {allClasses.length === 0
            ? <div className="px-3 py-2 text-xs text-muted-foreground">No classes loaded</div>
            : allClasses.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggle(c.id)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left"
                >
                  {c.name}
                  {selectedIds.includes(c.id) && <Check size={12} className="text-primary flex-shrink-0" />}
                </button>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ── Empty form state ──────────────────────────────────────────────────────────
const EMPTY: {
  name: string; code: string; teacherId: string; department: string;
  weeklyPeriods: string; priority: typeof PRIORITIES[number]; classIds: string[];
} = {
  name: '', code: '', teacherId: '', department: 'Mathematics',
  weeklyPeriods: '4', priority: 'core', classIds: [],
};

export default function SubjectsPage() {
  const subjects     = useAppStore(s => s.subjects);
  const classes      = useAppStore(s => s.classes);
  const teachers     = useAppStore(s => s.teachers);
  const loadSubjects = useAppStore(s => s.loadSubjects);
  const loadClasses  = useAppStore(s => s.loadClasses);
  const loadTeachers = useAppStore(s => s.loadTeachers);
  const addSubject   = useAppStore(s => s.addSubject);
  const updateSubject = useAppStore(s => s.updateSubject);
  const deleteSubject = useAppStore(s => s.deleteSubject);

  useEffect(() => {
    void loadSubjects();
    if (classes.length === 0)  void loadClasses();
    if (teachers.length === 0) void loadTeachers();
  }, [loadSubjects, loadClasses, loadTeachers, classes.length, teachers.length]);

  // id → name lookup for class chips
  const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]));

  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<Subject | null>(null);
  const [deleteId, setDeleteId]       = useState<string | null>(null);
  const [form, setForm]               = useState({ ...EMPTY });

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  }

  function openEdit(s: Subject) {
    setEditing(s);
    setForm({
      name:         s.name,
      code:         s.code,
      teacherId:    s.teacherId ?? '',
      department:   s.department,
      weeklyPeriods: String(s.weeklyPeriods),
      priority:     s.priority,
      classIds:     s.classes,
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name.trim()) { toast.error('Subject name is required'); return; }

    const chosenTeacher = teachers.find(t => t.teacherId === form.teacherId);

    const payload = {
      name:         form.name.trim(),
      code:         form.code.trim().toUpperCase(),
      teacherId:    form.teacherId || undefined,
      teacherName:  chosenTeacher?.name,
      department:   form.department,
      weeklyPeriods: parseInt(form.weeklyPeriods) || 4,
      priority:     form.priority,
      classes:      form.classIds,
    };

    if (editing) {
      void updateSubject(editing.id, payload as any);
      toast.success('Subject updated');
    } else {
      void addSubject(payload as any);
      toast.success('Subject added');
    }
    setShowForm(false);
  }

  function confirmDelete(id: string) { setDeleteId(id); }

  function handleDelete() {
    if (!deleteId) return;
    void deleteSubject(deleteId);
    toast.success('Subject removed');
    setDeleteId(null);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <BookOpen size={20} className="text-primary" /> Subjects
          </h1>
          <p className="text-sm text-muted-foreground">{subjects.length} subjects</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus size={14} /> Add Subject
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subject</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Teacher</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Department</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Periods/wk</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Classes</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    No subjects yet. Click "Add Subject" to create one.
                  </td>
                </tr>
              ) : subjects.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.code || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {s.teacherName
                      ? s.teacherName
                      : <span className="italic text-muted-foreground/60">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{s.department}</td>
                  <td className="px-4 py-3 text-center">{s.weeklyPeriods}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium capitalize', PRIORITY_COLOR[s.priority])}>
                      {s.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {s.classes.slice(0, 3).map(cid => (
                        <span key={cid} className="px-1.5 py-0.5 text-[10px] bg-muted rounded">
                          {classMap[cid] ?? cid}
                        </span>
                      ))}
                      {s.classes.length > 3 && (
                        <span className="px-1.5 py-0.5 text-[10px] bg-muted rounded text-muted-foreground">
                          +{s.classes.length - 3}
                        </span>
                      )}
                      {s.classes.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">None</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => confirmDelete(s.id)}
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">{editing ? 'Edit Subject' : 'Add New Subject'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Subject Name*</label>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. Mathematics"
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Subject Code</label>
                <input
                  value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                  className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="e.g. MAT"
                />
              </div>

              {/* Teacher */}
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                  Assigned Teacher
                  {form.teacherId && (
                    <span className="ml-1 text-primary font-normal">
                      — {teachers.find(t => t.teacherId === form.teacherId)?.name}
                    </span>
                  )}
                </label>
                <select
                  value={form.teacherId}
                  onChange={e => setForm(p => ({ ...p, teacherId: e.target.value }))}
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

              {/* Department */}
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">Department</label>
                <select
                  value={form.department}
                  onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                  className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Periods + Priority row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Periods / week</label>
                  <input
                    type="number" min={1} max={10}
                    value={form.weeklyPeriods}
                    onChange={e => setForm(p => ({ ...p, weeklyPeriods: e.target.value }))}
                    className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Type</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value as typeof PRIORITIES[number] }))}
                    className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Classes multi-select */}
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                  Assigned to Classes ({form.classIds.length} selected)
                </label>
                <ClassPicker
                  allClasses={classes}
                  selectedIds={form.classIds}
                  onChange={ids => setForm(p => ({ ...p, classIds: ids }))}
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
                {editing ? 'Save Changes' : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl p-5 animate-fade-in">
            <h2 className="font-semibold mb-2">Remove Subject</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete the subject. Continue?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-1.5 text-sm border border-border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
