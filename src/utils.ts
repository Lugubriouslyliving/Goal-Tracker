import type { Category, LogEntry } from './types';

export const formatDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const formatDisplayDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

export const getGreeting = (): string => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 18) return 'Good afternoon.';
  return 'Good evening.';
};

export const categoryBadge = (cat: Category): string => {
  const map: Record<Category, string> = {
    coding: 'bg-blue-500/20 text-blue-400',
    fitness: 'bg-orange-500/20 text-orange-400',
    learning: 'bg-emerald-500/20 text-emerald-400',
    other: 'bg-zinc-700 text-zinc-400',
  };
  return map[cat];
};

export const categoryHex: Record<Category, string> = {
  coding: '#3b82f6',
  fitness: '#f97316',
  learning: '#10b981',
  other: '#6b7280',
};

export const XP_PER_CATEGORY: Record<Category, number> = {
  coding: 50,
  fitness: 40,
  learning: 35,
  other: 25,
};

export const calcXP = (category: Category, duration: number): number =>
  Math.round(XP_PER_CATEGORY[category] * (duration >= 60 ? 1.5 : 1));

export const selectTotalXP = (logs: LogEntry[]): number =>
  logs.reduce((s, l) => s + l.xpEarned, 0);

export const selectLevel = (xp: number): number => Math.floor(xp / 500) + 1;

export const selectXPInLevel = (xp: number): number => xp % 500;

export const selectStreak = (logs: LogEntry[]): number => {
  if (logs.length === 0) return 0;
  const dates = new Set(logs.map((l) => l.date));
  const today = formatDate(new Date());

  const cur = new Date();
  if (!dates.has(today)) {
    cur.setDate(cur.getDate() - 1);
    if (!dates.has(formatDate(cur))) return 0;
  }

  let streak = 0;
  while (dates.has(formatDate(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
};
