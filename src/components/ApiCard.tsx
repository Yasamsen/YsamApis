import { ArrowUpRight, Check, Copy, Terminal } from 'lucide-react';
import { useState } from 'react';
import { ApiDefinition } from '@/apis/registry';
import { useRouter } from '@/context/RouterContext';
import ApiIcon from './ApiIcon';

export default function ApiCard({ api }: { api: ApiDefinition }) {
  const { navigate } = useRouter();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(`https://samapi.example.com${api.endpoint}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:shadow-black/20">
      <div className="mb-5 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><ApiIcon name={api.icon} /></div><span className="rounded-md bg-cyan-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400">{api.category}</span></div>
      <h3 className="mb-2 text-[16px] font-bold tracking-[-0.02em] text-slate-950 dark:text-white">{api.name}</h3>
      <p className="mb-5 min-h-[48px] text-sm leading-6 text-slate-500 dark:text-slate-400">{api.description}</p>
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800"><div className="flex items-center gap-2"><span className={`rounded-md px-1.5 py-1 text-[10px] font-bold ${api.method === 'GET' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'}`}>{api.method}</span><code className="text-xs text-slate-400">{api.endpoint}</code></div><button onClick={copy} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white" aria-label="Copy endpoint">{copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}</button></div>
      <div className="mt-4 flex items-center gap-3"><button onClick={() => navigate(`/docs/${api.slug}`)} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-950 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">View docs <ArrowUpRight className="h-3.5 w-3.5" /></button><button onClick={() => navigate(`/docs/${api.slug}?try=true`)} className="flex h-9 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:text-white" aria-label="Try API"><Terminal className="h-3.5 w-3.5" /></button></div>
    </div>
  );
}
