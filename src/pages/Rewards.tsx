import { useState } from 'react';
import { Plus, X, Zap, CheckCheck, Trash2 } from 'lucide-react';
import { useStore, selectAvailableXP } from '../store';

const EMOJI_OPTIONS = ['🎮', '🎯', '🏆', '🎁', '🍕', '🎬', '👟', '📱', '🎧', '🌟', '💎', '🚀', '🕹️', '🎪', '🛒'];

const defaultForm = { title: '', description: '', cost: 500, icon: '🎮' };

export default function Rewards() {
  const { logs, goals, rewards, addReward, redeemReward, deleteReward } = useStore();
  const available = selectAvailableXP(logs, goals, rewards);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const pending = rewards.filter((r) => !r.redeemed);
  const redeemed = rewards.filter((r) => r.redeemed);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addReward(form);
    setForm(defaultForm);
    setShowForm(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Rewards</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Balance:{' '}
            <span className="text-[var(--accent)] font-medium">{available.toLocaleString()} XP</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-md transition-colors"
        >
          {showForm ? <X size={13} /> : <Plus size={13} />}
          {showForm ? 'Cancel' : 'Add Reward'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4 mb-6 space-y-3"
        >
          <div>
            <label className="text-xs text-zinc-500 mb-2 block">Pick an icon</label>
            <div className="flex gap-1.5 flex-wrap">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon: emoji })}
                  className={`text-lg p-1.5 rounded transition-colors ${
                    form.icon === emoji
                      ? 'bg-zinc-700 ring-1 ring-zinc-500'
                      : 'hover:bg-zinc-800'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Reward title — e.g. Buy a game skin"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
            autoFocus
            required
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
          />
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">XP cost</label>
            <input
              type="number"
              min={10}
              step={10}
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-1.5 rounded transition-colors"
            >
              Add Reward
            </button>
          </div>
        </form>
      )}

      {/* Available rewards */}
      {pending.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Available</h3>
          <div className="grid grid-cols-2 gap-3">
            {pending.map((reward) => {
              const canAfford = available >= reward.cost;
              const deficit = reward.cost - available;
              return (
                <div
                  key={reward.id}
                  className="bg-zinc-900 border border-zinc-800/60 rounded-lg p-4 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{reward.icon}</span>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5 text-xs text-[var(--accent)]">
                        <Zap size={11} />
                        {reward.cost.toLocaleString()}
                      </div>
                      <button
                        onClick={() => deleteReward(reward.id)}
                        className="ml-1 text-zinc-700 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-sm font-medium text-zinc-100 mb-1">{reward.title}</h4>
                  {reward.description && (
                    <p className="text-xs text-zinc-600 mb-3 flex-1">{reward.description}</p>
                  )}
                  <button
                    onClick={() => redeemReward(reward.id)}
                    disabled={!canAfford}
                    style={canAfford ? { backgroundColor: 'var(--accent)' } : undefined}
                    className={`mt-auto w-full text-xs py-1.5 rounded font-medium ${
                      canAfford
                        ? 'text-white hover:opacity-90 transition-opacity'
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Redeem' : `Need ${deficit.toLocaleString()} more XP`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {pending.length === 0 && !showForm && (
        <div className="text-center py-16 text-zinc-600 text-sm">
          No rewards set up yet. Add one to get started!
        </div>
      )}

      {/* Redeemed */}
      {redeemed.length > 0 && (
        <section>
          <h3 className="text-xs text-zinc-600 uppercase tracking-widest mb-3">Redeemed</h3>
          <div className="space-y-2">
            {redeemed.map((reward) => (
              <div
                key={reward.id}
                className="bg-zinc-900 border border-zinc-800/60 rounded-lg px-4 py-3 flex items-center gap-3 opacity-40"
              >
                <span className="text-xl">{reward.icon}</span>
                <span className="flex-1 text-sm text-zinc-400 line-through">{reward.title}</span>
                <CheckCheck size={14} className="text-[var(--accent)]" />
                <span className="text-xs text-zinc-700">{reward.cost.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
