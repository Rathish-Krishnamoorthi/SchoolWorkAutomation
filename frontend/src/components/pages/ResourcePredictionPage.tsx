import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Activity, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const PRIORITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
};

function UtilBar({ current, predicted }: { current: number; predicted: number }) {
  return (
    <div className="space-y-1">
      <div>
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-muted-foreground">Current</span>
          <span className="font-medium">{current}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full', current >= 90 ? 'bg-red-500' : current >= 75 ? 'bg-amber-500' : 'bg-emerald-500')}
            style={{ width: `${current}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-0.5">
          <span className="text-muted-foreground">Predicted</span>
          <span className={cn('font-medium', predicted >= 90 ? 'text-red-600' : 'text-amber-600')}>{predicted}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className={cn('h-full rounded-full opacity-60', predicted >= 90 ? 'bg-red-500' : predicted >= 75 ? 'bg-amber-500' : 'bg-emerald-500')}
            style={{ width: `${predicted}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function ResourcePredictionPage() {
  const predictions = useAppStore(s => s.resourcePredictions);
  const rooms = useAppStore(s => s.rooms);
  const teachers = useAppStore(s => s.teachers);

  const teacherData = teachers.slice(0, 8).map(t => ({
    name: t.name.split(' ').slice(1).join(' '),
    current: t.workload,
    predicted: Math.min(100, t.workload + Math.round(Math.random() * 8)),
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Activity size={20} className="text-primary" /> Resource Prediction</h1>
        <p className="text-sm text-muted-foreground">AI-powered resource utilization forecasts and recommendations</p>
      </div>

      {/* AI insights */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-1.5"><Lightbulb size={14} className="text-amber-500" /> AI Insights</h2>
        {predictions.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{p.resourceName}</span>
                  <span className="text-xs text-muted-foreground">{p.resourceType}</span>
                  <span className={cn('px-2 py-0.5 text-xs rounded-full font-medium capitalize', PRIORITY_COLOR[p.priority])}>
                    {p.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{p.predictionMonth}</p>
              </div>
              {p.predictedUtilization >= 90 && <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />}
            </div>
            <UtilBar current={p.currentUtilization} predicted={p.predictedUtilization} />
            <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
              <Lightbulb size={11} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <span className="font-medium">Recommendation:</span> {p.recommendation}
                <span className="text-emerald-700 dark:text-emerald-400 font-medium ml-1">(+{p.expectedImprovement}% efficiency)</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Teacher workload chart */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="mb-3">
          <h2 className="text-sm font-semibold flex items-center gap-1.5"><TrendingUp size={14} className="text-primary" /> Teacher Workload Prediction</h2>
          <p className="text-xs text-muted-foreground">Current vs projected workload for next month</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={teacherData} layout="vertical" barSize={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={90} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 6, fontSize: 12 }}
              formatter={(v: unknown) => [`${v}%`]}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="current" name="Current %" fill="hsl(221 83% 53%)" radius={[0, 3, 3, 0]} />
            <Bar dataKey="predicted" name="Predicted %" fill="hsl(0 84% 60%)" radius={[0, 3, 3, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
