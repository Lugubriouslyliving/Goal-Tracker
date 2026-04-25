import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Pencil } from 'lucide-react';
import { useStore } from '../store';
import { formatDate, formatDisplayDate, categoryBadge, calcXP, XP_PER_CATEGORY } from '../utils';
import type { Category, LogEntry } from '../types';

const CATEGORIES: Category[] = ['coding', 'fitness', 'learning', 'other'];
const defaultForm = { activityName: '', category: 'coding' as Category, duration: 30, note: '' };

export default function DailyLog() {
  const { logs, goals, addLog, editLog, deleteLog, incrementGoals } = useStore();
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(defaultForm);

  const today = formatDate(new Date());
  const isToday = selectedDate === today;

  const dayLogs = logs
    .filter((l) => l.date === selectedDate)
    .sort((a, b) => b.timestamp - a.timestamp);

  const matchingGoals = goals.filter((g) => !g.completed && g.category === form.category);

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const next = formatDate(d);
    if (next <= today) setSelectedDate(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.activityName.trim()) return;
    addLog({ ...form, date: selectedDate });
    if (selectedGoals.length > 0) incrementGoals(selectedGoals);
    setForm(defaultForm);
    setSelectedGoals([]);
    setShowForm(false);
  };

  const startEdit = (log: LogEntry) => {
    setEditForm({ activityName: log.activityName, category: log.category, duration: log.duration, note: log.note });
    setEditingId(log.id);
  };

  const handleEditSave = (id: string) => {
    if (!editForm.activityName.trim()) return;
    editLog(id, editForm);
    setEditingId(null);
  };

  const toggleGoal = (id: string) =>
    setSelectedGoals((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);

  const previewXP = calcXP(form.category, form.duration);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Date nav */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-1)} className="p-1.5 rounded hover:bg-zinc-800 transition-colors">
            <ChevronLeft size={17} className="text-zinc-400" />
          </button>
          <div className="text-center min-w-[200px]">
            <p className="text-base font-medium text-zinc-100">{formatDisplayDate(selectedDate)}</p>
            {isToday && <p className="text-xs text-emerald-500 mt-0.5">Today</p>}
          </div>
          <button
            onClick={() => shiftDate(1)}
            disabled={isToday}
            className="p-1.5 rounded hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={17} className="text-zinc-400" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {!isToday && (
            <button onClick={() => setSelectedDate(today)} className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors">
              Today
            </button>
          )}
          <button
            onClick={() => { setShowForm((v) => !v); setSelectedGoals([]); }}
            className="flex items-center gap-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition-colors"
          >
            {showForm ? <X size={13} /> : <Plus size={13} />}
            {showForm ? 'Cancel' : 'Log Activity'}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4 mb-4 space-y-3">
          <input
            type="text"
            placeholder="Activity name — e.g. React tutorial, Morning run"
            value={form.activityName}
            onChange={(e) => setForm({ ...form, activityName: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            autoFocus
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => { setForm({ ...form, category: e.target.value as Category }); setSelectedGoals([]); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)} — {XP_PER_CATEGORY[c]} XP</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1.5 block">Duration (minutes)</label>
              <input
                type="number" min={1} max={600}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
          <input
            type="text"
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />

          {/* Goal linking */}
          {matchingGoals.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-1.5">Also update goals:</p>
              <div className="space-y-1">
                {matchingGoals.map((g) => (
                  <label key={g.id} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedGoals.includes(g.id)}
                      onChange={() => toggleGoal(g.id)}
                      className="accent-violet-500"
                    />
                    <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors truncate">{g.title}</span>
                    <span className="text-xs text-zinc-600 ml-auto flex-shrink-0">{g.currentCount}/{g.targetCount}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-zinc-500">
              Earns: <span className="text-emerald-400 font-medium">+{previewXP} XP</span>
              {form.duration >= 60 && <span className="text-zinc-600 ml-1">(1.5× bonus)</span>}
            </span>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-1.5 rounded transition-colors">
              Add Log
            </button>
          </div>
        </form>
      )}

      {/* Day summary */}
      {dayLogs.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-zinc-600">{dayLogs.length} {dayLogs.length === 1 ? 'entry' : 'entries'}</p>
          <p className="text-xs text-emerald-600">+{dayLogs.reduce((s, l) => s + l.xpEarned, 0)} XP total</p>
        </div>
      )}

      {/* Log entries */}
      <div className="space-y-2">
        {dayLogs.length === 0 ? (
          <div className="text-center py-16 text-zinc-600 text-sm">No activities logged for this day.</div>
        ) : (
          dayLogs.map((log) =>
            editingId === log.id ? (
              /* Inline edit form */
              <div key={log.id} className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 space-y-3">
                <input
                  type="text"
                  value={editForm.activityName}
                  onChange={(e) => setEditForm({ ...editForm, activityName: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value as Category })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                  <input
                    type="number" min={1} max={600}
                    value={editForm.duration}
                    onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                    className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Note (optional)"
                  value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="text-xs text-zinc-500 hover:text-zinc-300 px-3 py-1.5 transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => handleEditSave(log.id)} className="text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-100 px-3 py-1.5 rounded transition-colors">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              /* Log entry row */
              <div key={log.id} className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4 flex items-start justify-between group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${categoryBadge(log.category)}`}>
                      {log.category}
                    </span>
                    <span className="text-sm font-medium text-zinc-100 truncate">{log.activityName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-600">
                    <span>{log.duration} min</span>
                    {log.note && <span className="truncate text-zinc-500">{log.note}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <span className="text-sm text-emerald-500">+{log.xpEarned} XP</span>
                  <button
                    onClick={() => startEdit(log)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-zinc-300 transition-all"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
