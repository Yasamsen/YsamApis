import { useState } from "react";

const METHOD_COLOR = {
  GET: "text-amber border-amber/40 bg-amber/10",
  POST: "text-sky-400 border-sky-400/40 bg-sky-400/10",
  PUT: "text-violet-400 border-violet-400/40 bg-violet-400/10",
  DELETE: "text-rose-400 border-rose-400/40 bg-rose-400/10",
};

export default function EndpointCard({ endpoint }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const methodClass = METHOD_COLOR[endpoint.method] || METHOD_COLOR.GET;

  async function runTest() {
    setLoading(true);
    setResult(null);
    const qs = new URLSearchParams();
    endpoint.params.forEach((p) => {
      if (values[p.name]) qs.set(p.name, values[p.name]);
    });
    const target = `${endpoint.route}${qs.toString() ? `?${qs.toString()}` : ""}`;

    try {
      const res = await fetch(target, { method: endpoint.method });
      const data = await res.json().catch(() => ({ raw: "Respons bukan JSON." }));
      setResult({ ok: res.ok, status: res.status, data });
    } catch (err) {
      setResult({ ok: false, status: 0, data: { message: "Gagal menghubungi endpoint." } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-panel/60 transition-colors hover:border-amber/30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded border px-1.5 py-0.5 text-xs font-mono ${methodClass}`}>
              {endpoint.method}
            </span>
            <code className="truncate font-mono text-sm text-white/90">{endpoint.route}</code>
          </div>
          <p className="mt-1.5 text-sm text-mist">{endpoint.description}</p>
        </div>
        <span className="mt-1 shrink-0 font-mono text-xs text-mist">
          {open ? "tutup" : "coba"}
        </span>
      </button>

      {open && (
        <div className="border-t border-line p-4">
          {endpoint.params.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {endpoint.params.map((p) => (
                <label key={p.name} className="block">
                  <span className="mb-1 block font-mono text-xs text-mist">
                    {p.name}
                    {p.required && <span className="text-amber"> *</span>}
                    <span className="text-mist/60"> — {p.type}</span>
                  </span>
                  <input
                    type="text"
                    placeholder={p.description || p.name}
                    value={values[p.name] || ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [p.name]: e.target.value }))
                    }
                    className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-white/90 placeholder:text-mist/50 focus:border-amber/50"
                  />
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-mist">Endpoint ini tidak butuh parameter.</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={runTest}
              disabled={loading}
              className="rounded-md bg-amber px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
            >
              {loading ? "Menjalankan..." : "Jalankan endpoint"}
            </button>
            <a
              href={endpoint.route}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-mist underline decoration-line underline-offset-4 hover:text-amber"
            >
              Buka di tab baru
            </a>
          </div>

          {result && (
            <div className="mt-4">
              <div className="mb-1 font-mono text-xs text-mist">
                status: {result.status || "-"}
              </div>
              <pre className="max-h-64 overflow-auto rounded-md border border-line bg-ink p-3 text-xs text-white/90">
{JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
