import { useEffect, useState, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import {
  CalendarDays, Wand2, AlertTriangle, CheckCircle2, Lock, Unlock,
  RefreshCw, Trash2, ChevronDown, ChevronUp, Sparkles, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Day, TimetableConflict } from '@/types';

// ── Schedule constants (must match backend) ────────────────────────────────
const DAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  { start: '08:30', end: '09:30', label: '08:30' },
  { start: '09:30', end: '10:30', label: '09:30' },
  { start: '10:30', end: '11:30', label: '10:30' },
  { start: '11:30', end: '12:30', label: '11:30' },
  { start: '13:30', end: '14:30', label: '13:30' },
  { start: '14:30', end: '15:30', label: '14:30' },
  { start: '15:30', end: '16:30', label: '15:30' },
];

// ── Subject colour palette ────────────────────────────────────────────────
const SUBJECT_COLORS: Record<string, string> = {
  Mathematics:        'bg-blue-50   text-blue-800   border-blue-200   dark:bg-blue-950/40   dark:text-blue-300   dark:border-blue-800',
  Physics:            'bg-violet-50  text-violet-800  border-violet-200  dark:bg-violet-950/40  dark:text-violet-300  dark:border-violet-800',
  Chemistry:          'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
  Biology:            'bg-teal-50    text-teal-800    border-teal-200    dark:bg-teal-950/40    dark:text-teal-300    dark:border-teal-800',
  English:            'bg-amber-50   text-amber-800   border-amber-200   dark:bg-amber-950/40   dark:text-amber-300   dark:border-amber-800',
  Tamil:              'bg-orange-50  text-orange-800  border-orange-200  dark:bg-orange-950/40  dark:text-orange-300  dark:border-orange-800',
  Hindi:              'bg-rose-50    text-rose-800    border-rose-200    dark:bg-rose-950/40    dark:text-rose-300    dark:border-rose-800',
  History:            'bg-orange-50  text-orange-800  border-orange-200  dark:bg-orange-950/40  dark:text-orange-300  dark:border-orange-800',
  'Computer Science': 'bg-indigo-50  text-indigo-800  border-indigo-200  dark:bg-indigo-950/40  dark:text-indigo-300  dark:border-indigo-800',
  'Physical Education':'bg-lime-50   text-lime-800   border-lime-200   dark:bg-lime-950/40   dark:text-lime-300   dark:border-lime-800',
  Economics:          'bg-cyan-50    text-cyan-800    border-cyan-200    dark:bg-cyan-950/40    dark:text-cyan-300    dark:border-cyan-800',
  Statistics:         'bg-sky-50     text-sky-800     border-sky-200     dark:bg-sky-950/40     dark:text-sky-300     dark:border-sky-800',
  'Social Science':   'bg-yellow-50  text-yellow-800  border-yellow-200  dark:bg-yellow-950/40  dark:text-yellow-300  dark:border-yellow-800',
};
const defaultColor = 'bg-muted text-foreground border-border';

function subjectColor(name: string) {
  // Match full name first, then first word
  if (SUBJECT_COLORS[name]) return SUBJECT_COLORS[name];
  const first = name.split(' ')[0];
  return SUBJECT_COLORS[first] ?? defaultColor;
}

// ── Step indicator ─────────────────────────────────────────────────────────
type Step = 'idle' | 'generating' | 'done';
const STEPS = [
  { key: 'fetching',    label: 'Fetching class & teacher data' },
  { key: 'solving',     label: 'Running constraint solver'     },
  { key: 'validating',  label: 'Validating assignments'        },
  { key: 'saving',      label: 'Persisting to database'        },
];

// ── Summary stats for a generated timetable ───────────────────────────────
function useSummary(
  periods: Array<{ teacherId: string; subjectName: string }>,
  teachers: ArrayLike<unknown>
) {
  const totalPeriods   = periods.length;
  const uniqueTeachers = new Set(periods.map(p => p.teacherId)).size;
  const uniqueSubjects = new Set(periods.map(p => p.subjectName)).size;
  const totalTeachers  = teachers.length || 1;
  const teacherUtil    = Math.round((uniqueTeachers / totalTeachers) * 100);
  return { totalPeriods, uniqueTeachers, uniqueSubjects, teacherUtil };
}

