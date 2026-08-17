import { useAppStore } from '@/store/useAppStore';
import { cn, formatDateTime } from '@/lib/utils';
import { Bell, Check, CheckCheck, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AlertSeverity } from '@/types';

const SEV_CONFIG: Record<AlertSeverity, { dot: string; icon: React.ReactNode }> = {
  critical: { dot: 'bg-red-500', icon: <AlertTriangle size={12} className="text-red-500" /> },
  warning: { dot: 'bg-amber-500', icon: <AlertTriangle size={12} className="text-amber-500" /> },
  info: { dot: 'bg-blue-500', icon: <Info size={12} className="text-blue-500" /> },
};

export default function NotificationsPage() {
  const notifications = useAppStore(s => s.notifications);
  const markNotificationRead = useAppStore(s => s.markNotificationRead);
  const markAllNotificationsRead = useAppStore(s => s.markAllNotificationsRead);
  const navigate = useNavigate();

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Bell size={20} className="text-primary" /> Notifications</h1>
          <p className="text-sm text-muted-foreground">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button onClick={markAllNotificationsRead} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map(n => {
          const config = SEV_CONFIG[n.severity] ?? SEV_CONFIG.info;
          return (
            <div
              key={n.id}
              className={cn(
                'bg-card border rounded-xl p-4 transition-colors',
                !n.read ? 'border-primary/30 bg-primary/5' : 'border-border',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm flex items-center gap-2">
                      {n.title}
                      {!n.read && <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />}
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{formatDateTime(n.createdAt)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {n.actionLabel && n.actionRoute && (
                      <button
                        onClick={() => { markNotificationRead(n.id); navigate(n.actionRoute!); }}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {n.actionLabel} <ArrowRight size={10} />
                      </button>
                    )}
                    {!n.read && (
                      <button onClick={() => markNotificationRead(n.id)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <Check size={10} /> Mark read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell size={32} className="mx-auto mb-2 opacity-30" />
            <p>No notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
