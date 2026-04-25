import { useState } from 'react';
import { Plus, X, Trophy, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { useStore } from '../store';
import { categoryBadge } from '../utils';
import type { Category, Period } from '../types';

const CATEGORIES: Category[] = ['coding', 'fitness', 'learning', 'other'];
const PERIODS: Period[] = ['daily', 'weekly', 'monthly', 'total'];

const defaultForm = {
  title: '',
  description: '',
  category: 'coding' as Category,
  period: 'weekly' as Period,
  targetCount: 5,
  xpReward: 100,
};

export default function Goals() {
  const { goals, addGoal, incrementGoal, deleteGoal } = useStore();
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const filtered = goals.filter((g) => g.completed === (tab === 'completed'));
  const activeCount = goals.filter((g) => !g.completed).length;
  const completedCount = goals.filter((g) => g.completed).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addGoal(form);
    setForm(defaultForm);
    setShowForm(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-zinc-100">Goals</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition-colors"
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'Create Goal'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4 mb-5 space-y-3"
        >
          <input
            type="text"
            placeholder="Goal title — e.g. Code every day for a week"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            autoFocus
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Period</label>
              <select
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value as Period })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                {PERIODS.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Target count</label>
              <input
                type="number"
                min={1}
                max={9999}
                value={form.targetCount}
                onChange={(e) => setForm({ ...form, targetCount: Number(e.target.value) })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">XP reward on completion</label>
              <input
                type="number"
                min={10}
                max={99999}
                step={10}
                value={form.xpReward}
                onChange={(e) => setForm({ ...form, xpReward: Number(e.target.value) })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-1.5 rounded transition-colors"
            >
              Create Goal
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-zinc-900 border border-zinc-800/60 p-1 rounded-lg w-fit">
        {(['active', 'completed'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded transition-colors ${
              tab === t ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span className="ml-2 text-xs text-zinc-600">
              {t === 'active' ? activeCount : completedCount}
            </span>
          </button>
        ))}
      </div>

      {/* Goal list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-zinc-600 text-sm py-16">
            {tab === 'active' ? 'No active goals. Create one above!' : 'No completed goals yet.'}
          </p>
        ) : (
          filtered.map((goal) => {
            const pct = Math.min((goal.currentCount / goal.targetCount) * 100, 100);
            return (
              <div
                key={goal.id}
                className={`bg-zinc-900 border border-zinc-800/60 rounded-lg p-4 ${goal.completed ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-0.5">
                      {goal.completed ? (
                        <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                      ) : (
                        <Circle size={14} className="text-zinc-700 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-zinc-100">{goal.title}</span>
                    </div>
                    {goal.description && (
                      <p className="text-xs text-zinc-600 ml-5">{goal.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs text-yellow-600">
                      <Trophy size={11} />
                      {goal.xpReward} XP
                    </span>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-zinc-700 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2 ml-5">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${categoryBadge(goal.category)}`}>
                    {goal.category}
                  </span>
                  <span className="text-xs text-zinc-600">{goal.period}</span>
                  <span className="text-xs text-zinc-500 ml-auto">
                    {goal.currentCount} / {goal.targetCount}
                  </span>
                </div>

                <div className="ml-5 h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      goal.completed ? 'bg-emerald-500' : 'bg-violet-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {!goal.completed && (
                  <button
                    onClick={() => incrementGoal(goal.id)}
                    className="ml-5 text-xs text-zinc-600 hover:text-zinc-300 transition-colors mt-1"
                  >
                    + Mark progress
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
