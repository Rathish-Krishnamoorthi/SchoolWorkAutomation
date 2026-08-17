import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cn, getInitials } from '@/lib/utils';
import {
  GraduationCap, Search, Plus, Download, Upload, Pencil, Trash2, X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Student } from '@/types';

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  inactive: 'bg-muted text-muted-foreground',
  transferred: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  graduated: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
};

function AttBadge({ pct }: { pct: number }) {
  const color = pct >= 90 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600';
  return <span className={cn('font-medium text-sm', color)}>{pct}%</span>;
}

interface StudentFormData {
  name: string; dateOfBirth: string; gender: string; className: string; section: string;
  parentName: string; parentContact: string; email: string; address: string; bloodGroup: string;
  [key: string]: string;
}

const EMPTY_FORM: StudentFormData = {
  name: '', dateOfBirth: '', gender: 'male', className: '', section: '',
  parentName: '', parentContact: '', email: '', address: '', bloodGroup: 'O+'
};

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let quoteOpen = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoteOpen && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoteOpen = !quoteOpen;
      }
      continue;
    }

    if (char === ',' && !quoteOpen) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function exportStudentsCsv(students: Student[]) {
  const headers = ['studentId', 'name', 'dateOfBirth', 'gender', 'className', 'section', 'parentName', 'parentContact', 'email', 'address', 'bloodGroup', 'status'];
  const rows = students.map(student => [
    student.studentId,
    student.name,
    student.dateOfBirth,
    student.gender,
    student.className,
    student.section,
    student.parentName,
    student.parentContact,
    student.email ?? '',
    student.address,
    student.bloodGroup ?? '',
    student.status,
  ]);

  const csv = [headers, ...rows]
    .map(values => values.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'students_export.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function parseStudentsCsv(csvText: string): Student[] {
  const rows = csvText
    .split(/\r?\n/)
    .map(line => parseCsvLine(line))
    .filter(row => row.some(cell => cell !== ''));

  if (rows.length < 2) return [];

  const headers = rows[0].map(header => header.replace(/\s+/g, '').toLowerCase());
  const records: Student[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (row.length < headers.length) continue;

    const values: Record<string, string> = {};
    headers.forEach((header, index) => {
      values[header] = row[index] ?? '';
    });

    const name = values.name || values.studentname || values.fullname;
    const parentName = values.parentname || values.guardianname || '';
    const parentContact = values.parentcontact || values.contactnumber || values.phone || '';

    if (!name && !values.studentid) continue;

    const className = values.classname || values.class || '';
    const section = values.section || 'A';
    const rowStudent: Student = {
      id: `s${Date.now()}-${i}`,
      studentId: values.studentid || `STU-${1100 + records.length}`,
      photo: '',
      name,
      dateOfBirth: values.dateofbirth || '',
      gender: (values.gender || 'male').toLowerCase() as Student['gender'],
      classId: '',          // resolved after parse using the classes store
      className,
      section,
      parentName,
      parentContact,
      email: values.email || '',
      address: values.address || '',
      admissionDate: new Date().toISOString().slice(0, 10),
      attendancePercentage: 0,
      status: (values.status || 'active').toLowerCase() as Student['status'],
      bloodGroup: values.bloodgroup || 'O+',
      nationality: 'Indian',
    };

    records.push(rowStudent);
  }

  return records;
}

export default function StudentsPage() {
  const students = useAppStore(s => s.students);
  const classes = useAppStore(s => s.classes);
  const loadStudents = useAppStore(s => s.loadStudents);
  const loadClasses  = useAppStore(s => s.loadClasses);
  const addStudent = useAppStore(s => s.addStudent);
  const updateStudent = useAppStore(s => s.updateStudent);
  const deleteStudent = useAppStore(s => s.deleteStudent);

  useEffect(() => {
    void loadStudents();
    if (classes.length === 0) void loadClasses();
  }, [loadStudents, loadClasses, classes.length]);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentFormData>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = students.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.includes(search);
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const matchClass = filterClass === 'all' || s.classId === filterClass;
    return matchSearch && matchStatus && matchClass;
  });

  function openAdd() { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); }
  function openEdit(s: Student) {
    setEditing(s);
    setForm({ name: s.name, dateOfBirth: s.dateOfBirth, gender: s.gender,
      className: s.classId,          // store the ID so dropdown matches
      section: s.section, parentName: s.parentName, parentContact: s.parentContact,
      email: s.email ?? '', address: s.address, bloodGroup: s.bloodGroup ?? '' });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name || !form.parentContact) { toast.error('Name and contact are required'); return; }

    // form.className stores the class ID (set by the dropdown's value={c.id})
    const chosenClass = classes.find(c => c.id === form.className) ?? classes[0];
    if (!chosenClass) { toast.error('Please select a class'); return; }

    const resolvedSection = form.section || chosenClass.section || 'A';

    if (editing) {
      updateStudent(editing.studentId, {
        ...form,
        className: chosenClass.name,
        section: resolvedSection,
        classId: chosenClass.id,
        gender: form.gender as 'male' | 'female' | 'other',
      });
      toast.success('Student updated');
    } else {
      const newStudent: Student = {
        id: `s${Date.now()}`,
        studentId: `STU-${1100 + students.length}`,
        photo: '',
        name: form.name,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender as 'male' | 'female' | 'other',
        classId: chosenClass.id,
        className: chosenClass.name,
        section: resolvedSection,
        parentName: form.parentName,
        parentContact: form.parentContact,
        email: form.email,
        address: form.address,
        admissionDate: new Date().toISOString().slice(0, 10),
        attendancePercentage: 0,
        status: 'active',
        bloodGroup: form.bloodGroup,
        nationality: 'Indian',
      };
      addStudent(newStudent);
      toast.success('Student added successfully');
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  function handleDelete(studentId: string) {
    deleteStudent(studentId);
    setDeleteId(null);
    toast.success('Student removed');
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const csvText = await file.text();
      const importedStudents = parseStudentsCsv(csvText).map((student, index) => ({
        ...student,
        id: student.id || `s${Date.now()}-${index}`,
        // Resolve classId from class name; warn if not found but don't silently hardcode
        classId: classes.find(
          c => c.name.toLowerCase() === student.className.toLowerCase()
        )?.id ?? classes[0]?.id ?? '',
        studentId: student.studentId || `STU-${1100 + students.length + index}`,
      }));

      if (!importedStudents.length) {
        throw new Error('No valid student rows found in the CSV file.');
      }

      importedStudents.forEach(student => addStudent(student));
      toast.success(`${importedStudents.length} students imported.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to import student CSV');
    } finally {
      event.target.value = '';
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <GraduationCap size={20} className="text-primary" /> Students
          </h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {students.length} students</p>
        </div>
        <div className="flex gap-2 sm:ml-auto flex-wrap">
          <button
            onClick={() => exportStudentsCsv(students)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors"
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> Add Student
          </button>
        </div>
      </div>
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImport} />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search name or ID…"
            className="w-full h-8 pl-8 pr-3 text-sm bg-muted rounded-md border border-transparent focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none"
          />
        </div>
        <select
          value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-8 px-2 text-sm bg-muted rounded-md border border-transparent focus:border-ring focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="transferred">Transferred</option>
          <option value="graduated">Graduated</option>
        </select>
        <select
          value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="h-8 px-2 text-sm bg-muted rounded-md border border-transparent focus:border-ring focus:outline-none"
        >
          <option value="all">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Class</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Parent</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden xl:table-cell">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Attendance</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No students found. Try adjusting your filters.
                  </td>
                </tr>
              )}
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center flex-shrink-0">
                        {getInitials(s.name)}
                      </div>
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.studentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{s.className} {s.section}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{s.parentName}</td>
                  <td className="px-4 py-3 hidden xl:table-cell text-muted-foreground">{s.parentContact}</td>
                  <td className="px-4 py-3"><AttBadge pct={s.attendancePercentage} /></td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium capitalize', STATUS_COLOR[s.status])}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(s.studentId)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-muted-foreground hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">{editing ? 'Edit Student' : 'Add New Student'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 rounded hover:bg-muted"><X size={16} /></button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Full Name*', key: 'name', type: 'text' },
                { label: 'Date of Birth', key: 'dateOfBirth', type: 'date' },
                { label: 'Parent / Guardian Name', key: 'parentName', type: 'text' },
                { label: 'Contact Number*', key: 'parentContact', type: 'tel' },
                { label: 'Email', key: 'email', type: 'email' },
                { label: 'Address', key: 'address', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Gender', key: 'gender', opts: ['male','female','other'] },
                  { label: 'Blood Group', key: 'bloodGroup', opts: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium mb-1 text-muted-foreground">{f.label}</label>
                    <select
                      value={form[f.key]}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Class</label>
                  <select
                    value={form.className || classes[0]?.id || ''}
                    onChange={e => setForm(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {classes.length === 0
                      ? <option value="">Loading classes…</option>
                      : classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    }
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">Section</label>
                  <select
                    value={form.section || classes.find(c => c.id === form.className)?.section || 'A'}
                    onChange={e => setForm(prev => ({ ...prev, section: e.target.value }))}
                    className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {['A', 'B', 'C', 'D', 'E'].map(section => <option key={section} value={section}>{section}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-border">
              <button onClick={() => setShowForm(false)} className="px-4 py-1.5 text-sm border border-border rounded-md hover:bg-muted">Cancel</button>
              <button onClick={handleSave} className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                {editing ? 'Save Changes' : 'Add Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm shadow-xl p-5 animate-fade-in">
            <h2 className="font-semibold mb-2">Remove Student</h2>
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone. Are you sure?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="px-4 py-1.5 text-sm border border-border rounded-md hover:bg-muted">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="px-4 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
