import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LogEntry, Goal, Reward, Category, Period, UnlockedAchievement } from './types';
import {
  calcXP, selectTotalXP, selectStreak, selectLevel,
  getWeekStart, getMonthStart, formatDate, ACHIEVEMENT_DEFS,
} from './utils';

interface Store {
  logs: LogEntry[];
  goals: Goal[];
  rewards: Reward[];
  unlockedAchievements: UnlockedAchievement[];
  pomodorosCompleted: number;

  addLog: (entry: { date: string; activityName: string; category: Category; duration: number; note: string }) => void;
  editLog: (id: string, updates: Partial<Pick<LogEntry, 'activityName' | 'category' | 'duration' | 'note'>>) => void;
  deleteLog: (id: string) => void;

  addGoal: (goal: { title: string; description: string; category: Category; period: Period; targetCount: number; xpReward: number }) => void;
  incrementGoal: (id: string) => void;
  incrementGoals: (ids: string[]) => void;
  deleteGoal: (id: string) => void;
  resetGoalsIfDue: () => void;

  addReward: (reward: { title: string; description: string; cost: number; icon: string }) => void;
  redeemReward: (id: string) => void;
  deleteReward: (id: string) => void;

  checkAchievements: () => void;
  incrementPomodoros: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      logs: [],
      goals: [],
      rewards: [],
      unlockedAchievements: [],
      pomodorosCompleted: 0,

      addLog: (entry) => {
        const newLog: LogEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          xpEarned: calcXP(entry.category, entry.duration),
        };
        set((s) => ({ logs: [newLog, ...s.logs] }));
        get().checkAchievements();
      },

      editLog: (id, updates) => {
        set((s) => ({
          logs: s.logs.map((l) => {
            if (l.id !== id) return l;
            const updated = { ...l, ...updates };
            updated.xpEarned = calcXP(updated.category, updated.duration);
            return updated;
          }),
        }));
      },

      deleteLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),

      addGoal: (goal) => {
        const now = Date.now();
        const newGoal: Goal = {
          ...goal,
          id: crypto.randomUUID(),
          createdAt: now,
          lastResetAt: now,
          currentCount: 0,
          completed: false,
        };
        set((s) => ({ goals: [newGoal, ...s.goals] }));
      },

      incrementGoal: (id) => {
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.id !== id || g.completed) return g;
            const newCount = g.currentCount + 1;
            const completed = newCount >= g.targetCount;
            return { ...g, currentCount: newCount, completed, completedAt: completed ? Date.now() : undefined };
          }),
        }));
        get().checkAchievements();
      },

      incrementGoals: (ids) => {
        if (ids.length === 0) return;
        set((s) => ({
          goals: s.goals.map((g) => {
            if (!ids.includes(g.id) || g.completed) return g;
            const newCount = g.currentCount + 1;
            const completed = newCount >= g.targetCount;
            return { ...g, currentCount: newCount, completed, completedAt: completed ? Date.now() : undefined };
          }),
        }));
        get().checkAchievements();
      },

      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      resetGoalsIfDue: () => {
        const now = new Date();
        const todayStr = formatDate(now);
        const weekStartStr = getWeekStart(now);
        const monthStartStr = getMonthStart(now);
        set((s) => ({
          goals: s.goals.map((g) => {
            if (g.completed || g.period === 'total') return g;
            const lastReset = formatDate(new Date(g.lastResetAt ?? g.createdAt));
            const shouldReset =
              (g.period === 'daily' && lastReset < todayStr) ||
              (g.period === 'weekly' && lastReset < weekStartStr) ||
              (g.period === 'monthly' && lastReset < monthStartStr);
            if (!shouldReset) return g;
            return { ...g, currentCount: 0, completed: false, completedAt: undefined, lastResetAt: Date.now() };
          }),
        }));
      },

      addReward: (reward) => {
        const newReward: Reward = {
          ...reward,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          redeemed: false,
        };
        set((s) => ({ rewards: [newReward, ...s.rewards] }));
      },

      redeemReward: (id) => {
        const { logs, goals, rewards } = get();
        const totalXP = selectTotalXP(logs) + goals.filter((g) => g.completed).reduce((s, g) => s + g.xpReward, 0);
        const spentXP = rewards.filter((r) => r.redeemed).reduce((s, r) => s + r.cost, 0);
        const reward = rewards.find((r) => r.id === id);
        if (!reward || reward.redeemed || totalXP - spentXP < reward.cost) return;
        set((s) => ({
          rewards: s.rewards.map((r) =>
            r.id === id ? { ...r, redeemed: true, redeemedAt: Date.now() } : r
          ),
        }));
        get().checkAchievements();
      },

      deleteReward: (id) => set((s) => ({ rewards: s.rewards.filter((r) => r.id !== id) })),

      checkAchievements: () => {
        const { logs, goals, rewards, unlockedAchievements, pomodorosCompleted } = get();
        const unlocked = new Set(unlockedAchievements.map((a) => a.id));
        const totalXP = selectTotalXP(logs) + goals.filter((g) => g.completed).reduce((s, g) => s + g.xpReward, 0);
        const streak = selectStreak(logs);
        const level = selectLevel(totalXP);
        const completedGoals = goals.filter((g) => g.completed).length;
        const redeemedRewards = rewards.filter((r) => r.redeemed).length;

        const conditions: Record<string, boolean> = {
          first_log:      logs.length >= 1,
          streak_3:       streak >= 3,
          streak_7:       streak >= 7,
          streak_30:      streak >= 30,
          level_5:        level >= 5,
          level_10:       level >= 10,
          goal_first:     completedGoals >= 1,
          goal_5:         completedGoals >= 5,
          reward_first:   redeemedRewards >= 1,
          xp_500:         totalXP >= 500,
          xp_1000:        totalXP >= 1000,
          xp_5000:        totalXP >= 5000,
          pomodoro_first: pomodorosCompleted >= 1,
          pomodoro_10:    pomodorosCompleted >= 10,
        };

        const newUnlocks: UnlockedAchievement[] = ACHIEVEMENT_DEFS
          .filter((def) => !unlocked.has(def.id) && conditions[def.id])
          .map((def) => ({ id: def.id, unlockedAt: Date.now() }));

        if (newUnlocks.length > 0) {
          set((s) => ({ unlockedAchievements: [...s.unlockedAchievements, ...newUnlocks] }));
        }
      },

      incrementPomodoros: () => {
        set((s) => ({ pomodorosCompleted: s.pomodorosCompleted + 1 }));
        get().checkAchievements();
      },
    }),
    { name: 'goal-tracker-v1' }
  )
);

export const selectAvailableXP = (logs: LogEntry[], goals: Goal[], rewards: Reward[]): number => {
  const total = selectTotalXP(logs) + goals.filter((g) => g.completed).reduce((s, g) => s + g.xpReward, 0);
  const spent = rewards.filter((r) => r.redeemed).reduce((s, r) => s + r.cost, 0);
  return total - spent;
};

export const selectGrandTotalXP = (logs: LogEntry[], goals: Goal[]): number =>
  selectTotalXP(logs) + goals.filter((g) => g.completed).reduce((s, g) => s + g.xpReward, 0);
