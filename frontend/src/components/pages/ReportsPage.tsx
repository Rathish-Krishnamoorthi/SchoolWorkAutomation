import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { FileText, Download, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const REPORT_TYPES = [
  { id: 'attendance', label: 'Attendance Report', desc: 'Daily/weekly/monthly attendance summary by class and student' },
  { id: 'student', label: 'Student Report', desc: 'Student roster with contact details, attendance, and status' },
  { id: 'teacher', label: 'Teacher Workload Report', desc: 'Teacher assignments, workload, and availability' },
  { id: 'timetable', label: 'Timetable Report', desc: 'Weekly schedule for all classes and teachers' },
  { id: 'resource', label: 'Resource Utilization', desc: 'Room, lab, and equipment utilization statistics' },
  { id: 'document', label: 'Document Processing', desc: 'Documents processed, pending, and rejected with timelines' },
];

export default function ReportsPage() {
  const students = useAppStore(s => s.students);
  const teachers = useAppStore(s => s.teachers);
  const classes = useAppStore(s => s.classes);
  const attendance = useAppStore(s => s.attendance);
  const [selectedType, setSelectedType] = useState('attendance');
  const [dateFrom, setDateFrom] = useState('2026-08-01');
  const [dateTo, setDateTo] = useState('2026-08-15');
  const [filterClass, setFilterClass] = useState('all');
  const [generating, setGenerating] = useState(false);

  async function generateReport(format: 'csv' | 'pdf') {
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1200));
    setGenerating(false);

    // Build CSV content for attendance report
    if (selectedType === 'attendance' && format === 'csv') {
      const rows = ['Student ID,Name,Class,Date,Status,Mode'];
      attendance.slice(0, 50).forEach(a => {
        rows.push(`${a.studentId},${a.studentName},${a.classId},${a.date},${a.status},${a.mode}`);
      });
      const csv = rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `attendance_report_${dateFrom}_${dateTo}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('CSV report downloaded');
    } else {
      toast.success(`${format.toUpperCase()} report generation started (demo)`);
    }
  }

  const rtype = REPORT_TYPES.find(r => r.id === selectedType);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><FileText size={20} className="text-primary" /> Reports</h1>
        <p className="text-sm text-muted-foreground">Generate and export school administration reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Report type picker */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Report Type</h2>
          {REPORT_TYPES.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedType(r.id)}
              className={`w-full text-left p-3 rounded-xl border transition-colors text-sm ${
                selectedType === r.id
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border hover:bg-muted'
              }`}
            >
              <div className="font-medium">{r.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{r.desc}</div>
            </button>
          ))}
        </div>

        {/* Config + preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-1.5"><Filter size={13} /> Report Configuration</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">From Date</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">To Date</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            {(selectedType === 'attendance' || selectedType === 'student') && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Class Filter</label>
                <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
                  className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="all">All Classes</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h2 className="text-sm font-semibold mb-3">{rtype?.label} — Preview</h2>
            <div className="border border-border rounded-lg overflow-hidden text-xs">
              <div className="bg-muted/50 px-3 py-2 font-medium border-b border-border">
                {rtype?.label} · {dateFrom} to {dateTo} {filterClass !== 'all' ? `· ${classes.find(c => c.id === filterClass)?.name}` : '· All Classes'}
              </div>
              <div className="p-3 space-y-1 text-muted-foreground max-h-48 overflow-y-auto">
                {selectedType === 'attendance' && attendance.slice(0, 15).map(a => (
                  <div key={a.id} className="flex gap-3">
                    <span className="w-24 truncate">{a.studentName}</span>
                    <span className="w-20">{a.date}</span>
                    <span className={a.status === 'present' ? 'text-emerald-600' : a.status === 'absent' ? 'text-red-600' : 'text-amber-600'}>{a.status}</span>
                  </div>
                ))}
                {selectedType === 'student' && students.slice(0, 15).map(s => (
                  <div key={s.id} className="flex gap-3">
                    <span className="w-28 truncate">{s.name}</span>
                    <span className="w-20">{s.studentId}</span>
                    <span>{s.className} {s.section}</span>
                    <span className={s.attendancePercentage < 75 ? 'text-red-600 ml-auto' : 'text-emerald-600 ml-auto'}>{s.attendancePercentage}%</span>
                  </div>
                ))}
                {selectedType === 'teacher' && teachers.slice(0, 12).map(t => (
                  <div key={t.id} className="flex gap-3">
                    <span className="w-32 truncate">{t.name}</span>
                    <span className="w-24">{t.department}</span>
                    <span className={t.workload >= 90 ? 'text-red-600 ml-auto' : 'ml-auto'}>{t.workload}%</span>
                  </div>
                ))}
                {!['attendance','student','teacher'].includes(selectedType) && (
                  <p>Preview data for {rtype?.label} will appear here.</p>
                )}
              </div>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => generateReport('csv')}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              <Download size={14} /> {generating ? 'Generating…' : 'Export CSV'}
            </button>
            <button
              onClick={() => generateReport('pdf')}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-md hover:bg-muted disabled:opacity-60 transition-colors"
            >
              <Download size={14} /> Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
