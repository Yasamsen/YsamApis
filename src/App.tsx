import { useState, useEffect, useCallback, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import MobileBar from '@/components/MobileBar';
import MediaCard from '@/components/MediaCard';
import Lightbox from '@/components/Lightbox';
import { fetchFolders, fetchFolderMedia } from '@/lib/gallery';

interface Petal {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
}

export default function App() {
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [media, setMedia] = useState<string[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [folderError, setFolderError] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const petalsRef = useRef<Petal[]>([]);

  if (petalsRef.current.length === 0) {
    petalsRef.current = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 8,
      size: 6 + Math.random() * 10,
    }));
  }

  useEffect(() => {
    fetchFolders()
      .then((f) => {
        setFolders(f.map((folder) => folder.name));
        if (f.length > 0) setActiveFolder(f[0].name);
        setLoadingFolders(false);
      })
      .catch(() => {
        setFolderError(true);
        setLoadingFolders(false);
      });
  }, []);

  const loadMedia = useCallback(async (folder: string) => {
    setLoadingMedia(true);
    setMediaError(false);
    setMedia([]);
    try {
      const items = await fetchFolderMedia(folder);
      setMedia(items.map((item) => item.url));
    } catch {
      setMediaError(true);
    } finally {
      setLoadingMedia(false);
    }
  }, []);

  useEffect(() => {
    if (activeFolder) loadMedia(activeFolder);
  }, [activeFolder, loadMedia]);

  const handleSelectFolder = (folder: string) => {
    setActiveFolder(folder);
  };

  const handleNavigate = (index: number) => {
    setLightboxIndex(index);
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Sakura petals falling animation */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {petalsRef.current.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 animate-sakura-fall"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          >
            <div
              style={{
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: 'linear-gradient(135deg, #f48fb1, #ec407a)',
                borderRadius: '50% 0 50% 50%',
                opacity: 0.3,
                transform: 'rotate(45deg)',
              }}
            />
          </div>
        ))}
      </div>

      <Sidebar
        folders={folders}
        activeFolder={activeFolder}
        onSelect={handleSelectFolder}
        loading={loadingFolders}
        error={folderError}
      />

      <div className="flex-1 min-w-0 flex flex-col relative z-10">
        <MobileBar
          folders={folders}
          activeFolder={activeFolder}
          onSelect={handleSelectFolder}
          loading={loadingFolders}
          error={folderError}
        />

        <main className="flex-1 p-6 md:p-10">
          <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl md:text-4xl font-black tracking-tight capitalize gradient-text animate-fade-in">
                {activeFolder || 'Gallery'}
              </h2>
              <Sparkles
                size={20}
                className="text-sakura-400/60 animate-glow-pulse hidden sm:block"
              />
            </div>
            {!loadingMedia && !mediaError && media.length > 0 && (
              <span className="text-sakura-300/50 text-sm font-body tracking-wide animate-fade-in">
                {media.length} item
              </span>
            )}
          </div>

          {loadingMedia && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="shimmer aspect-[4/5] rounded-2xl"
                  style={{ animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          )}

          {!loadingMedia && mediaError && (
            <div className="text-center py-20">
              <p className="text-sakura-500 text-sm font-body">
                Gagal memuat folder ini.
              </p>
            </div>
          )}

          {!loadingMedia && !mediaError && media.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sakura-300/40 text-sm font-body">
                Folder ini kosong.
              </p>
            </div>
          )}

          {!loadingMedia && !mediaError && media.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
              {media.map((url, index) => (
                <MediaCard
                  key={`${url}-${index}`}
                  url={url}
                  index={index}
                  onClick={() => setLightboxIndex(index)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {lightboxIndex !== null && media.length > 0 && (
        <Lightbox
          items={media}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
