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

export const calcXP = (
  category: Category,
  duration: number,
  rates?: Partial<Record<Category, number>>,
): number => {
  const rate = rates?.[category] ?? XP_PER_CATEGORY[category];
  return Math.round(rate * (duration >= 60 ? 1.5 : 1));
};

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

export const getWeekStart = (d: Date): string => {
  const day = new Date(d);
  const diff = day.getDay() === 0 ? 6 : day.getDay() - 1;
  day.setDate(day.getDate() - diff);
  return formatDate(day);
};

export const getMonthStart = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

export interface AchievementDef {
  id: string;
  label: string;
  desc: string;
  icon: string;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  { id: 'first_log',      label: 'First Step',     desc: 'Log your first activity',        icon: '🌱' },
  { id: 'streak_3',       label: 'On Fire',         desc: '3-day logging streak',           icon: '🔥' },
  { id: 'streak_7',       label: 'Week Warrior',    desc: '7-day logging streak',           icon: '⚡' },
  { id: 'streak_30',      label: 'Unstoppable',     desc: '30-day logging streak',          icon: '👑' },
  { id: 'level_5',        label: 'Rising',          desc: 'Reach level 5',                  icon: '⭐' },
  { id: 'level_10',       label: 'Veteran',         desc: 'Reach level 10',                 icon: '💫' },
  { id: 'goal_first',     label: 'Goal Getter',     desc: 'Complete your first goal',       icon: '🎯' },
  { id: 'goal_5',         label: 'Overachiever',    desc: 'Complete 5 goals',               icon: '🏆' },
  { id: 'reward_first',   label: 'Treat Yourself',  desc: 'Redeem your first reward',       icon: '🎁' },
  { id: 'xp_500',         label: 'XP Grinder',      desc: 'Earn 500 total XP',              icon: '💎' },
  { id: 'xp_1000',        label: 'XP Hunter',       desc: 'Earn 1,000 total XP',            icon: '🚀' },
  { id: 'xp_5000',        label: 'XP Legend',       desc: 'Earn 5,000 total XP',            icon: '🌟' },
  { id: 'pomodoro_first', label: 'Focus Mode',      desc: 'Complete your first Pomodoro',   icon: '🍅' },
  { id: 'pomodoro_10',    label: 'Deep Worker',     desc: 'Complete 10 Pomodoros',          icon: '🧠' },
];
