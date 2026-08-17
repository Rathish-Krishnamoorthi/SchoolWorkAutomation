import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import {
  GraduationCap, Users, Layers, ClipboardList, FileText,
  AlertTriangle, CheckCircle2, Info, ArrowRight, Activity,
  Clock, TrendingUp, TrendingDown, BookOpen, Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { DEMO_ATTENDANCE_TREND } from '@/data/demoData';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function KpiCard({ title, value, sub, icon, color, onClick, trend }: {
  title: string; value: string | number; sub?: string; icon: React.ReactNode;
  color: string; onClick?: () => void; trend?: 'up' | 'down';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 p-4 bg-card border border-border rounded-xl text-left transition-all',
        'hover:shadow-sm hover:border-primary/30 active:scale-[0.98]',
        onClick ? 'cursor-pointer' : 'cursor-default',
      )}
    >
      <div className={cn('p-2 rounded-lg flex-shrink-0', color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold leading-tight">{value}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{title}</div>
        {sub && (
          <div className={cn('text-xs mt-0.5 flex items-center gap-0.5',
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {trend === 'up' && <TrendingUp size={10} />}
            {trend === 'down' && <TrendingDown size={10} />}
            {sub}
          </div>
        )}
      </div>
    </button>
  );
}

function AlertCard({ alert, onResolve }: { alert: import('@/types').Alert; onResolve: () => void }) {
  const navigate = useNavigate();
  const colorMap = {
    critical: 'border-red-500/40 bg-red-50/50 dark:bg-red-950/20',
    warning: 'border-amber-500/40 bg-amber-50/50 dark:bg-amber-950/20',
    info: 'border-blue-500/40 bg-blue-50/50 dark:bg-blue-950/20',
  };
  const iconMap = {
    critical: <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />,
    warning: <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />,
    info: <Info size={14} className="text-blue-500 flex-shrink-0" />,
  };

  return (
    <div className={cn('p-3 rounded-lg border', colorMap[alert.severity])}>
      <div className="flex items-start gap-2">
        {iconMap[alert.severity]}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium">{alert.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.description}</div>
        </div>
      </div>
      {alert.actionLabel && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => navigate(alert.actionRoute || '/')}
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            {alert.actionLabel} <ArrowRight size={10} />
          </button>
          <button
            onClick={onResolve}
            className="text-xs text-muted-foreground hover:text-foreground ml-auto"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAppStore(s => s.user);
  const students = useAppStore(s => s.students);
  const teachers = useAppStore(s => s.teachers);
  const classes = useAppStore(s => s.classes);
  const documents = useAppStore(s => s.documents);
  const alerts = useAppStore(s => s.alerts);
  const resolveAlert = useAppStore(s => s.resolveAlert);
  const periods = useAppStore(s => s.periods);

  const now = new Date();
  const dateStr = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const activeAlerts = alerts.filter(a => !a.resolved);
  const pendingDocs = documents.filter(d => d.status === 'pending_approval').length;
  const todayPresent = 1204;
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const todayPeriods = periods.filter(p => p.day === 'Monday').slice(0, 6);

  // Weekly attendance chart data
  const chartData = DEMO_ATTENDANCE_TREND.slice(-7).map(d => ({
    date: d.date.slice(5),
    attendance: d.percentage,
  }));

  // Class-wise attendance
  const classAttendance = classes.slice(0, 6).map(c => ({
    name: c.name.replace('Grade ', 'G').replace(' - ', '-'),
    value: Math.round(90 + Math.random() * 8),
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{getGreeting()}, {user?.name ?? 'Admin'}</h1>
          <p className="text-sm text-muted-foreground">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 rounded-lg px-3 py-1.5 text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Wifi size={12} />
          School Status: Operational
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Total Students" value={totalStudents} icon={<GraduationCap size={16} className="text-blue-600" />} color="bg-blue-100 dark:bg-blue-950/50" onClick={() => navigate('/students')} sub="+3 this week" trend="up" />
        <KpiCard title="Teachers" value={totalTeachers} icon={<Users size={16} className="text-violet-600" />} color="bg-violet-100 dark:bg-violet-950/50" onClick={() => navigate('/teachers')} sub="10 active today" />
        <KpiCard title="Classes" value={classes.length} icon={<Layers size={16} className="text-indigo-600" />} color="bg-indigo-100 dark:bg-indigo-950/50" onClick={() => navigate('/classes')} />
        <KpiCard title="Attendance Today" value={`${94.2}%`} icon={<ClipboardList size={16} className="text-emerald-600" />} color="bg-emerald-100 dark:bg-emerald-950/50" onClick={() => navigate('/attendance')} sub={`${todayPresent.toLocaleString()} present`} trend="up" />
        <KpiCard title="Pending Docs" value={pendingDocs} icon={<FileText size={16} className="text-amber-600" />} color="bg-amber-100 dark:bg-amber-950/50" onClick={() => navigate('/document-ai')} sub="Needs review" />
        <KpiCard
          title="Active Alerts"
          value={activeAlerts.length}
          icon={<AlertTriangle size={16} className={activeAlerts.length > 2 ? 'text-red-600' : 'text-amber-600'} />}
          color={activeAlerts.length > 2 ? 'bg-red-100 dark:bg-red-950/50' : 'bg-amber-100 dark:bg-amber-950/50'}
          sub={activeAlerts.filter(a => a.severity === 'critical').length + ' critical'}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Alerts panel — left */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-red-500" />
              Operational Alerts
              {activeAlerts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 text-[10px] font-bold">
                  {activeAlerts.length}
                </span>
              )}
            </h2>
          </div>
          {activeAlerts.length === 0 ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg text-center">
              <CheckCircle2 size={20} className="text-emerald-500 mx-auto mb-1" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">All clear</p>
              <p className="text-xs text-muted-foreground">No pending alerts</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onResolve={() => resolveAlert(alert.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Attendance chart — center + right */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold">Attendance Trend</h2>
                <p className="text-xs text-muted-foreground">Last 7 school days</p>
              </div>
              <button onClick={() => navigate('/analytics')} className="text-xs text-primary hover:underline flex items-center gap-1">
                Full analytics <ArrowRight size={10} />
              </button>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221 83% 53%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[85, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
                  formatter={(v: unknown) => [`${v}%`, 'Attendance']}
                />
                <Area type="monotone" dataKey="attendance" stroke="hsl(221 83% 53%)" fill="url(#attGrad)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(221 83% 53%)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Class-wise bar */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Class-wise Attendance Today</h2>
            </div>
            <ResponsiveContainer width="100%" height={130}>
              <BarChart data={classAttendance} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis domain={[75, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
                  formatter={(v: unknown) => [`${v}%`, 'Attendance']}
                />
                <Bar dataKey="value" fill="hsl(221 83% 53%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Today's operations + upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Today summary */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Activity size={14} className="text-primary" /> Today's Operations
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Classes', value: classes.length, icon: <Layers size={13} /> },
              { label: 'Teachers Present', value: 38, icon: <Users size={13} /> },
              { label: 'Students Present', value: todayPresent.toLocaleString(), icon: <GraduationCap size={13} /> },
              { label: 'Attendance', value: '94.2%', icon: <ClipboardList size={13} /> },
              { label: 'Documents', value: `${pendingDocs} Pending`, icon: <FileText size={13} /> },
              { label: 'Active Alerts', value: activeAlerts.length, icon: <AlertTriangle size={13} /> },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                <span className="text-muted-foreground">{item.icon}</span>
                <div>
                  <div className="text-base font-bold leading-tight">{item.value}</div>
                  <div className="text-[10px] text-muted-foreground">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming periods */}
        <div className="bg-card border border-border rounded-xl p-4">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Clock size={14} className="text-primary" /> Today's Schedule (Grade 10-A)
          </h2>
          <div className="space-y-2">
            {todayPeriods.length === 0 ? (
              <p className="text-sm text-muted-foreground">No periods scheduled</p>
            ) : (
              todayPeriods.map(p => (
                <div key={p.id} className="flex items-center gap-3 py-1.5 border-b border-border/50 last:border-0">
                  <div className="w-16 text-xs font-mono text-muted-foreground flex-shrink-0">{p.startTime}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{p.subjectName}</div>
                    <div className="text-xs text-muted-foreground">{p.teacherName} · {p.roomName}</div>
                  </div>
                  <div className="text-xs text-muted-foreground hidden sm:block">{p.endTime}</div>
                </div>
              ))
            )}
          </div>
          <button
            onClick={() => navigate('/timetable')}
            className="mt-3 text-xs text-primary hover:underline flex items-center gap-1"
          >
            Full timetable <ArrowRight size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
