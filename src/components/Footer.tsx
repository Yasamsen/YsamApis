import { Github, Linkedin, Mail, Twitter, Zap } from 'lucide-react';
import { useRouter } from '@/context/RouterContext';

export default function Footer() {
  const { navigate } = useRouter();
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-xs">
            <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950"><Zap className="h-4 w-4 fill-current" /></span>
              <span className="text-base font-bold tracking-[-0.03em] text-slate-950 dark:text-white">Sam<span className="text-cyan-500">Api</span></span>
            </button>
            <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">Simple, powerful APIs for developers who build the future.</p>
            <div className="mt-5 flex items-center gap-2">
              {[Github, Twitter, Linkedin, Mail].map((Icon, index) => <button key={index} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"><Icon className="h-3.5 w-3.5" /></button>)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-16 gap-y-8 sm:grid-cols-3">
            <div><h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white">Product</h4><div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400"><button onClick={() => navigate('/docs')} className="text-left hover:text-cyan-600">Documentation</button><button className="text-left hover:text-cyan-600">Changelog</button><button className="text-left hover:text-cyan-600">Status</button></div></div>
            <div><h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white">Resources</h4><div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400"><button className="text-left hover:text-cyan-600">Examples</button><button className="text-left hover:text-cyan-600">SDKs</button><button className="text-left hover:text-cyan-600">Community</button></div></div>
            <div><h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white">Company</h4><div className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400"><button className="text-left hover:text-cyan-600">About</button><button className="text-left hover:text-cyan-600">Contact</button><button className="text-left hover:text-cyan-600">Privacy</button></div></div>
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 dark:border-slate-800 sm:flex-row"><span>© 2024 SamApi. Built for developers.</span><span>Made with care for the developer community.</span></div>
      </div>
    </footer>
  );
}
