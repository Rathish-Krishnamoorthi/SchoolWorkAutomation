import { useAppStore } from '@/store/useAppStore';
import { Settings, Sun, Moon, Bell, Shield, Database } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const theme = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const user = useAppStore(s => s.user);

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Settings size={20} className="text-primary" /> Settings</h1>
        <p className="text-sm text-muted-foreground">Manage application preferences</p>
      </div>

      {/* Appearance */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Sun size={14} /> Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Dark Mode</div>
            <div className="text-xs text-muted-foreground">Switch between light and dark themes</div>
          </div>
          <button
            onClick={toggleTheme}
            className={cn(
              'w-10 h-5.5 rounded-full border-2 transition-colors relative flex items-center',
              theme === 'dark' ? 'bg-primary border-primary' : 'bg-muted border-border',
            )}
            style={{ height: 22 }}
          >
            <span className={cn(
              'w-3.5 h-3.5 rounded-full bg-white transition-transform absolute',
              theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5',
            )} />
          </button>
        </div>
      </div>

      {/* Account */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Shield size={14} /> Account</h2>
        <div className="space-y-2">
          {[
            { label: 'Name', value: user?.name ?? 'Admin' },
            { label: 'Email', value: user?.email ?? 'admin@school.edu' },
            { label: 'Role', value: user?.role?.replace('_', ' ') ?? 'admin' },
          ].map(f => (
            <div key={f.label} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
              <span className="text-sm text-muted-foreground">{f.label}</span>
              <span className="text-sm font-medium capitalize">{f.value}</span>
            </div>
          ))}
        </div>
        <button onClick={() => toast('Password reset email sent (demo)')} className="text-sm text-primary hover:underline">
          Change Password
        </button>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Bell size={14} /> Notification Preferences</h2>
        {[
          ['Timetable Conflicts', true],
          ['Low Attendance Alerts', true],
          ['Document Processing', true],
          ['Teacher Workload Warnings', false],
          ['AI Recommendations', true],
        ].map(([label, def]) => (
          <div key={label as string} className="flex items-center justify-between">
            <span className="text-sm">{label as string}</span>
            <button
              onClick={() => toast(`${label} preference updated (demo)`)}
              className={cn(
                'w-9 rounded-full border-2 transition-colors relative flex items-center',
                def ? 'bg-primary border-primary' : 'bg-muted border-border',
              )}
              style={{ height: 20 }}
            >
              <span className={cn(
                'w-3 h-3 rounded-full bg-white transition-transform absolute',
                def ? 'translate-x-3.5' : 'translate-x-0.5',
              )} />
            </button>
          </div>
        ))}
      </div>

      {/* Data */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2"><Database size={14} /> Data Management</h2>
        <p className="text-xs text-muted-foreground">Application state is persisted in browser local storage. In production, all data is stored in PostgreSQL.</p>
        <button
          onClick={() => { localStorage.removeItem('school-erp-store'); toast.success('Local data cleared — reload to reset to demo data'); }}
          className="text-sm text-destructive hover:underline"
        >
          Clear Local Data
        </button>
      </div>
    </div>
  );
}
