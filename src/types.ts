export type Category = 'coding' | 'fitness' | 'learning' | 'other';
export type Period = 'daily' | 'weekly' | 'monthly' | 'total';

export interface LogEntry {
  id: string;
  date: string;
  activityName: string;
  category: Category;
  duration: number;
  note: string;
  xpEarned: number;
  timestamp: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: Category;
  targetCount: number;
  currentCount: number;
  period: Period;
  xpReward: number;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
  lastResetAt?: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  redeemed: boolean;
  redeemedAt?: number;
  createdAt: number;
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
}
