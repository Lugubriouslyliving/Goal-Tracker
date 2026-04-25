import { useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useStore, selectGrandTotalXP } from '../store';
import { formatDate, selectStreak, categoryHex, ACHIEVEMENT_DEFS } from '../utils';
import type { Category } from '../types';

export default function Stats() {
  const { logs, goals, unlockedAchievements, pomodorosCompleted } = useStore();

  const totalXP = selectGrandTotalXP(logs, goals);
  const streak = selectStreak(logs);
  const completedGoals = goals.filter((g) => g.completed).length;
  const unlockedSet = new Set(unlockedAchievements.map((a) => a.id));

  const heatmap = useMemo(() => {
    const logsByDate = new Map<string, number>();
    logs.forEach((l) => logsByDate.set(l.date, (logsByDate.get(l.date) || 0) + l.xpEarned));
    const today = new Date();
    return Array.from({ length: 84 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (83 - i));
      const date = formatDate(d);
      return { date, xp: logsByDate.get(date) || 0 };
    });
  }, [logs]);

  const weeklyXP = useMemo(() =>
    Array.from({ length: 8 }, (_, w) => {
      const end = new Date();
      end.setDate(end.getDate() - w * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      const xp = logs
        .filter((l) => l.date >= formatDate(start) && l.date <= formatDate(end))
        .reduce((s, l) => s + l.xpEarned, 0);
      return { week: w === 0 ? 'Now' : `-${w}w`, xp };
    }).reverse(),
  [logs]);

  const categoryData = useMemo(() => {
    const counts: Partial<Record<Category, number>> = {};
    logs.forEach((l) => { counts[l.category] = (counts[l.category] || 0) + l.xpEarned; });
    return Object.entries(counts).map(([name, value]) => ({ name, value: value as number }));
  }, [logs]);

  const dayOfWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = Array(7).fill(0);
    logs.forEach((l) => { counts[new Date(l.date + 'T00:00:00').getDay()] += l.xpEarned; });
    return days.map((day, i) => ({ day, xp: counts[i] }));
  }, [logs]);

  const heatColor = (xp: number) => {
    if (xp === 0) return '#27272a';
    if (xp < 50) return '#14532d';
    if (xp < 100) return '#166534';
    if (xp < 200) return '#16a34a';
    return '#22c55e';
  };

  const tooltipStyle = {
    contentStyle: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', fontSize: 12 },
    labelStyle: { color: '#a1a1aa' },
    itemStyle: { color: '#d4d4d8' },
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold text-zinc-100 mb-6">Stats</h2>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total XP',        value: totalXP.toLocaleString() },
          { label: 'Total Logs',      value: logs.length.toString() },
          { label: 'Current Streak',  value: `${streak}d` },
          { label: 'Goals Completed', value: completedGoals.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4 text-center">
            <div className="text-2xl font-semibold text-zinc-100">{value}</div>
            <div className="text-xs text-zinc-600 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4 mb-5">
        <h3 className="text-sm text-zinc-400 mb-4">Activity — last 12 weeks</h3>
        <div className="flex gap-1">
          {Array.from({ length: 12 }, (_, week) => (
            <div key={week} className="flex flex-col gap-1">
              {heatmap.slice(week * 7, week * 7 + 7).map((day) => (
                <div
                  key={day.date}
                  title={`${day.date}: ${day.xp} XP`}
                  className="w-3.5 h-3.5 rounded-sm cursor-default"
                  style={{ background: heatColor(day.xp) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-xs text-zinc-600">
          <span>Less</span>
          {[0, 30, 80, 150, 250].map((xp) => (
            <div key={xp} className="w-3 h-3 rounded-sm" style={{ background: heatColor(xp) }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4">
          <h3 className="text-sm text-zinc-400 mb-3">Weekly XP</h3>
          {logs.length === 0 ? (
            <p className="text-xs text-zinc-700 text-center py-10">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={weeklyXP} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <XAxis dataKey="week" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} XP`, 'XP']} />
                <Bar dataKey="xp" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4">
          <h3 className="text-sm text-zinc-400 mb-3">By Category</h3>
          {categoryData.length === 0 ? (
            <p className="text-xs text-zinc-700 text-center py-10">No data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={110}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={2} dataKey="value">
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={categoryHex[entry.name as Category] || '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} XP`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                {categoryData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <div className="w-2 h-2 rounded-full" style={{ background: categoryHex[entry.name as Category] }} />
                    {entry.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4 mb-5">
        <h3 className="text-sm text-zinc-400 mb-3">XP by Day of Week</h3>
        {logs.length === 0 ? (
          <p className="text-xs text-zinc-700 text-center py-8">No data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={dayOfWeekData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <XAxis dataKey="day" tick={{ fill: '#52525b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} XP`, 'XP']} />
              <Bar dataKey="xp" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Achievements */}
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm text-zinc-400">Achievements</h3>
          <span className="text-xs text-zinc-600">
            {unlockedAchievements.length} / {ACHIEVEMENT_DEFS.length} unlocked
            {pomodorosCompleted > 0 && <span className="ml-2 text-zinc-700">· {pomodorosCompleted} 🍅</span>}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {ACHIEVEMENT_DEFS.map((def) => {
            const unlock = unlockedAchievements.find((a) => a.id === def.id);
            return (
              <div
                key={def.id}
                className={`p-3 rounded-lg border transition-colors ${
                  unlock ? 'bg-zinc-800/80 border-zinc-700' : 'border-zinc-800/60 opacity-35'
                }`}
              >
                <div className="text-2xl mb-1.5">{def.icon}</div>
                <div className="text-xs font-medium text-zinc-200">{def.label}</div>
                <div className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{def.desc}</div>
                {unlock && (
                  <div className="text-xs text-emerald-700 mt-1.5">
                    {new Date(unlock.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
