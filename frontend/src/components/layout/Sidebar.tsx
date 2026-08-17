import { NavLink, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, BookMarked,
  CalendarDays, ClipboardList, Brain, Wand2, BarChart3, Bell,
  FileText, Settings, ChevronLeft, ChevronRight, Layers,
  FlaskConical, Bot, Activity, ScrollText
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  to: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    group: '',
    items: [
      { label: 'Dashboard', icon: <LayoutDashboard size={16} />, to: '/dashboard' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Students', icon: <GraduationCap size={16} />, to: '/students' },
      { label: 'Teachers', icon: <Users size={16} />, to: '/teachers' },
      { label: 'Classes', icon: <Layers size={16} />, to: '/classes' },
      { label: 'Subjects', icon: <BookOpen size={16} />, to: '/subjects' },
      { label: 'Timetable', icon: <CalendarDays size={16} />, to: '/timetable' },
      { label: 'Attendance', icon: <ClipboardList size={16} />, to: '/attendance' },
    ],
  },
  {
    group: 'AI Automation',
    items: [
      { label: 'Document AI', icon: <Brain size={16} />, to: '/document-ai' },
      { label: 'AI Paper Correction', icon: <FileText size={16} />, to: '/ai-paper-correction' },
      { label: 'Timetable Optimizer', icon: <Wand2 size={16} />, to: '/timetable' },
      { label: 'Resource Prediction', icon: <Activity size={16} />, to: '/resource-prediction' },
      { label: 'AI Assistant', icon: <Bot size={16} />, to: '/ai-assistant' },
    ],
  },
  {
    group: 'Insights',
    items: [
      { label: 'Analytics', icon: <BarChart3 size={16} />, to: '/analytics' },
      { label: 'Reports', icon: <FileText size={16} />, to: '/reports' },
      { label: 'Audit Log', icon: <ScrollText size={16} />, to: '/audit-log' },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Notifications', icon: <Bell size={16} />, to: '/notifications' },
      { label: 'Settings', icon: <Settings size={16} />, to: '/settings' },
    ],
  },
];

export default function Sidebar() {
  const collapsed = useAppStore(s => s.sidebarCollapsed);
  const toggleSidebar = useAppStore(s => s.toggleSidebar);
  const notifications = useAppStore(s => s.notifications);
  const unread = notifications.filter(n => !n.read).length;
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed lg:relative z-30 flex flex-col h-full transition-all duration-300',
          'bg-sidebar text-sidebar-foreground border-r border-sidebar-border',
          collapsed ? 'w-0 lg:w-14 overflow-hidden' : 'w-64',
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <GraduationCap size={14} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white leading-tight">EduCore ERP</div>
              <div className="text-[10px] text-sidebar-foreground/50 leading-tight">Smart School Admin</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
          {NAV.map(group => (
            <div key={group.group} className="mb-1">
              {group.group && !collapsed && (
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                  {group.group}
                </div>
              )}
              {group.items.map(item => {
                const isActive = location.pathname === item.to ||
                  (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
                // De-dup: only show Timetable Optimizer if not already shown by Timetable
                if (item.label === 'Timetable Optimizer') return null;

                return (
                  <NavLink
                    key={item.label + item.to}
                    to={item.to}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 mx-1 rounded-md text-sm transition-colors relative',
                      isActive
                        ? 'bg-sidebar-accent text-white font-medium'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && item.label === 'Notifications' && unread > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Toggle */}
        <div className="border-t border-sidebar-border p-2 flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center p-2 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={14} /> : (
              <span className="flex items-center gap-2 text-xs">
                <ChevronLeft size={14} /> Collapse
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
