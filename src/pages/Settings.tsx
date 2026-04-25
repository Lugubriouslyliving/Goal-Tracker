import { useState, useRef } from 'react';
import { User, Timer, Zap, Palette, Database, LogOut, Save, Upload, Download, Trash2 } from 'lucide-react';
import { useSettings, ACCENT_VALUES } from '../store/settings';
import { useStore } from '../store';
import { supabase, isConfigured } from '../lib/supabase';
import { db } from '../lib/db';
import type { Category } from '../types';

type Section = 'profile' | 'pomodoro' | 'xp' | 'appearance' | 'data' | 'account';

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'profile',    label: 'Profile',     icon: User },
  { id: 'pomodoro',   label: 'Pomodoro',    icon: Timer },
  { id: 'xp',         label: 'XP Rates',    icon: Zap },
  { id: 'appearance', label: 'Appearance',  icon: Palette },
  { id: 'data',       label: 'Data',        icon: Database },
  { id: 'account',    label: 'Account',     icon: LogOut },
];

const CATEGORIES: Category[] = ['coding', 'fitness', 'learning', 'other'];
const CATEGORY_LABELS: Record<Category, string> = {
  coding: 'Coding', fitness: 'Fitness', learning: 'Learning', other: 'Other',
};

const ACCENT_LABELS: Record<string, string> = {
  emerald: 'Emerald', violet: 'Violet', blue: 'Blue', rose: 'Rose',
};

