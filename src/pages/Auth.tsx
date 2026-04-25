import { useState } from 'react';
import { Target } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Props {
  onLocalMode: () => void;
}

export default function Auth({ onLocalMode }: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase!.auth.signUp({ email, password });
        if (err) throw err;
        setVerificationSent(true);
      } else {
        const { error: err } = await supabase!.auth.signInWithPassword({ email, password });
        if (err) throw err;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto px-4">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Check your email</h2>
          <p className="text-zinc-500 text-sm mb-6">
            We sent a confirmation link to{' '}
            <span className="text-zinc-300">{email}</span>.
            Click it to activate your account, then sign in.
          </p>
          <button
            onClick={() => { setVerificationSent(false); setMode('signin'); }}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-full max-w-sm mx-auto px-4">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Target size={16} className="text-emerald-400" />
          </div>
          <span className="text-lg font-semibold text-zinc-100">Goal Tracker</span>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex gap-1 mb-6 bg-zinc-800/50 p-1 rounded-lg">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                  mode === m ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="••••••••"
              />
              {mode === 'signup' && (
                <p className="text-xs text-zinc-600 mt-1">Minimum 6 characters</p>
              )}
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded px-3 py-2">
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors font-medium"
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={onLocalMode}
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Continue without account (local only)
          </button>
        </div>
      </div>
    </div>
  );
}
