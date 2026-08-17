import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { ClipboardList, Camera, Wifi, Check, X, Clock, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AttendanceStatus, AttendanceMode } from '@/types';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; dot: string }> = {
  present: { label: 'Present', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400', dot: 'bg-emerald-500' },
  absent:  { label: 'Absent',  color: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400', dot: 'bg-red-500' },
  late:    { label: 'Late',    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400', dot: 'bg-amber-500' },
  excused: { label: 'Excused', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400', dot: 'bg-blue-500' },
};

export default function AttendancePage() {
  const students = useAppStore(s => s.students);
  const classes = useAppStore(s => s.classes);
  const loadStudents = useAppStore(s => s.loadStudents);
  const loadClasses = useAppStore(s => s.loadClasses);
  const bulkMarkAttendance = useAppStore(s => s.bulkMarkAttendance);
  const attendance = useAppStore(s => s.attendance);

  const [mode, setMode] = useState<AttendanceMode>('manual');
  const [selectedClass, setSelectedClass] = useState(classes[0]?.id ?? '');

  useEffect(() => {
    if (classes.length > 0 && (!selectedClass || !classes.some(c => c.id === selectedClass))) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  useEffect(() => {
    if (classes.length === 0) {
      void loadClasses();
    }
    if (students.length === 0) {
      void loadStudents();
    }
  }, [classes.length, students.length, loadClasses, loadStudents]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const [rfidScanning, setRfidScanning] = useState(false);
  const [cvProcessing, setCvProcessing] = useState(false);

  const classStudents = students.filter(s => s.classId === selectedClass);

  useEffect(() => {
    if (!selectedClass || classStudents.length === 0) {
      setStatuses({});
      return;
    }

    const nextStatuses: Record<string, AttendanceStatus> = {};
    classStudents.forEach(s => {
      const rec = attendance.find(a => (a.studentId === s.id || a.studentId === s.studentId) && a.date === date);
      if (rec) nextStatuses[s.id] = rec.status;
    });

    if (Object.keys(nextStatuses).length > 0 && Object.keys(statuses).length === 0) {
      setStatuses(nextStatuses);
    }
  }, [selectedClass, date, classStudents, attendance, statuses]);

  // Pre-fill from existing records
  function loadExistingAttendance() {
    const existing: Record<string, AttendanceStatus> = {};
    classStudents.forEach(s => {
      const rec = attendance.find(a => (a.studentId === s.id || a.studentId === s.studentId) && a.date === date);
      existing[s.id] = rec?.status ?? 'present';
    });
    setStatuses(existing);
  }

  function setAll(status: AttendanceStatus) {
    const all: Record<string, AttendanceStatus> = {};
    classStudents.forEach(s => { all[s.id] = status; });
    setStatuses(all);
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const records = classStudents.map(s => ({
      id: `att-${s.id}-${date}`,
      studentId: s.id, studentName: s.name,
      classId: selectedClass, date,
      status: statuses[s.id] ?? 'present',
      markedBy: 'Admin', mode, time: new Date().toTimeString().slice(0, 5),
    }));
    bulkMarkAttendance(records);
    setSaving(false);
    toast.success(`Attendance saved for ${records.length} students`);
  }

  async function simulateRFID() {
    setRfidScanning(true);
    await new Promise(r => setTimeout(r, 2000));
    const auto: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s, i) => { auto[s.id] = i % 9 === 0 ? 'absent' : i % 12 === 3 ? 'late' : 'present'; });
    setStatuses(auto);
    setRfidScanning(false);
    toast.success('RFID scan complete — attendance loaded');
  }

  async function simulateCV() {
    setCvProcessing(true);
    await new Promise(r => setTimeout(r, 2500));
    const auto: Record<string, AttendanceStatus> = {};
    classStudents.forEach((s, i) => { auto[s.id] = i % 10 === 0 ? 'absent' : 'present'; });
    setStatuses(auto);
    setCvProcessing(false);
    toast.success('Face recognition complete — 1 unknown face flagged');
  }

  const present = Object.values(statuses).filter(v => v === 'present').length;
  const absent = Object.values(statuses).filter(v => v === 'absent').length;
  const late = Object.values(statuses).filter(v => v === 'late').length;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><ClipboardList size={20} className="text-primary" /> Attendance</h1>
        <p className="text-sm text-muted-foreground">Mark and track student attendance</p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        {([['manual', 'Manual', <ClipboardList size={13} />], ['rfid', 'RFID', <Wifi size={13} />], ['computer_vision', 'Face Recognition', <Camera size={13} />]] as const).map(([m, label, icon]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors',
              mode === m ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted',
            )}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setStatuses({}); }}
          className="h-8 px-2 text-sm bg-muted rounded-md border border-transparent focus:border-ring focus:outline-none">
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="h-8 px-3 text-sm bg-muted rounded-md border border-transparent focus:border-ring focus:outline-none" />
        <button onClick={loadExistingAttendance} className="h-8 px-3 text-sm border border-border rounded-md hover:bg-muted">Load Existing</button>
        {mode === 'manual' && (
          <>
            <button onClick={() => setAll('present')} className="h-8 px-3 text-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 rounded-md hover:opacity-90">All Present</button>
            <button onClick={() => setAll('absent')} className="h-8 px-3 text-sm bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 rounded-md hover:opacity-90">All Absent</button>
          </>
        )}
        {mode === 'rfid' && (
          <button onClick={simulateRFID} disabled={rfidScanning}
            className="h-8 px-3 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-60 flex items-center gap-1.5">
            <Wifi size={12} className={rfidScanning ? 'animate-pulse' : ''} />
            {rfidScanning ? 'Scanning…' : 'Start RFID Scan'}
          </button>
        )}
        {mode === 'computer_vision' && (
          <button onClick={simulateCV} disabled={cvProcessing}
            className="h-8 px-3 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-60 flex items-center gap-1.5">
            <Camera size={12} className={cvProcessing ? 'animate-pulse' : ''} />
            {cvProcessing ? 'Processing…' : 'Start Face Recognition'}
          </button>
        )}
      </div>

      {/* RFID / CV status panels */}
      {mode === 'rfid' && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wifi size={14} className="text-emerald-500" />
            <span className="text-sm font-medium">RFID Reader</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">Connected</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center"><div className="text-2xl font-bold">{classStudents.length}</div><div className="text-xs text-muted-foreground">Students</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-emerald-600">{present}</div><div className="text-xs text-muted-foreground">Present</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-red-600">{absent}</div><div className="text-xs text-muted-foreground">Absent</div></div>
          </div>
          <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/50 rounded">
            Architecture note: In production, this connects to a real RFID reader via WebSocket or REST polling. Current results are simulated.
          </p>
        </div>
      )}
      {mode === 'computer_vision' && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera size={14} className="text-blue-500" />
            <span className="text-sm font-medium">Camera Feed</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">Connected</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center"><div className="text-2xl font-bold">{classStudents.length - 1}</div><div className="text-xs text-muted-foreground">Faces Detected</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-emerald-600">{present}</div><div className="text-xs text-muted-foreground">Processed</div></div>
            <div className="text-center"><div className="text-2xl font-bold text-amber-600">1</div><div className="text-xs text-muted-foreground">Unknown</div></div>
          </div>
          <p className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
            Architecture note: In production, a Python CV service (OpenCV + face_recognition) sends detection results to this endpoint. Current results are simulated.
          </p>
        </div>
      )}

      {/* Summary bar */}
      {Object.keys(statuses).length > 0 && (
        <div className="flex flex-wrap gap-3 p-3 bg-muted/30 rounded-lg">
          {[['present', present, 'text-emerald-600'], ['absent', absent, 'text-red-600'], ['late', late, 'text-amber-600']].map(([k, v, c]) => (
            <span key={k} className="text-sm">
              <span className={cn('font-bold', c as string)}>{v as number}</span>
              <span className="text-muted-foreground ml-1 capitalize">{k}</span>
            </span>
          ))}
          <span className="text-sm text-muted-foreground ml-auto">
            {classStudents.length === 0 ? 0 : Math.round((present / classStudents.length) * 100)}% attendance
          </span>
        </div>
      )}

      {/* Student list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Attendance %</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.length === 0 ? (
                <tr><td colSpan={3} className="text-center py-8 text-muted-foreground">No students in this class</td></tr>
              ) : (
                classStudents.map(s => {
                  const status = statuses[s.id];
                  return (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {status && <div className={cn('w-2 h-2 rounded-full flex-shrink-0', STATUS_CONFIG[status].dot)} />}
                          <div>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-muted-foreground">{s.studentId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={cn('text-sm font-medium', s.attendancePercentage < 75 ? 'text-red-600' : s.attendancePercentage < 85 ? 'text-amber-600' : 'text-emerald-600')}>
                          {s.attendancePercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {mode === 'manual' ? (
                          <div className="flex gap-1 flex-wrap">
                            {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(st => (
                              <button
                                key={st}
                                onClick={() => setStatuses(p => ({ ...p, [s.id]: st }))}
                                className={cn(
                                  'px-2 py-0.5 text-xs rounded-full border transition-colors capitalize',
                                  status === st
                                    ? STATUS_CONFIG[st].color + ' border-transparent'
                                    : 'border-border hover:bg-muted',
                                )}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        ) : (
                          status ? (
                            <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium capitalize', STATUS_CONFIG[status].color)}>
                              {status}
                            </span>
                          ) : <span className="text-xs text-muted-foreground">Not marked</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {classStudents.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || Object.keys(statuses).length === 0}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            <UserCheck size={14} />
            {saving ? 'Saving…' : `Save Attendance (${Object.keys(statuses).length} students)`}
          </button>
        </div>
      )}
    </div>
  );
}