export default function Settings() {
  const settings = useSettings();
  const store = useStore();
  const [section, setSection] = useState<Section>('profile');
  const fileRef = useRef<HTMLInputElement>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameInput, setNameInput] = useState(settings.displayName);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    settings.set({ displayName: trimmed });
    if (store.userId) {
      db.profile.upsert(store.userId, { display_name: trimmed }).catch(() => {});
    }
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const handleExport = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      logs: store.logs,
      goals: store.goals,
      rewards: store.rewards,
      unlockedAchievements: store.unlockedAchievements,
      pomodorosCompleted: store.pomodorosCompleted,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goal-tracker-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.version !== 1) throw new Error('Unrecognised format');
        store.importData({
          logs: data.logs ?? [],
          goals: data.goals ?? [],
          rewards: data.rewards ?? [],
          unlockedAchievements: data.unlockedAchievements ?? [],
          pomodorosCompleted: data.pomodorosCompleted ?? 0,
        });
        alert('Data imported successfully.');
      } catch {
        alert('Could not read file — make sure it was exported from Goal Tracker.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearData = () => {
    if (confirm('This will permanently delete all your local data. This cannot be undone. Continue?')) {
      store.clearLocalData();
    }
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    store.setUserId(null);
    store.setLocalMode(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-7">
        <h2 className="text-2xl font-semibold text-zinc-100">Settings</h2>
        <p className="text-zinc-500 mt-1 text-sm">Manage your preferences and data.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-40 flex-shrink-0 space-y-0.5">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                section === id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </aside>

        {/* Content */}
        <div className="flex-1 bg-zinc-900 border border-zinc-800/60 rounded-xl p-5">
          {/* ── Profile ────────────────────────────────── */}
          {section === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-200">Profile</h3>
              <div>
                <label className="text-xs text-zinc-500 block mb-1.5">Display name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    placeholder="Your name"
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                  <button
                    onClick={handleSaveName}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm rounded-lg transition-colors"
                  >
                    <Save size={13} />
                    {nameSaved ? 'Saved!' : 'Save'}
                  </button>
                </div>
                <p className="text-xs text-zinc-600 mt-1.5">Shown in the greeting on your dashboard.</p>
              </div>
            </div>
          )}

          {/* ── Pomodoro ───────────────────────────────── */}
          {section === 'pomodoro' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-200">Pomodoro Timer</h3>
              {[
                { key: 'workDuration', label: 'Focus duration', unit: 'min', min: 5, max: 90 },
                { key: 'shortBreak',   label: 'Short break',    unit: 'min', min: 1, max: 30 },
                { key: 'longBreak',    label: 'Long break',     unit: 'min', min: 5, max: 60 },
                { key: 'longBreakInterval', label: 'Long break every', unit: 'sessions', min: 2, max: 10 },
              ].map(({ key, label, unit, min, max }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-zinc-500">{label}</label>
                    <span className="text-xs text-zinc-400">
                      {settings[key as keyof typeof settings] as number} {unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={settings[key as keyof typeof settings] as number}
                    onChange={(e) => settings.set({ [key]: Number(e.target.value) } as never)}
                    className="w-full"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex justify-between text-xs text-zinc-700 mt-0.5">
                    <span>{min}</span><span>{max}</span>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <div>
                  <p className="text-sm text-zinc-300">Sound notifications</p>
                  <p className="text-xs text-zinc-600">Play a sound when a session ends</p>
                </div>
                <button
                  onClick={() => settings.set({ soundEnabled: !settings.soundEnabled })}
                  className="w-10 h-6 rounded-full transition-colors relative"
                  style={{ backgroundColor: settings.soundEnabled ? 'var(--accent)' : '#3f3f46' }}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      settings.soundEnabled ? 'left-5' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ── XP Rates ───────────────────────────────── */}
          {section === 'xp' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-200">XP Rates</h3>
              <p className="text-xs text-zinc-600">Base XP earned per activity. Activities ≥ 60 min earn 1.5×.</p>
              {CATEGORIES.map((cat) => (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs text-zinc-500">{CATEGORY_LABELS[cat]}</label>
                    <span className="text-xs text-zinc-400">{settings.xpRates[cat]} XP</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={5}
                    value={settings.xpRates[cat]}
                    onChange={(e) => settings.setXpRate(cat, Number(e.target.value))}
                    className="w-full"
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <div className="flex justify-between text-xs text-zinc-700 mt-0.5">
                    <span>5</span><span>200</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Appearance ─────────────────────────────── */}
          {section === 'appearance' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-200">Appearance</h3>
              <div>
                <label className="text-xs text-zinc-500 block mb-3">Accent color</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(ACCENT_VALUES) as [string, string][]).map(([key, hex]) => (
                    <button
                      key={key}
                      onClick={() => settings.set({ accentColor: key as never })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                        settings.accentColor === key
                          ? 'border-zinc-400 bg-zinc-800'
                          : 'border-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs text-zinc-400">{ACCENT_LABELS[key]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Data ───────────────────────────────────── */}
          {section === 'data' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-200">Data Management</h3>

              <div className="p-4 bg-zinc-800/50 rounded-lg space-y-1">
                <p className="text-sm text-zinc-300 font-medium">Export data</p>
                <p className="text-xs text-zinc-600">Download all your logs, goals, and rewards as a JSON file.</p>
                <button
                  onClick={handleExport}
                  className="mt-3 flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm rounded-lg transition-colors"
                >
                  <Download size={14} />
                  Export JSON
                </button>
              </div>

              <div className="p-4 bg-zinc-800/50 rounded-lg space-y-1">
                <p className="text-sm text-zinc-300 font-medium">Import data</p>
                <p className="text-xs text-zinc-600">Restore from a previously exported JSON file. This replaces current data.</p>
                <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="mt-3 flex items-center gap-2 px-3 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm rounded-lg transition-colors"
                >
                  <Upload size={14} />
                  Import JSON
                </button>
              </div>

              <div className="p-4 bg-rose-950/30 border border-rose-900/40 rounded-lg space-y-1">
                <p className="text-sm text-rose-300 font-medium">Clear all data</p>
                <p className="text-xs text-zinc-600">Permanently delete all local logs, goals, rewards, and achievements.</p>
                <button
                  onClick={handleClearData}
                  className="mt-3 flex items-center gap-2 px-3 py-2 bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 text-sm rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                  Clear data
                </button>
              </div>
            </div>
          )}

          {/* ── Account ────────────────────────────────── */}
          {section === 'account' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-200">Account</h3>

              {isConfigured && store.userId ? (
                <>
                  <div className="p-4 bg-zinc-800/50 rounded-lg">
                    <p className="text-xs text-zinc-500 mb-1">Signed in as</p>
                    <p className="text-sm text-zinc-200">{store.userId}</p>
                    <p className="text-xs text-zinc-600 mt-1">Data syncs to Supabase automatically.</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm rounded-lg transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <p className="text-sm text-zinc-300 font-medium mb-1">Local mode</p>
                  <p className="text-xs text-zinc-600">
                    {isConfigured
                      ? 'You\'re running in local-only mode. Sign in to sync your data across devices.'
                      : 'No Supabase connection configured. Data is stored locally in your browser.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
