import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export default function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); };
  return <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5"><span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{language}</span><button onClick={copy} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 transition-colors hover:text-white">{copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}{copied ? 'Copied' : 'Copy'}</button></div><pre className="max-h-96 overflow-auto p-4 font-mono text-[11px] leading-5 text-slate-300"><code>{code}</code></pre></div>;
}
