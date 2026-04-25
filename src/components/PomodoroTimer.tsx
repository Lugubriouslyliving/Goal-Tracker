import { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { useStore } from '../store';
import { XP_PER_CATEGORY, formatDate } from '../utils';
import type { Category } from '../types';

interface Props {
  onClose: () => void;
}

type Mode = 'work' | 'break';

const WORK_SECS = 25 * 60;
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;
const CATEGORIES: Category[] = ['coding', 'fitness', 'learning', 'other'];

export default function PomodoroTimer({ onClose }: Props) {
  const { incrementPomodoros, addLog, goals, incrementGoals, pomodorosCompleted } = useStore();

  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_SECS);
  const [running, setRunning] = useState(false);
  const [sessionsDone, setSessionsDone] = useState(0);
  const [timerEnded, setTimerEnded] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [logForm, setLogForm] = useState({ activityName: '', category: 'coding' as Category, note: '' });
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const modeRef = useRef(mode);
  const sessionsDoneRef = useRef(sessionsDone);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { sessionsDoneRef.current = sessionsDone; }, [sessionsDone]);

  const breakDuration = (sessionsDoneRef.current + 1) % 4 === 0 ? LONG_BREAK : SHORT_BREAK;
  const totalTime = mode === 'work' ? WORK_SECS : breakDuration;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const circumference = 2 * Math.PI * 54;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!timerEnded) return;
    setTimerEnded(false);
    setRunning(false);
    if (modeRef.current === 'work') {
      incrementPomodoros();
      setSessionsDone((s) => s + 1);
      setShowLog(true);
    } else {
      setMode('work');
      setTimeLeft(WORK_SECS);
    }
  }, [timerEnded, incrementPomodoros]);

  const switchToBreak = () => {
    const isLong = (sessionsDoneRef.current) % 4 === 0 && sessionsDoneRef.current > 0;
    setMode('break');
    setTimeLeft(isLong ? LONG_BREAK : SHORT_BREAK);
    setRunning(false);
    setShowLog(false);
    setLogForm({ activityName: '', category: 'coding', note: '' });
    setSelectedGoals([]);
  };

  const reset = () => {
    setRunning(false);
    setTimeLeft(mode === 'work' ? WORK_SECS : breakDuration);
  };

  const skipToEnd = () => {
    setRunning(false);
    setTimerEnded(true);
    setTimeLeft(0);
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (logForm.activityName.trim()) {
      addLog({ date: formatDate(new Date()), ...logForm, duration: 25 });
      if (selectedGoals.length > 0) incrementGoals(selectedGoals);
    }
    switchToBreak();
  };

  const toggleGoal = (id: string) =>
    setSelectedGoals((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);

  const matchingGoals = goals.filter((g) => !g.completed && g.category === logForm.category);
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const accentColor = mode === 'work' ? '#10b981' : '#8b5cf6';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 w-80 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          <X size={16} />
        </button>

        {!showLog ? (
          <>
            {/* Mode tabs */}
            <div className="flex gap-1 justify-center mb-5">
              {(['work', 'break'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setTimeLeft(m === 'work' ? WORK_SECS : SHORT_BREAK); setRunning(false); }}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    mode === m ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'
                  }`}
                >
                  {m === 'work' ? 'Focus' : 'Break'}
                </button>
              ))}
            </div>

            {/* Progress ring */}
            <div className="flex justify-center mb-4">
              <div className="relative inline-flex items-center justify-center">
                <svg width="128" height="128" className="-rotate-90">
                  <circle cx="64" cy="64" r="54" fill="none" stroke="#27272a" strokeWidth="5" />
                  <circle
                    cx="64" cy="64" r="54" fill="none"
                    stroke={accentColor}
                    strokeWidth="5"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (progress / 100) * circumference}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="text-3xl font-mono font-semibold text-zinc-100">{mm}:{ss}</div>
                  <div className="text-xs text-zinc-600 mt-0.5">{mode === 'work' ? 'focus' : 'break'}</div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-zinc-600 mb-5">
              {pomodorosCompleted + sessionsDone} total · {sessionsDone} this session
            </p>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <button onClick={reset} className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors" title="Reset">
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => setRunning((r) => !r)}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-colors"
                style={{ background: accentColor }}
              >
                {running
                  ? <Pause size={18} className="text-white" />
                  : <Play size={18} className="text-white ml-0.5" />
                }
              </button>
              <button onClick={skipToEnd} className="p-2 text-zinc-600 hover:text-zinc-300 transition-colors" title="Skip">
                <SkipForward size={16} />
              </button>
            </div>
          </>
        ) : (
          /* Post-session log form */
          <div>
            <div className="text-center mb-4">
              <div className="text-3xl mb-2">🍅</div>
              <h3 className="text-sm font-medium text-zinc-100">Session complete!</h3>
              <p className="text-xs text-zinc-500 mt-1">Log what you worked on?</p>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="What did you work on?"
                value={logForm.activityName}
                onChange={(e) => setLogForm({ ...logForm, activityName: e.target.value })}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                autoFocus
              />
              <select
                value={logForm.category}
                onChange={(e) => { setLogForm({ ...logForm, category: e.target.value as Category }); setSelectedGoals([]); }}
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.charAt(0).toUpperCase() + c.slice(1)} — {XP_PER_CATEGORY[c]} XP
                  </option>
                ))}
              </select>

              {matchingGoals.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1.5">Update goals:</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {matchingGoals.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedGoals.includes(g.id)}
                          onChange={() => toggleGoal(g.id)}
                          className="accent-violet-500"
                        />
                        <span className="text-xs text-zinc-400 truncate">{g.title}</span>
                        <span className="text-xs text-zinc-600 ml-auto flex-shrink-0">
                          {g.currentCount}/{g.targetCount}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={switchToBreak}
                  className="flex-1 py-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                >
                  Log it
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
