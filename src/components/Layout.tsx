import { LayoutDashboard, CalendarDays, Target, Gift, BarChart2 } from 'lucide-react';
import type { Page } from '../App';

interface Props {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'log', label: 'Daily Log', icon: CalendarDays },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'stats', label: 'Stats', icon: BarChart2 },
];

export default function Layout({ currentPage, onNavigate, children }: Props) {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <aside className="w-52 flex-shrink-0 border-r border-zinc-800/60 flex flex-col">
        <div className="px-5 py-5 border-b border-zinc-800/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
              <Target size={13} className="text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-zinc-200 tracking-wide">Goal Tracker</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                currentPage === id
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-zinc-800/60">
          <p className="text-xs text-zinc-600">Track. Earn. Reward.</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
