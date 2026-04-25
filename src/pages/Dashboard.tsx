import { Zap, Flame, BookOpen, Trophy, ArrowRight } from 'lucide-react';
import { useStore, selectAvailableXP, selectGrandTotalXP } from '../store';
import { formatDate, getGreeting, categoryBadge, selectLevel, selectXPInLevel, selectStreak } from '../utils';
import type { Page } from '../App';

interface Props {
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ onNavigate }: Props) {
  const { logs, goals, rewards } = useStore();

  const today = formatDate(new Date());
  const todayLogs = logs.filter((l) => l.date === today);
  const grandTotal = selectGrandTotalXP(logs, goals);
  const available = selectAvailableXP(logs, goals, rewards);
  const level = selectLevel(grandTotal);
  const xpInLevel = selectXPInLevel(grandTotal);
  const streak = selectStreak(logs);
  const activeGoals = goals.filter((g) => !g.completed).slice(0, 3);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-7">
        <h2 className="text-2xl font-semibold text-zinc-100">{getGreeting()}</h2>
        <p className="text-zinc-500 mt-1 text-sm">Here's your progress overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard
          label="Level"
          value={`Lv. ${level}`}
          sub={`${xpInLevel} / 500 XP`}
          icon={<Trophy size={16} className="text-yellow-500" />}
        />
        <StatCard
          label="Available XP"
          value={available.toLocaleString()}
          sub="spend on rewards"
          icon={<Zap size={16} className="text-emerald-500" />}
        />
        <StatCard
          label="Streak"
          value={`${streak}d`}
          sub="consecutive days"
          icon={<Flame size={16} className="text-orange-500" />}
        />
        <StatCard
          label="Today"
          value={`${todayLogs.length}`}
          sub="activities logged"
          icon={<BookOpen size={16} className="text-blue-400" />}
        />
      </div>

      {/* XP level progress bar */}
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500">Level {level}</span>
          <span className="text-xs text-zinc-500">Level {level + 1}</span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${(xpInLevel / 500) * 100}%` }}
          />
        </div>
        <p className="text-xs text-zinc-600 mt-2">{500 - xpInLevel} XP to level {level + 1}</p>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-4">
        {/* Today's Activities */}
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-300">Today's Activities</h3>
            <button
              onClick={() => onNavigate('log')}
              className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              + Add <ArrowRight size={11} />
            </button>
          </div>
          {todayLogs.length === 0 ? (
            <p className="text-xs text-zinc-600 py-6 text-center">Nothing logged yet today.</p>
          ) : (
            <div className="space-y-2">
              {todayLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${categoryBadge(log.category)}`}>
                      {log.category}
                    </span>
                    <span className="text-sm text-zinc-300 truncate">{log.activityName}</span>
                  </div>
                  <span className="text-xs text-emerald-500 flex-shrink-0">+{log.xpEarned}</span>
                </div>
              ))}
              {todayLogs.length > 5 && (
                <p className="text-xs text-zinc-600">+{todayLogs.length - 5} more</p>
              )}
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-300">Active Goals</h3>
            <button
              onClick={() => onNavigate('goals')}
              className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              View all <ArrowRight size={11} />
            </button>
          </div>
          {activeGoals.length === 0 ? (
            <p className="text-xs text-zinc-600 py-6 text-center">No active goals yet.</p>
          ) : (
            <div className="space-y-3">
              {activeGoals.map((goal) => {
                const pct = Math.min((goal.currentCount / goal.targetCount) * 100, 100);
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-zinc-300 truncate">{goal.title}</span>
                      <span className="text-xs text-zinc-600 ml-2 flex-shrink-0">
                        {goal.currentCount}/{goal.targetCount}
                      </span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-600 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <div className="text-xl font-semibold text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-600 mt-1">{sub}</div>
    </div>
  );
}
