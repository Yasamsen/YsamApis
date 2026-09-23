import { Folder, Sparkles } from 'lucide-react';

interface MobileBarProps {
  folders: string[];
  activeFolder: string | null;
  onSelect: (folder: string) => void;
  loading: boolean;
  error: boolean;
}

export default function MobileBar({
  folders,
  activeFolder,
  onSelect,
  loading,
  error,
}: MobileBarProps) {
  return (
    <div className="md:hidden bg-abyss-900/80 backdrop-blur-xl border-b border-sakura-500/10 px-5 pt-5 pb-0 sticky top-0 z-30">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-sakura-400 animate-glow-pulse" />
          <span className="text-[9px] uppercase tracking-[0.2em] text-neon-purple/70 font-medium">
            Media Collection
          </span>
        </div>
        <h1 className="font-display text-xl font-black tracking-tight leading-none">
          <span className="gradient-text">Yasam</span>
          <span className="text-sakura-100"> Gallery</span>
        </h1>
      </div>
      <nav className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 -mx-5 px-5">
        {loading && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer h-9 w-24 rounded-xl flex-shrink-0" />
            ))}
          </>
        )}
        {error && (
          <p className="text-sakura-500 text-sm font-body">Gagal memuat folder</p>
        )}
        {!loading &&
          !error &&
          folders.map((folder) => {
            const active = folder === activeFolder;
            return (
              <button
                key={folder}
                onClick={() => onSelect(folder)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm border whitespace-nowrap flex-shrink-0 transition-all duration-500 font-body ${
                  active
                    ? 'bg-gradient-to-r from-sakura-500/15 to-neon-purple/10 text-white border-sakura-500/40'
                    : 'text-sakura-300/50 border-transparent bg-abyss-700/60'
                }`}
              >
                <Folder
                  size={14}
                  className={active ? 'text-sakura-400' : 'text-sakura-300/40'}
                />
                <span className="capitalize">{folder}</span>
              </button>
            );
          })}
      </nav>
    </div>
  );
}
