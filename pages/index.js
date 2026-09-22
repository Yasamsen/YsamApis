import Head from "next/head";
import { useMemo, useState } from "react";
import { scanEndpoints, groupByCategory } from "../lib/scanEndpoints";
import EndpointCard from "../components/EndpointCard";

export async function getStaticProps() {
  const endpoints = scanEndpoints();
  return { props: { endpoints } };
}

export default function Home({ endpoints }) {
  const [query, setQuery] = useState("");

  const allCategories = useMemo(
    () => groupByCategory(endpoints).map(([c]) => c),
    [endpoints]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return endpoints;
    return endpoints.filter(
      (e) =>
        e.route.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }, [endpoints, query]);

  const grouped = groupByCategory(filtered);

  return (
    <>
      <Head>
        <title>API Hub — direktori endpoint otomatis</title>
        <meta
          name="description"
          content="Direktori endpoint API yang terdeteksi otomatis dari struktur folder, siap deploy di Vercel."
        />
      </Head>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
        <header>
          <p className="font-mono text-xs tracking-wide text-amber">api hub</p>
          <h1 className="mt-3 font-sans text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Direktori API kamu, terbit otomatis.
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-mist">
            Setiap file baru di{" "}
            <code className="rounded bg-panel px-1.5 py-0.5 font-mono text-sm text-white/90">
              pages/api/kategori/nama.js
            </code>{" "}
            langsung muncul di halaman ini begitu proyek di-deploy ulang di Vercel.
            Tidak ada daftar endpoint yang perlu diperbarui manual.
          </p>
          <p className="mt-5 font-mono text-xs text-mist">
            {endpoints.length} endpoint · {allCategories.length} kategori
          </p>
        </header>

        <div className="mt-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari endpoint, mis. tiktok atau search/music"
            className="w-full rounded-md border border-line bg-panel/60 px-4 py-3 text-sm text-white placeholder:text-mist/50 focus:border-amber/50"
          />
        </div>

        {allCategories.length > 1 && (
          <nav className="mt-5 flex flex-wrap gap-2">
            {allCategories.map((c) => (
              <a
                key={c}
                href={`#${c}`}
                className="rounded-full border border-line px-3 py-1 font-mono text-xs text-mist hover:border-amber/40 hover:text-amber"
              >
                {c}
              </a>
            ))}
          </nav>
        )}

        <div className="mt-12 space-y-12">
          {grouped.length === 0 && (
            <p className="text-mist">Tidak ada endpoint yang cocok dengan pencarian ini.</p>
          )}

          {grouped.map(([category, items]) => (
            <section key={category} id={category}>
              <h2 className="font-sans text-lg font-medium text-white">{category}</h2>
              <p className="mt-1 text-sm text-mist">
                {items.length} endpoint pada kategori ini.
              </p>
              <div className="mt-4 space-y-3">
                {items.map((ep) => (
                  <EndpointCard key={ep.route} endpoint={ep} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-20 border-t border-line pt-6 font-mono text-xs text-mist">
          dibangun dengan Next.js — siap deploy di Vercel
        </footer>
      </main>
    </>
  );
}
