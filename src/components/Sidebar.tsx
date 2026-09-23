import { Folder, ChevronRight, Sparkles } from 'lucide-react';

interface SidebarProps {
  folders: string[];
  activeFolder: string | null;
  onSelect: (folder: string) => void;
  loading: boolean;
  error: boolean;
}

export default function Sidebar({
  folders,
  activeFolder,
  onSelect,
  loading,
  error,
}: SidebarProps) {
  return (
    <aside className="w-[270px] flex-shrink-0 bg-abyss-900/80 backdrop-blur-xl border-r border-sakura-500/10 p-7 sticky top-0 h-screen overflow-y-auto scrollbar-hide hidden md:block">
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-sakura-400 animate-glow-pulse" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-neon-purple/70 font-medium">
            Media Collection
          </span>
        </div>
        <h1 className="font-display text-3xl font-black tracking-tight leading-none">
          <span className="gradient-text">Yasam</span>
          <span className="text-sakura-100"> Gallery</span>
        </h1>
        <p className="text-sakura-300/40 text-xs mt-2 font-body tracking-wide">
          コレクション • Private anime media
        </p>
      </div>

      <div className="h-px bg-gradient-to-r from-sakura-500/30 via-neon-purple/20 to-transparent mb-6" />

      <nav className="flex flex-col gap-1.5">
        {loading && (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="shimmer h-11 rounded-xl"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        )}

        {error && (
          <p className="text-sakura-500 text-sm px-3 py-2 font-body">
            Gagal memuat folder
          </p>
        )}

        {!loading && !error && folders.length === 0 && (
          <p className="text-sakura-300/40 text-sm px-3 py-2 font-body">
            Tidak ada folder
          </p>
        )}

        {!loading &&
          !error &&
          folders.map((folder, i) => {
            const active = folder === activeFolder;
            return (
              <button
                key={folder}
                onClick={() => onSelect(folder)}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-sm border transition-all duration-700 animate-fade-up text-left font-body ${
                  active
                    ? 'bg-gradient-to-r from-sakura-500/15 to-neon-purple/10 text-white border-sakura-500/40 neon-border'
                    : 'text-sakura-300/50 border-transparent hover:bg-abyss-700/60 hover:text-sakura-100 hover:border-sakura-500/20'
                }`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  opacity: 0,
                }}
              >
                <Folder
                  size={16}
                  className={`transition-all duration-500 ${
                    active
                      ? 'text-sakura-400'
                      : 'text-sakura-300/40 group-hover:text-sakura-300'
                  }`}
                />
                <span className="capitalize flex-1 truncate">{folder}</span>
                {active && (
                  <ChevronRight
                    size={15}
                    className="text-sakura-400 animate-slide-right"
                  />
                )}
              </button>
            );
          })}
      </nav>

      <div className="mt-10 pt-6 border-t border-sakura-500/10">
        <div className="flex items-center gap-2 text-sakura-300/30 text-xs font-body">
          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-glow-pulse" />
          <span>Connected to repo</span>
        </div>
      </div>
    </aside>
  );
}
