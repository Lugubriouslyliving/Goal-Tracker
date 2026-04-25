import { supabase } from './supabase';
import type { LogEntry, Goal, Reward, UnlockedAchievement } from '../types';

// ── mappers ────────────────────────────────────────────────────────────────

const toLog = (r: Record<string, unknown>): LogEntry => ({
  id:           r.id           as string,
  date:         r.date         as string,
  activityName: r.activity_name as string,
  category:     r.category     as LogEntry['category'],
  duration:     r.duration     as number,
  note:         r.note         as string,
  xpEarned:     r.xp_earned   as number,
  timestamp:    r.timestamp    as number,
});

const fromLog = (uid: string, l: LogEntry) => ({
  id: l.id, user_id: uid,
  date: l.date, activity_name: l.activityName,
  category: l.category, duration: l.duration,
  note: l.note, xp_earned: l.xpEarned, timestamp: l.timestamp,
});

const toGoal = (r: Record<string, unknown>): Goal => ({
  id:           r.id           as string,
  title:        r.title        as string,
  description:  r.description  as string,
  category:     r.category     as Goal['category'],
  targetCount:  r.target_count as number,
  currentCount: r.current_count as number,
  period:       r.period       as Goal['period'],
  xpReward:     r.xp_reward   as number,
  completed:    r.completed    as boolean,
  createdAt:    r.created_at   as number,
  completedAt:  r.completed_at  as number | undefined,
  lastResetAt:  r.last_reset_at as number | undefined,
});

const fromGoal = (uid: string, g: Goal) => ({
  id: g.id, user_id: uid,
  title: g.title, description: g.description,
  category: g.category, target_count: g.targetCount,
  current_count: g.currentCount, period: g.period,
  xp_reward: g.xpReward, completed: g.completed,
  created_at: g.createdAt, completed_at: g.completedAt ?? null,
  last_reset_at: g.lastResetAt ?? null,
});

const toReward = (r: Record<string, unknown>): Reward => ({
  id:          r.id          as string,
  title:       r.title       as string,
  description: r.description as string,
  cost:        r.cost        as number,
  icon:        r.icon        as string,
  redeemed:    r.redeemed    as boolean,
  redeemedAt:  r.redeemed_at as number | undefined,
  createdAt:   r.created_at  as number,
});

const fromReward = (uid: string, r: Reward) => ({
  id: r.id, user_id: uid,
  title: r.title, description: r.description,
  cost: r.cost, icon: r.icon,
  redeemed: r.redeemed, redeemed_at: r.redeemedAt ?? null,
  created_at: r.createdAt,
});

// ── database operations ────────────────────────────────────────────────────

export const db = {
  logs: {
    getAll: async (uid: string) => {
      const { data } = await supabase!.from('gt_logs').select('*').eq('user_id', uid).order('timestamp', { ascending: false });
      return (data ?? []).map((r) => toLog(r as Record<string, unknown>));
    },
    insert: async (uid: string, log: LogEntry) => {
      await supabase!.from('gt_logs').upsert(fromLog(uid, log));
    },
    update: async (uid: string, log: LogEntry) => {
      await supabase!.from('gt_logs').update(fromLog(uid, log)).eq('id', log.id);
    },
    delete: async (id: string) => {
      await supabase!.from('gt_logs').delete().eq('id', id);
    },
  },

  goals: {
    getAll: async (uid: string) => {
      const { data } = await supabase!.from('gt_goals').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      return (data ?? []).map((r) => toGoal(r as Record<string, unknown>));
    },
    insert: async (uid: string, goal: Goal) => {
      await supabase!.from('gt_goals').upsert(fromGoal(uid, goal));
    },
    update: async (uid: string, goal: Goal) => {
      await supabase!.from('gt_goals').update(fromGoal(uid, goal)).eq('id', goal.id);
    },
    delete: async (id: string) => {
      await supabase!.from('gt_goals').delete().eq('id', id);
    },
  },

  rewards: {
    getAll: async (uid: string) => {
      const { data } = await supabase!.from('gt_rewards').select('*').eq('user_id', uid).order('created_at', { ascending: false });
      return (data ?? []).map((r) => toReward(r as Record<string, unknown>));
    },
    insert: async (uid: string, reward: Reward) => {
      await supabase!.from('gt_rewards').upsert(fromReward(uid, reward));
    },
    update: async (uid: string, reward: Reward) => {
      await supabase!.from('gt_rewards').update(fromReward(uid, reward)).eq('id', reward.id);
    },
    delete: async (id: string) => {
      await supabase!.from('gt_rewards').delete().eq('id', id);
    },
  },

  achievements: {
    getAll: async (uid: string): Promise<UnlockedAchievement[]> => {
      const { data } = await supabase!.from('gt_achievements').select('*').eq('user_id', uid);
      return (data ?? []).map((r) => ({
        id: r.achievement_id as string,
        unlockedAt: r.unlocked_at as number,
      }));
    },
    insert: async (uid: string, a: UnlockedAchievement) => {
      await supabase!.from('gt_achievements').upsert({ user_id: uid, achievement_id: a.id, unlocked_at: a.unlockedAt });
    },
  },

  profile: {
    get: async (uid: string) => {
      const { data } = await supabase!.from('gt_profile').select('*').eq('user_id', uid).single();
      return data as { display_name: string; pomodoros_completed: number } | null;
    },
    upsert: async (uid: string, values: { display_name?: string; pomodoros_completed?: number }) => {
      await supabase!.from('gt_profile').upsert({ user_id: uid, ...values });
    },
  },
};
