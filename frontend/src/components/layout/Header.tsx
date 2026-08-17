import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { cn, getInitials } from '@/lib/utils';
import {
  Menu, Search, Bell, Sun, Moon, LogOut, X, GraduationCap, Users, BookOpen
} from 'lucide-react';

export default function Header() {
  const user = useAppStore(s => s.user);
  const theme = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);
  const toggleSidebar = useAppStore(s => s.toggleSidebar);
  const logout = useAppStore(s => s.logout);
  const notifications = useAppStore(s => s.notifications);
  const students = useAppStore(s => s.students);
  const teachers = useAppStore(s => s.teachers);
  const subjects = useAppStore(s => s.subjects);
  const unread = notifications.filter(n => !n.read).length;

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const searchResults = search.trim().length >= 2 ? [
    ...students.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 3).map(s => ({
      type: 'Student', label: s.name, sub: `${s.className} — ${s.attendancePercentage}%`, route: '/students', icon: <GraduationCap size={12} />
    })),
    ...teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase())).slice(0, 2).map(t => ({
      type: 'Teacher', label: t.name, sub: t.department, route: '/teachers', icon: <Users size={12} />
    })),
    ...subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 2).map(s => ({
      type: 'Subject', label: s.name, sub: s.teacherName, route: '/subjects', icon: <BookOpen size={12} />
    })),
  ] : [];

  return (
    <header className="flex items-center h-14 px-4 gap-3 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
      {/* Hamburger */}
      <button
        onClick={toggleSidebar}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu size={18} />
      </button>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            placeholder="Search students, teachers, subjects…"
            className="w-full h-8 pl-8 pr-3 text-sm bg-muted rounded-md border border-transparent focus:border-ring focus:ring-1 focus:ring-ring focus:outline-none placeholder:text-muted-foreground"
          />
          {search && (
            <button onClick={() => { setSearch(''); setShowSearch(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in">
            {searchResults.map((r, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0"
                onClick={() => { navigate(r.route); setShowSearch(false); setSearch(''); }}
              >
                <span className="p-1 rounded bg-primary/10 text-primary">{r.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.label}</div>
                  <div className="text-xs text-muted-foreground">{r.type} · {r.sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setShowUser(!showUser)}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center">
              {user ? getInitials(user.name) : 'A'}
            </div>
            <span className="hidden md:block text-sm font-medium">{user?.name ?? 'Admin'}</span>
          </button>
          {showUser && (
            <div className="absolute right-0 top-full mt-1 w-44 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in">
              <div className="px-3 py-2.5 border-b border-border">
                <div className="text-sm font-medium">{user?.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</div>
              </div>
              <button
                onClick={() => { logout(); navigate('/login'); setShowUser(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
