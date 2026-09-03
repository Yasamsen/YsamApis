import { Activity, BookOpen, ChevronDown, Menu, Moon, Sun, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from '@/context/RouterContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { path, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [apiMenuOpen, setApiMenuOpen] = useState(false);
  const isDocs = path === '/docs' || path.startsWith('/docs/');

  const go = (to: string) => {
    navigate(to);
    setMobileOpen(false);
    setApiMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <button onClick={() => go('/')} className="group flex items-center gap-3" aria-label="SamApi home">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-950/20 transition-transform group-hover:scale-105 dark:bg-white dark:text-slate-950">
            <Zap className="h-4 w-4 fill-current" />
          </span>
          <span className="text-[17px] font-bold tracking-[-0.03em] text-slate-950 dark:text-white">Sam<span className="text-cyan-500">Api</span></span>
        </button>

        <nav className="hidden items-center gap-1 md:flex">
          <button onClick={() => go('/')} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${path === '/' ? 'text-slate-950 dark:text-white' : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'}`}>Home</button>
          <div className="relative">
            <button onClick={() => setApiMenuOpen(!apiMenuOpen)} className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isDocs ? 'text-slate-950 dark:text-white' : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'}`}>
              APIs <ChevronDown className={`h-3.5 w-3.5 transition-transform ${apiMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {apiMenuOpen && <div className="absolute left-0 top-11 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900">
              <button onClick={() => go('/docs')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"><BookOpen className="h-4 w-4 text-cyan-500" /> All APIs</button>
              <button onClick={() => go('/docs/instagram')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"><Activity className="h-4 w-4 text-cyan-500" /> Popular APIs</button>
            </div>}
          </div>
          <button onClick={() => go('/docs')} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${isDocs ? 'text-slate-950 dark:text-white' : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'}`}>Documentation</button>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">API Online</span>
          </div>
          <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Toggle color theme">
            {theme === 'dark' ? <Sun className="h-[17px] w-[17px]" /> : <Moon className="h-[17px] w-[17px]" />}
          </button>
          <button onClick={() => go('/docs')} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">Get started</button>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 md:hidden dark:text-slate-300" aria-label="Toggle menu">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {mobileOpen && <div className="border-t border-slate-200 bg-white px-5 pb-5 pt-3 dark:border-slate-800 dark:bg-slate-950 md:hidden">
        <div className="flex flex-col gap-1">
          <button onClick={() => go('/')} className="rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Home</button>
          <button onClick={() => go('/docs')} className="rounded-lg px-3 py-3 text-left text-sm font-medium text-slate-600 dark:text-slate-300">Documentation</button>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /><span className="text-xs font-semibold text-emerald-600">API Online</span></div>
            <button onClick={toggleTheme} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Theme</button>
          </div>
        </div>
      </div>}
    </header>
  );
}
