import { useState, useEffect, useRef } from 'react';
import { Download, Play, Loader2 } from 'lucide-react';
import { isImageFile, isVideoFile, getBlobUrl, downloadMedia } from '@/lib/gallery';

interface MediaCardProps {
  url: string;
  index: number;
  onClick: () => void;
}

export default function MediaCard({ url, index, onClick }: MediaCardProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [errored, setErrored] = useState(false);
  const cancelled = useRef(false);
  const isImg = isImageFile(url);
  const isVid = isVideoFile(url);

  useEffect(() => {
    cancelled.current = false;

    getBlobUrl(url)
      .then((b) => {
        if (cancelled.current) return;
        setBlobUrl(b);
      })
      .catch(() => {
        if (!cancelled.current) setErrored(true);
      });

    return () => {
      cancelled.current = true;
    };
  }, [url]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadMedia(url);
    } catch {
      // ignore
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="group bg-abyss-800/60 border border-sakura-500/10 rounded-2xl overflow-hidden cursor-pointer relative transition-all duration-700 hover:-translate-y-2 hover:border-sakura-500/40 hover:neon-glow animate-scale-in"
      style={{
        animationDelay: `${index * 0.09}s`,
        opacity: 0,
      }}
      onClick={onClick}
    >
      <div className="relative w-full aspect-[4/5] bg-abyss-700 overflow-hidden">
        {!loaded && !errored && (
          <div className="absolute inset-0 shimmer" />
        )}
        {errored && (
          <div className="absolute inset-0 flex items-center justify-center text-sakura-300/40 text-xs font-body">
            Gagal memuat
          </div>
        )}
        {blobUrl && !errored && isImg && (
          <img
            src={blobUrl}
            alt=""
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-[1.5s] ease-out ${
              loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } group-hover:scale-110`}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
        {blobUrl && !errored && isVid && (
          <video
            src={blobUrl}
            muted
            preload="metadata"
            onLoadedData={() => setLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-[1.5s] ease-out ${
              loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } group-hover:scale-110`}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
        {blobUrl && !errored && !isImg && !isVid && (
          <div className="absolute inset-0 flex items-center justify-center text-sakura-300/40 text-xs font-body">
            File tidak didukung
          </div>
        )}

        {isVid && loaded && (
          <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-abyss-950/70 backdrop-blur-md flex items-center justify-center border border-sakura-500/20">
            <Play size={14} className="text-sakura-300 ml-0.5" fill="currentColor" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-abyss-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </div>

      <button
        onClick={handleDownload}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-abyss-950/60 backdrop-blur-md border border-sakura-500/20 text-sakura-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 hover:bg-sakura-500 hover:text-white hover:scale-110 z-10"
        aria-label="Download"
      >
        {downloading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Download size={15} />
        )}
      </button>
    </div>
  );
}
