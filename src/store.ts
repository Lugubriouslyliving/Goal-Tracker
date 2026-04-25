import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LogEntry, Goal, Reward, Category, Period } from './types';
import { calcXP, selectTotalXP } from './utils';

interface Store {
  logs: LogEntry[];
  goals: Goal[];
  rewards: Reward[];

  addLog: (entry: { date: string; activityName: string; category: Category; duration: number; note: string }) => void;
  deleteLog: (id: string) => void;

  addGoal: (goal: { title: string; description: string; category: Category; period: Period; targetCount: number; xpReward: number }) => void;
  incrementGoal: (id: string) => void;
  deleteGoal: (id: string) => void;

  addReward: (reward: { title: string; description: string; cost: number; icon: string }) => void;
  redeemReward: (id: string) => void;
  deleteReward: (id: string) => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      logs: [],
      goals: [],
      rewards: [],

      addLog: (entry) => {
        const newLog: LogEntry = {
          ...entry,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          xpEarned: calcXP(entry.category, entry.duration),
        };
        set((s) => ({ logs: [newLog, ...s.logs] }));
      },

      deleteLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),

      addGoal: (goal) => {
        const newGoal: Goal = {
          ...goal,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
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
      },

      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

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
        const available = totalXP - spentXP;
        const reward = rewards.find((r) => r.id === id);
        if (!reward || reward.redeemed || available < reward.cost) return;
        set((s) => ({
          rewards: s.rewards.map((r) =>
            r.id === id ? { ...r, redeemed: true, redeemedAt: Date.now() } : r
          ),
        }));
      },

      deleteReward: (id) => set((s) => ({ rewards: s.rewards.filter((r) => r.id !== id) })),
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
