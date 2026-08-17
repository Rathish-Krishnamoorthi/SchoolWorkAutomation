import { useAppStore } from '@/store/useAppStore';
import { cn, formatDateTime } from '@/lib/utils';
import { ScrollText } from 'lucide-react';

const ACTION_COLOR: Record<string, string> = {
  APPROVE_DOCUMENT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  REJECT_DOCUMENT: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  UPLOAD_DOCUMENT: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  UPDATE_STUDENT: 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
  ADD_TEACHER: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400',
  GENERATE_TIMETABLE: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  MARK_ATTENDANCE: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
};

export default function AuditLogPage() {
  const logs = useAppStore(s => s.auditLogs);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><ScrollText size={20} className="text-primary" /> Audit Log</h1>
        <p className="text-sm text-muted-foreground">All administrative actions are recorded here</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Timestamp</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Entity</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-xs">{log.userName}</div>
                    {log.ipAddress && <div className="text-[10px] text-muted-foreground font-mono">{log.ipAddress}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 text-[10px] rounded-full font-semibold uppercase tracking-wide', ACTION_COLOR[log.action] ?? 'bg-muted text-muted-foreground')}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                    {log.entity} <span className="font-mono">{log.entityId}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground max-w-xs truncate">{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No audit records yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
