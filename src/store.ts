import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LogEntry, Goal, Reward, Category, Period, UnlockedAchievement } from './types';
import {
  calcXP, selectTotalXP, selectStreak, selectLevel,
  getWeekStart, getMonthStart, formatDate, ACHIEVEMENT_DEFS,
} from './utils';
import { db } from './lib/db';
import { useSettings } from './store/settings';

interface Store {
  logs: LogEntry[];
  goals: Goal[];
  rewards: Reward[];
  unlockedAchievements: UnlockedAchievement[];
  pomodorosCompleted: number;
  userId: string | null;
  isLocalMode: boolean;
  isLoading: boolean;

  setUserId: (uid: string | null) => void;
  setLocalMode: (val: boolean) => void;
  initializeFromSupabase: (uid: string) => Promise<void>;
  clearLocalData: () => void;
  importData: (data: {
    logs: LogEntry[];
    goals: Goal[];
    rewards: Reward[];
    unlockedAchievements: UnlockedAchievement[];
    pomodorosCompleted: number;
  }) => void;

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
      userId: null,
      isLocalMode: false,
      isLoading: false,

      setUserId: (uid) => set({ userId: uid }),

      setLocalMode: (val) => set({ isLocalMode: val }),

      initializeFromSupabase: async (uid) => {
        set({ isLoading: true });
        try {
          const [logs, goals, rewards, achievements, profile] = await Promise.all([
            db.logs.getAll(uid),
            db.goals.getAll(uid),
            db.rewards.getAll(uid),
            db.achievements.getAll(uid),
            db.profile.get(uid),
          ]);
          set({
            logs,
            goals,
            rewards,
            unlockedAchievements: achievements,
            pomodorosCompleted: profile?.pomodoros_completed ?? 0,
            userId: uid,
          });
          if (profile?.display_name) {
            useSettings.getState().set({ displayName: profile.display_name });
          }
        } finally {
          set({ isLoading: false });
        }
      },

      clearLocalData: () =>
        set({
          logs: [],
          goals: [],
          rewards: [],
          unlockedAchievements: [],
          pomodorosCompleted: 0,
        }),

      importData: (data) => set(data),

      addLog: (entry) => {
        const rates = useSettings.getState().xpRates;
        const newLog: LogEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          xpEarned: calcXP(entry.category, entry.duration, rates),
        };
        set((s) => ({ logs: [newLog, ...s.logs] }));
        const { userId } = get();
        if (userId) db.logs.insert(userId, newLog).catch(() => {});
        get().checkAchievements();
      },

      editLog: (id, updates) => {
        const rates = useSettings.getState().xpRates;
        set((s) => ({
          logs: s.logs.map((l) => {
            if (l.id !== id) return l;
            const updated = { ...l, ...updates };
            updated.xpEarned = calcXP(updated.category, updated.duration, rates);
            return updated;
          }),
        }));
        const { userId, logs } = get();
        if (userId) {
          const log = logs.find((l) => l.id === id);
          if (log) db.logs.update(userId, log).catch(() => {});
        }
      },

      deleteLog: (id) => {
        set((s) => ({ logs: s.logs.filter((l) => l.id !== id) }));
        const { userId } = get();
        if (userId) db.logs.delete(id).catch(() => {});
      },

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
        const { userId } = get();
        if (userId) db.goals.insert(userId, newGoal).catch(() => {});
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
        const { userId, goals } = get();
        if (userId) {
          const goal = goals.find((g) => g.id === id);
          if (goal) db.goals.update(userId, goal).catch(() => {});
        }
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
        const { userId, goals } = get();
        if (userId) {
          goals
            .filter((g) => ids.includes(g.id))
            .forEach((g) => db.goals.update(userId, g).catch(() => {}));
        }
        get().checkAchievements();
      },

      deleteGoal: (id) => {
        set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
        const { userId } = get();
        if (userId) db.goals.delete(id).catch(() => {});
      },

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
        const { userId, goals } = get();
        if (userId) {
          goals.forEach((g) => db.goals.update(userId, g).catch(() => {}));
        }
      },

      addReward: (reward) => {
        const newReward: Reward = {
          ...reward,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          redeemed: false,
        };
        set((s) => ({ rewards: [newReward, ...s.rewards] }));
        const { userId } = get();
        if (userId) db.rewards.insert(userId, newReward).catch(() => {});
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
        const { userId } = get();
        if (userId) {
          const updated = get().rewards.find((r) => r.id === id);
          if (updated) db.rewards.update(userId, updated).catch(() => {});
        }
        get().checkAchievements();
      },

      deleteReward: (id) => {
        set((s) => ({ rewards: s.rewards.filter((r) => r.id !== id) }));
        const { userId } = get();
        if (userId) db.rewards.delete(id).catch(() => {});
      },

      checkAchievements: () => {
        const { logs, goals, rewards, unlockedAchievements, pomodorosCompleted, userId } = get();
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
          if (userId) {
            newUnlocks.forEach((a) => db.achievements.insert(userId, a).catch(() => {}));
          }
        }
      },

      incrementPomodoros: () => {
        set((s) => ({ pomodorosCompleted: s.pomodorosCompleted + 1 }));
        const { userId, pomodorosCompleted } = get();
        if (userId) {
          db.profile.upsert(userId, { pomodoros_completed: pomodorosCompleted }).catch(() => {});
        }
        get().checkAchievements();
      },
    }),
    {
      name: 'goal-tracker-v1',
      partialize: (s) => ({
        logs: s.logs,
        goals: s.goals,
        rewards: s.rewards,
        unlockedAchievements: s.unlockedAchievements,
        pomodorosCompleted: s.pomodorosCompleted,
        userId: s.userId,
        isLocalMode: s.isLocalMode,
      }),
    }
  )
);

export const selectAvailableXP = (logs: LogEntry[], goals: Goal[], rewards: Reward[]): number => {
  const total = selectTotalXP(logs) + goals.filter((g) => g.completed).reduce((s, g) => s + g.xpReward, 0);
  const spent = rewards.filter((r) => r.redeemed).reduce((s, r) => s + r.cost, 0);
  return total - spent;
};

export const selectGrandTotalXP = (logs: LogEntry[], goals: Goal[]): number =>
  selectTotalXP(logs) + goals.filter((g) => g.completed).reduce((s, g) => s + g.xpReward, 0);
