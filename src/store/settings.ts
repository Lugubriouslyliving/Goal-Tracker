import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category } from '../types';

export type AccentColor = 'emerald' | 'violet' | 'blue' | 'rose';

export const ACCENT_VALUES: Record<AccentColor, string> = {
  emerald: '#10b981',
  violet:  '#8b5cf6',
  blue:    '#3b82f6',
  rose:    '#f43f5e',
};

export const DEFAULT_XP_RATES: Record<Category, number> = {
  coding:  50,
  fitness: 40,
  learning: 35,
  other:   25,
};

interface SettingsStore {
  displayName: string;
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
  xpRates: Record<Category, number>;
  accentColor: AccentColor;
  soundEnabled: boolean;

  set: (patch: Partial<Omit<SettingsStore, 'set' | 'setXpRate'>>) => void;
  setXpRate: (cat: Category, rate: number) => void;
}

export const useSettings = create<SettingsStore>()(
  persist(
    (setState) => ({
      displayName:       '',
      workDuration:      25,
      shortBreak:        5,
      longBreak:         15,
      longBreakInterval: 4,
      xpRates:           { ...DEFAULT_XP_RATES },
      accentColor:       'emerald',
      soundEnabled:      true,

      set: (patch) => setState(patch),
      setXpRate: (cat, rate) =>
        setState((s) => ({ xpRates: { ...s.xpRates, [cat]: rate } })),
    }),
    { name: 'goal-tracker-settings' }
  )
);
