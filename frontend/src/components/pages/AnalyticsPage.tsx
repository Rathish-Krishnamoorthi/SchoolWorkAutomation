import { useAppStore } from '@/store/useAppStore';
import { BarChart3 } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { DEMO_ATTENDANCE_TREND } from '@/data/demoData';

const COLORS = ['hsl(221 83% 53%)', 'hsl(160 60% 45%)', 'hsl(35 90% 55%)', 'hsl(280 60% 55%)'];

export default function AnalyticsPage() {
  const teachers = useAppStore(s => s.teachers);
  const documents = useAppStore(s => s.documents);

  const teacherWorkload = teachers.slice(0, 8).map(t => ({
    name: t.name.split(' ').slice(1).join(' '),
    workload: t.workload,
    classes: t.classes.length,
  }));

  const docStats = [
    { name: 'Approved', value: documents.filter(d => d.status === 'approved').length },
    { name: 'Pending', value: documents.filter(d => d.status === 'pending_approval').length },
    { name: 'Processing', value: documents.filter(d => d.status === 'processing').length },
    { name: 'Rejected', value: documents.filter(d => d.status === 'rejected').length },
  ].filter(d => d.value > 0);

  const attendanceTrend = DEMO_ATTENDANCE_TREND.map(d => ({
    date: d.date.slice(5),
    percentage: d.percentage,
    present: d.present,
    absent: d.absent,
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><BarChart3 size={20} className="text-primary" /> Analytics</h1>
        <p className="text-sm text-muted-foreground">School performance metrics and trends</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attendance trend */}
        <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold mb-3">Daily Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={attendanceTrend}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[85, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
                formatter={(v: unknown) => [`${v}%`, 'Attendance']} />
              <Area type="monotone" dataKey="percentage" stroke="hsl(221 83% 53%)" fill="url(#grad1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Teacher workload */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Teacher Workload</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={teacherWorkload} layout="vertical" barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" domain={[0,100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={80} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
                formatter={(v: unknown) => [`${v}%`, 'Workload']} />
              <Bar dataKey="workload" fill="hsl(221 83% 53%)" radius={[0,3,3,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Documents pie */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3">Document Processing Status</h2>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={150} height={150}>
              <PieChart>
                <Pie data={docStats} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                  {docStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {docStats.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2 text-sm">
                  <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-medium ml-auto pl-2">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Present/absent */}
        <div className="bg-card border border-border rounded-xl p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold mb-3">Present vs Absent — Last 11 Days</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={attendanceTrend} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="present" name="Present" fill="hsl(160 60% 45%)" radius={[2,2,0,0]} stackId="a" />
              <Bar dataKey="absent" name="Absent" fill="hsl(0 84% 60%)" radius={[2,2,0,0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
