import { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { isImageFile, isVideoFile, getBlobUrl, downloadMedia } from '@/lib/gallery';

interface LightboxProps {
  items: string[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
}: LightboxProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const cancelled = useRef(false);
  const url = items[index];
  const isImg = isImageFile(url);
  const isVid = isVideoFile(url);

  useEffect(() => {
    cancelled.current = false;
    setLoading(true);
    setBlobUrl(null);

    getBlobUrl(url)
      .then((b) => {
        if (cancelled.current) return;
        setBlobUrl(b);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled.current) setLoading(false);
      });

    return () => {
      cancelled.current = true;
    };
  }, [url]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        setDirection('left');
        onNavigate((index - 1 + items.length) % items.length);
      }
      if (e.key === 'ArrowRight') {
        setDirection('right');
        onNavigate((index + 1) % items.length);
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [index, items.length, onClose, onNavigate]);

  const handlePrev = () => {
    setDirection('left');
    onNavigate((index - 1 + items.length) % items.length);
  };
  const handleNext = () => {
    setDirection('right');
    onNavigate((index + 1) % items.length);
  };

  const handleDownload = async () => {
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

  const animClass =
    direction === 'right' ? 'animate-slide-right' : 'animate-slide-left';

  return (
    <div
      className="fixed inset-0 bg-abyss-950/95 backdrop-blur-2xl flex items-center justify-center z-50 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 via-transparent to-sakura-500/5 pointer-events-none" />

      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-11 h-11 rounded-full bg-sakura-500/10 border border-sakura-500/20 text-sakura-100 flex items-center justify-center transition-all duration-500 hover:bg-sakura-500/30 hover:scale-110 z-20"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      <button
        onClick={handlePrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-sakura-500/10 border border-sakura-500/20 text-sakura-100 flex items-center justify-center transition-all duration-500 hover:bg-sakura-500/30 hover:scale-110 z-20"
        aria-label="Previous"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-sakura-500/10 border border-sakura-500/20 text-sakura-100 flex items-center justify-center transition-all duration-500 hover:bg-sakura-500/30 hover:scale-110 z-20"
        aria-label="Next"
      >
        <ChevronRight size={24} />
      </button>

      <div className={`relative max-w-[88vw] max-h-[88vh] ${animClass} z-10`}>
        {loading && (
          <div className="w-[60vw] h-[60vh] shimmer rounded-2xl flex items-center justify-center">
            <Loader2 size={36} className="text-sakura-400/50 animate-spin" />
          </div>
        )}
        {!loading && blobUrl && isImg && (
          <img
            src={blobUrl}
            alt=""
            className="max-w-[88vw] max-h-[88vh] rounded-2xl object-contain neon-glow"
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
        {!loading && blobUrl && isVid && (
          <video
            src={blobUrl}
            controls
            autoPlay
            className="max-w-[88vw] max-h-[88vh] rounded-2xl neon-glow"
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
        {!loading && blobUrl && !isImg && !isVid && (
          <div className="text-sakura-300/50 text-sm font-body">
            File tidak didukung
          </div>
        )}
      </div>

      <button
        onClick={handleDownload}
        className="absolute bottom-6 right-6 w-11 h-11 rounded-full bg-sakura-500/10 border border-sakura-500/20 text-sakura-100 flex items-center justify-center transition-all duration-500 hover:bg-sakura-500 hover:text-white hover:scale-110 z-20"
        aria-label="Download"
      >
        {downloading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Download size={18} />
        )}
      </button>

      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-sakura-300/60 text-sm font-body tracking-wider z-20">
        {index + 1} <span className="text-sakura-500/40">/</span> {items.length}
      </div>
    </div>
  );
}