export default function TimetablePage() {
  const {
    periods, conflicts, classes, teachers,
    timetableLoading, timetableGenerated,
    loadPeriods, loadClasses, loadTeachers,
    generateTimetable, clearTimetable,
    togglePeriodLock, resolveConflict,
  } = useAppStore(useShallow(s => ({
    periods:             s.periods,
    conflicts:           s.conflicts,
    classes:             s.classes,
    teachers:            s.teachers,
    timetableLoading:    s.timetableLoading,
    timetableGenerated:  s.timetableGenerated,
    loadPeriods:         s.loadPeriods,
    loadClasses:         s.loadClasses,
    loadTeachers:        s.loadTeachers,
    generateTimetable:   s.generateTimetable,
    clearTimetable:      s.clearTimetable,
    togglePeriodLock:    s.togglePeriodLock,
    resolveConflict:     s.resolveConflict,
  })));

  const [selectedClassId, setSelectedClassId] = useState('');
  const [step, setStep]           = useState<Step>('idle');
  const [currentStep, setCurrentStep] = useState(-1);
  const [showConflicts, setShowConflicts] = useState(true);
  const [showWarnings, setShowWarnings]   = useState(false);
  const [warnings, setWarnings]   = useState<string[]>([]);
  const [genStats, setGenStats]   = useState<{ periodsCreated: number } | null>(null);

  const summary = useSummary(periods, teachers);
  const activeConflicts = conflicts.filter(c => !c.resolved);

  // Conflict quick-lookup
  const conflictPeriodIds = new Set(
    activeConflicts.flatMap(c => c.affectedPeriods)
  );

  // On mount: load classes, teachers, and any already-generated periods in parallel
  useEffect(() => {
    Promise.all([
      loadClasses(),
      loadTeachers(),
      loadPeriods(),
    ]).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If periods were already in DB when we loaded, show 'done' state immediately
  useEffect(() => {
    if (timetableGenerated && step === 'idle') {
      setStep('done');
    }
  }, [timetableGenerated, step]);

  // Auto-select first class once classes load
  useEffect(() => {
    if (classes.length > 0 && (!selectedClassId || !classes.some(c => c.id === selectedClassId))) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const hasTimetableData = timetableGenerated || periods.length > 0;

  // Grid data for the selected class
  const classPeriods = periods.filter(p => p.classId === selectedClassId);
  function getCellPeriod(day: Day, start: string) {
    return classPeriods.find(p => p.day === day && p.startTime === start);
  }

  // ── Generate handler ──────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setStep('generating');
    setCurrentStep(0);
    setGenStats(null);
    setWarnings([]);

    // Animate steps with staggered delays
    const stepTimings = [400, 800, 1200, 600];
    for (let i = 0; i < STEPS.length; i++) {
      await new Promise(r => setTimeout(r, stepTimings[i]));
      setCurrentStep(i);
    }

    try {
      const result = await generateTimetable('2025-26');
      setGenStats({ periodsCreated: result.periodsCreated });
      setWarnings(result.warnings);
      setStep('done');

      if (result.periodsCreated === 0) {
        toast.error('No periods generated — ensure classes and subjects are seeded');
      } else {
        toast.success(`Timetable generated — ${result.periodsCreated} periods across all classes`);
        if (result.conflicts.length > 0) {
          toast(`⚠ ${result.conflicts.length} conflict(s) detected`, { icon: '🔶' });
        }
      }
    } catch (err: any) {
      setStep('idle');
      toast.error(err.message ?? 'Generation failed — is the backend running?');
    }
    setCurrentStep(-1);
  }, [generateTimetable]);

  // ── Clear handler ──────────────────────────────────────────────────────
  const handleClear = useCallback(async () => {
    if (!window.confirm('Delete the entire generated timetable? Locked periods will be preserved.')) return;
    await clearTimetable('2025-26');
    setStep('idle');
    setGenStats(null);
    toast.success('Timetable cleared');
  }, [clearTimetable]);

  // ── Lock toggle ────────────────────────────────────────────────────────
  const handleLockToggle = useCallback(async (periodId: string, currentLocked: boolean) => {
    await togglePeriodLock(periodId, !currentLocked);
    toast.success(!currentLocked ? 'Period locked' : 'Period unlocked');
  }, [togglePeriodLock]);

  // ── Reload ─────────────────────────────────────────────────────────────
  const handleReload = useCallback(async () => {
    await loadPeriods('2025-26');
    toast.success('Timetable reloaded');
  }, [loadPeriods]);

  // ── Resolve conflict ───────────────────────────────────────────────────
  const handleResolve = useCallback((c: TimetableConflict) => {
    resolveConflict(c.id);
    toast.success('Conflict dismissed');
  }, [resolveConflict]);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <CalendarDays size={20} className="text-primary" />
            AI Timetable Generator
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automatically schedule all classes with zero conflicts using constraint-based AI
          </p>
        </div>

        <div className="flex gap-2 sm:ml-auto flex-wrap items-center">
          {hasTimetableData && (
            <>
              <button
                onClick={handleReload}
                disabled={timetableLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={timetableLoading ? 'animate-spin' : ''} />
                Reload
              </button>
              <button
                onClick={handleClear}
                disabled={timetableLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 text-red-600 dark:border-red-900 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} />
                Clear
              </button>
            </>
          )}
          <button
            onClick={handleGenerate}
            disabled={timetableLoading || step === 'generating'}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-60 transition-colors font-medium"
          >
            <Sparkles size={14} className={step === 'generating' ? 'animate-pulse' : ''} />
            {step === 'generating' ? 'Generating…' : hasTimetableData ? 'Re-generate' : 'Generate Timetable'}
          </button>
        </div>
      </div>

      {/* ── Empty state / Generate prompt ── */}
      {!hasTimetableData && step === 'idle' && (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Wand2 size={32} className="text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No timetable yet</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Click <strong>Generate Timetable</strong> to let the AI scheduler automatically
            assign subjects to time slots across all classes — respecting teacher availability,
            weekly period counts, and no double-bookings.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs text-muted-foreground">
            {[
              ['✅', 'No teacher conflicts'],
              ['✅', 'Balanced workload'],
              ['✅', 'Weekly period quotas'],
            ].map(([icon, text]) => (
              <div key={text} className="bg-muted/50 rounded-lg p-3">
                <div className="text-base mb-1">{icon}</div>
                {text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Generation progress ── */}
      {step === 'generating' && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles size={16} className="text-primary animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-semibold">AI Scheduler Running</div>
              <div className="text-xs text-muted-foreground">Solving constraints across all classes…</div>
            </div>
          </div>
          <div className="space-y-3">
            {STEPS.map((s, i) => {
              const done    = i < currentStep;
              const active  = i === currentStep;
              const pending = i > currentStep;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300',
                    done    && 'bg-emerald-500 text-white',
                    active  && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                    pending && 'bg-muted text-muted-foreground',
                  )}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={cn(
                    'text-sm transition-colors',
                    done    && 'text-emerald-600 dark:text-emerald-400 line-through opacity-60',
                    active  && 'text-foreground font-medium',
                    pending && 'text-muted-foreground',
                  )}>
                    {s.label}
                  </span>
                  {active && (
                    <div className="ml-auto flex gap-0.5">
                      {[0, 1, 2].map(d => (
                        <div key={d} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                          style={{ animationDelay: `${d * 150}ms` }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Generation result summary ── */}
      {step === 'done' && genStats && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Timetable Generated Successfully
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              [genStats.periodsCreated,       'Total Periods'],
              [summary.uniqueTeachers,         'Teachers Assigned'],
              [summary.uniqueSubjects,         'Subjects Covered'],
              [`${summary.teacherUtil}%`,      'Teacher Utilisation'],
            ].map(([val, label]) => (
              <div key={String(label)} className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{val}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
          {warnings.length > 0 && (
            <button
              onClick={() => setShowWarnings(v => !v)}
              className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline"
            >
              <Info size={12} />
              {warnings.length} scheduler warning{warnings.length > 1 ? 's' : ''}
              {showWarnings ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
          {showWarnings && warnings.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
              {warnings.map((w, i) => <li key={i} className="flex gap-1.5"><span className="opacity-50">•</span>{w}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* ── Conflicts panel ── */}
      {activeConflicts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-4">
          <button
            onClick={() => setShowConflicts(v => !v)}
            className="w-full flex items-center justify-between"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
              <AlertTriangle size={14} className="text-red-500" />
              {activeConflicts.length} Scheduling Conflict{activeConflicts.length > 1 ? 's' : ''} Detected
            </span>
            {showConflicts ? <ChevronUp size={14} className="text-red-400" /> : <ChevronDown size={14} className="text-red-400" />}
          </button>
          {showConflicts && (
            <div className="mt-3 space-y-2">
              {activeConflicts.map(c => (
                <div key={c.id} className="flex items-start gap-3 p-3 bg-white/60 dark:bg-black/20 rounded-lg">
                  <AlertTriangle
                    size={12}
                    className={cn('mt-0.5 flex-shrink-0', c.severity === 'critical' ? 'text-red-500' : 'text-amber-500')}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium capitalize">
                      {c.type.replace(/_/g, ' ')}
                      <span className="text-muted-foreground font-normal ml-1">— {c.day} {c.time}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>
                  </div>
                  <button
                    onClick={() => handleResolve(c)}
                    className="text-xs text-primary hover:underline flex-shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Timetable grid ── */}
      {hasTimetableData && periods.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Class selector bar */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Viewing class:</span>
            <div className="flex flex-wrap gap-1.5">
              {classes.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-full border transition-colors',
                    selectedClassId === c.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50 hover:bg-muted',
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {selectedClass && (
              <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
                Teacher: <strong>{selectedClass.classTeacherName || '—'}</strong>
                &nbsp;·&nbsp;{selectedClass.studentCount} students
              </span>
            )}
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/20">
                  <th className="text-left px-3 py-2.5 font-medium text-muted-foreground w-14 border-b border-border">
                    Time
                  </th>
                  {DAYS.map(day => (
                    <th key={day} className="text-left px-3 py-2.5 font-medium text-muted-foreground border-b border-border min-w-[130px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot, rowIdx) => (
                  <tr key={slot.start} className={cn('border-b border-border/40', rowIdx % 2 === 0 ? '' : 'bg-muted/10')}>
                    <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground font-medium whitespace-nowrap align-top pt-3">
                      {slot.label}
                    </td>
                    {DAYS.map(day => {
                      const p = getCellPeriod(day, slot.start);
                      const hasConflict = p ? conflictPeriodIds.has(p.id) : false;
                      const color = p ? subjectColor(p.subjectName) : '';
                      return (
                        <td key={day} className="px-1.5 py-1.5 align-top">
                          {p ? (
                            <div className={cn(
                              'group relative p-2 rounded-lg border text-xs leading-snug transition-all',
                              color,
                              hasConflict && 'ring-2 ring-red-500 ring-offset-1',
                            )}>
                              {/* Subject */}
                              <div className="font-semibold flex items-center gap-1 pr-5">
                                {p.locked && <Lock size={9} className="flex-shrink-0 opacity-70" />}
                                <span className="truncate">{p.subjectName}</span>
                                {hasConflict && (
                                  <AlertTriangle size={9} className="text-red-500 flex-shrink-0 ml-auto" />
                                )}
                              </div>
                              {/* Teacher */}
                              <div className="opacity-70 mt-0.5 truncate">
                                {p.teacherName.split(' ').slice(0, 3).join(' ')}
                              </div>
                              {/* Lock toggle button */}
                              <button
                                onClick={() => handleLockToggle(p.id, !!p.locked)}
                                title={p.locked ? 'Unlock period' : 'Lock period'}
                                className={cn(
                                  'absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity',
                                  'w-5 h-5 rounded flex items-center justify-center',
                                  'bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20',
                                )}
                              >
                                {p.locked
                                  ? <Unlock size={9} />
                                  : <Lock size={9} />}
                              </button>
                            </div>
                          ) : (
                            <div className="h-[58px] flex items-center justify-center text-muted-foreground/25 text-lg">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer legend */}
          <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center gap-4 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Lock size={10} /> Hover a cell to lock/unlock it
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-3 h-3 rounded ring-2 ring-red-500 inline-block" /> Conflict detected
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {classPeriods.length} periods this week · {classPeriods.filter(p => p.locked).length} locked
            </span>
          </div>
        </div>
      )}

      {/* ── All-classes overview ── */}
      {hasTimetableData && periods.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/20">
            <h2 className="text-sm font-semibold">All Classes — Weekly Period Summary</h2>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {classes.map(cls => {
              const cp = periods.filter(p => p.classId === cls.id);
              const subjects = [...new Set(cp.map(p => p.subjectName))];
              return (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  className={cn(
                    'text-left p-3 rounded-xl border transition-all',
                    selectedClassId === cls.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/40',
                  )}
                >
                  <div className="font-semibold text-xs mb-1">{cls.name}</div>
                  <div className="text-[11px] text-muted-foreground mb-2">
                    {cp.length} periods · {subjects.length} subjects
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {subjects.slice(0, 5).map(s => (
                      <span key={s} className={cn('text-[10px] px-1.5 py-0.5 rounded-full border', subjectColor(s))}>
                        {s.length > 8 ? s.slice(0, 8) + '…' : s}
                      </span>
                    ))}
                    {subjects.length > 5 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-border text-muted-foreground">
                        +{subjects.length - 5}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
