import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DailyLog from './pages/DailyLog';
import Goals from './pages/Goals';
import Rewards from './pages/Rewards';
import Stats from './pages/Stats';
import { useStore } from './store';

export type Page = 'dashboard' | 'log' | 'goals' | 'rewards' | 'stats';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const resetGoalsIfDue = useStore((s) => s.resetGoalsIfDue);

  useEffect(() => {
    resetGoalsIfDue();
  }, [resetGoalsIfDue]);

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      {page === 'log' && <DailyLog />}
      {page === 'goals' && <Goals />}
      {page === 'rewards' && <Rewards />}
      {page === 'stats' && <Stats />}
    </Layout>
  );
}
