import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cn, getInitials, workloadColor } from '@/lib/utils';
import { Users, Search, Plus, Pencil, Trash2, X, AlertTriangle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Teacher } from '@/types';

const STATUS_COLOR: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  inactive: 'bg-muted text-muted-foreground',
  on_leave: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
};

const DEPARTMENTS = [
  'Mathematics', 'Science', 'Languages', 'Social Science',
  'Computer Science', 'Arts & PE',
];

function WorkloadBar({ value }: { value: number }) {
  const color = value >= 90 ? 'bg-red-500' : value >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
      <span className={cn('text-xs font-medium w-8 text-right', workloadColor(value))}>{value}%</span>
    </div>
  );
}

/** Inline multi-select pill picker for subjects */
function SubjectPicker({
  allSubjects,
  selected,
  onChange,
}: {
  allSubjects: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  function toggle(name: string) {
    onChange(
      selected.includes(name)
        ? selected.filter(s => s !== name)
        : [...selected, name],
    );
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        className="min-h-[32px] w-full px-3 py-1.5 text-sm rounded-md border border-input bg-background cursor-pointer flex flex-wrap gap-1 focus-within:ring-1 focus-within:ring-ring"
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground text-sm">Select subjects…</span>
        ) : (
          selected.map(s => (
            <span
              key={s}
              className="flex items-center gap-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
            >
              {s}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); toggle(s); }}
                className="hover:text-destructive"
              >
                <X size={10} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {allSubjects.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">No subjects loaded yet</div>
          ) : (
            allSubjects.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => toggle(name)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted text-left"
              >
                {name}
                {selected.includes(name) && <Check size={12} className="text-primary" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function TeachersPage() {
  const teachers      = useAppStore(s => s.teachers);
  const subjects      = useAppStore(s => s.subjects);
  const loadTeachers  = useAppStore(s => s.loadTeachers);
  const loadSubjects  = useAppStore(s => s.loadSubjects);
  const addTeacher    = useAppStore(s => s.addTeacher);
  const updateTeacher = useAppStore(s => s.updateTeacher);
  const deleteTeacher = useAppStore(s => s.deleteTeacher);

  useEffect(() => {
    void loadTeachers();
    if (subjects.length === 0) void loadSubjects();
  }, [loadTeachers, loadSubjects, subjects.length]);

  // All unique subject names from the subjects store
  const allSubjectNames = [...new Set(subjects.map(s => s.name))].sort();

  const [search, setSearch]         = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [showForm, setShowForm]     = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', department: 'Mathematics', email: '',
    phone: '', qualification: '', experience: '0',
    selectedSubjects: [] as string[],
  });

  const departments = [...new Set(teachers.map(t => t.department))];

  const filtered = teachers.filter(t => {
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.teacherId.includes(search);
    const matchDept = filterDept === 'all' || t.department === filterDept;
    return matchSearch && matchDept;
  });

  function resetForm() {
    setForm({ name: '', department: 'Mathematics', email: '', phone: '',
      qualification: '', experience: '0', selectedSubjects: [] });
  }

  function openAdd() {
    setEditingTeacher(null);
    resetForm();
    setShowForm(true);
  }

  function openEdit(t: Teacher) {
    setEditingTeacher(t);
    setForm({
      name: t.name,
      department: t.department,
      email: t.email,
      phone: t.phone,
      qualification: t.qualification,
      experience: String(t.experience),
      selectedSubjects: t.subjects,
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name || !form.email) { toast.error('Name and email required'); return; }

    const teacherData = {
      name: form.name,
      department: form.department,
      email: form.email,
      phone: form.phone,
      qualification: form.qualification,
      experience: parseInt(form.experience) || 0,
      subjects: form.selectedSubjects,
    };

    if (editingTeacher) {
      updateTeacher(editingTeacher.teacherId, teacherData);
      toast.success('Teacher updated');
    } else {
      const t: Teacher = {
        id: `t${Date.now()}`,
        teacherId: `TCH-${100 + teachers.length}`,
        classes: [],
        joiningDate: new Date().toISOString().slice(0, 10),
        workload: 0,
        status: 'active',
        photo: '',
        availability: {},
        ...teacherData,
      };
      addTeacher(t);
      toast.success('Teacher added');
    }
    setShowForm(false);
    resetForm();
    setEditingTeacher(null);
  }

  const overloadedCount = teachers.filter(t => t.workload >= 90).length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users size={20} className="text-primary" /> Teachers
          </h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} of {teachers.length} teachers
          </p>
        </div>
        {overloadedCount > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-xs">
            <AlertTriangle size={12} />
            {overloadedCount} teacher{overloadedCount > 1 ? 's' : ''} above 90% workload
          </div>
        )}
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 sm:ml-auto"
        >
          <Plus size={14} /> Add Teacher
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or ID…"
            className="w-full h-8 pl-8 pr-3 text-sm bg-muted rounded-md border border-transparent focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
          />
        </div>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="h-8 px-2 text-sm bg-muted rounded-md border border-transparent focus:border-ring focus:outline-none"
        >
          <option value="all">All Departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* ── Teacher cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center">
                  {getInitials(t.name)}
                </div>
                <div>
                  <div className="font-medium text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.teacherId} · {t.department}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(t)}
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => setDeleteId(t.teacherId)}
                  className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div className="space-y-1.5 mb-3">
              {/* Subject pills — sourced from teacher.subjects array */}
              <div className="flex flex-wrap gap-1">
                {t.subjects.length > 0
                  ? t.subjects.map(s => (
                      <span key={s} className="px-1.5 py-0.5 text-[10px] bg-muted rounded font-medium">{s}</span>
                    ))
                  : <span className="text-xs text-muted-foreground italic">No subjects assigned</span>
                }
              </div>
              <div className="text-xs text-muted-foreground">{t.email}</div>
              <div className="text-xs text-muted-foreground">{t.phone} · {t.experience}y exp</div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Workload</span>
                {t.workload >= 90 && <AlertTriangle size={10} className="text-red-500" />}
              </div>
              <WorkloadBar value={t.workload} />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium', STATUS_COLOR[t.status])}>
                {t.status.replace('_', ' ')}
              </span>
              {t.classes.length > 0 && (
                <span className="text-xs text-muted-foreground">{t.classes.length} class{t.classes.length !== 1 ? 'es' : ''}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Add / Edit modal ── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-md shadow-xl animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">{editingTeacher ? 'Edit Teacher' : 'Add New Teacher'}</h2>
              <button
                onClick={() => { setShowForm(false); setEditingTeacher(null); resetForm(); }}
                className="p-1 rounded hover:bg-muted"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              {/* Text fields */}
              {([
                { label: 'Full Name*',            key: 'name',          type: 'text' },
                { label: 'Email*',                key: 'email',         type: 'email' },
                { label: 'Phone',                 key: 'phone',         type: 'tel' },
                { label: 'Qualification',         key: 'qualification', type: 'text' },
                { label: 'Experience (years)',    key: 'experience',    type: 'number' },
              ] as { label: string; key: keyof typeof form; type: string }[]).map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key] as string}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ))}

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

              {/* Subjects multi-select */}
              <div>
                <label className="block text-xs font-medium mb-1 text-muted-foreground">
                  Subjects {allSubjectNames.length > 0 ? `(${allSubjectNames.length} available)` : ''}
                </label>
                <SubjectPicker
                  allSubjects={allSubjectNames}
                  selected={form.selectedSubjects}
                  onChange={v => setForm(p => ({ ...p, selectedSubjects: v }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button
                onClick={() => { setShowForm(false); setEditingTeacher(null); resetForm(); }}
                className="px-4 py-1.5 text-sm border border-border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {editingTeacher ? 'Save Changes' : 'Add Teacher'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl p-5 animate-fade-in">
            <h2 className="font-semibold mb-2">Remove Teacher</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently remove the teacher record. Continue?
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
                  deleteTeacher(deleteId);
                  setDeleteId(null);
                  toast.success('Teacher removed');
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
