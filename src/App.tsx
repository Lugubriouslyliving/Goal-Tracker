import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DailyLog from './pages/DailyLog';
import Goals from './pages/Goals';
import Rewards from './pages/Rewards';
import Stats from './pages/Stats';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import { useStore } from './store';
import { useSettings, ACCENT_VALUES } from './store/settings';
import { supabase, isConfigured } from './lib/supabase';

export type Page = 'dashboard' | 'log' | 'goals' | 'rewards' | 'stats' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const { userId, isLocalMode, isLoading, setUserId, setLocalMode, resetGoalsIfDue, initializeFromSupabase } = useStore();
  const { accentColor } = useSettings();
  const [authReady, setAuthReady] = useState(!isConfigured);

  // Apply accent color CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', ACCENT_VALUES[accentColor]);
  }, [accentColor]);

  // Auth state management
  useEffect(() => {
    if (!isConfigured || !supabase) {
      setAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        initializeFromSupabase(session.user.id).then(() => setAuthReady(true));
      } else {
        setAuthReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        setLocalMode(false);
        initializeFromSupabase(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setLocalMode(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset periodic goals on mount
  useEffect(() => {
    resetGoalsIfDue();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!authReady || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-600 text-sm">Loading…</div>
      </div>
    );
  }

  // Show auth page if Supabase is configured but user is not signed in and not in local mode
  if (isConfigured && !userId && !isLocalMode) {
    return <Auth onLocalMode={() => setLocalMode(true)} />;
  }

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'log'       && <DailyLog />}
      {page === 'goals'     && <Goals />}
      {page === 'rewards'   && <Rewards />}
      {page === 'stats'     && <Stats />}
      {page === 'settings'  && <Settings />}
    </Layout>
  );
}
