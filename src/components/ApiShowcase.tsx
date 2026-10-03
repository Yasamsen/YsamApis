import { Reveal } from '@/components/Reveal';
import {
  MessageSquare, Image, Music, Video, Search, QrCode,
  Cloud, MapPin, FileText, Mail, Smartphone, Zap,
} from 'lucide-react';

const apiCategories = [
  {
    category: 'AI & Intelligence',
    icon: Zap,
    apis: [
      { name: 'AI Chat', icon: MessageSquare, desc: 'Conversational AI' },
      { name: 'AI Image', icon: Image, desc: 'Text-to-image generation' },
      { name: 'AutoAI', icon: Zap, desc: 'Automated AI responses' },
      { name: 'Alya', icon: MessageSquare, desc: 'AI assistant API' },
    ],
  },
  {
    category: 'Social Media',
    icon: Search,
    apis: [
      { name: 'Instagram', icon: Search, desc: 'Profile & media data' },
      { name: 'Instagram Stalker', icon: Search, desc: 'Deep profile lookup' },
      { name: 'TikTok', icon: Video, desc: 'Video downloads' },
      { name: 'TikTok Search', icon: Search, desc: 'Content discovery' },
      { name: 'Facebook', icon: Search, desc: 'Video & media fetch' },
      { name: 'X Stalker', icon: Search, desc: 'Twitter profile data' },
      { name: 'Twitter Video', icon: Video, desc: 'Video downloads' },
      { name: 'Pinterest Search', icon: Search, desc: 'Image discovery' },
    ],
  },
  {
    category: 'Media & Downloads',
    icon: Video,
    apis: [
      { name: 'YouTube Stalker', icon: Search, desc: 'Channel data' },
      { name: 'YouTube MP3', icon: Music, desc: 'Audio extraction' },
      { name: 'YT Play', icon: Video, desc: 'Stream playback' },
      { name: 'Spotify', icon: Music, desc: 'Track metadata' },
      { name: 'TeraBox', icon: Download, desc: 'Cloud file access' },
      { name: 'CapCut', icon: Video, desc: 'Template downloads' },
      { name: 'Alight Motion', icon: Video, desc: 'Project presets' },
    ],
  },
  {
    category: 'Utilities & Info',
    icon: Cloud,
    apis: [
      { name: 'QR Code', icon: QrCode, desc: 'Code generation' },
      { name: 'Weather', icon: Cloud, desc: 'Real-time weather' },
      { name: 'IP Lookup', icon: MapPin, desc: 'Geolocation data' },
      { name: 'Earthquake', icon: Zap, desc: 'Seismic activity' },
      { name: 'Wikipedia', icon: FileText, desc: 'Knowledge search' },
      { name: 'MealDB', icon: FileText, desc: 'Recipe database' },
      { name: 'Lyrics', icon: Music, desc: 'Song lyrics' },
      { name: 'TempMail', icon: Mail, desc: 'Disposable email' },
      { name: 'Text-to-Speech', icon: MessageSquare, desc: 'Voice synthesis' },
    ],
  },
];

function Download({ className }: { className?: string }) {
  return <Video className={className} />;
}

export function ApiShowcase() {
  return (
    <section id="apis" className="relative py-24 lg:py-32">
      <div className="glow-orb h-[500px] w-[500px] bg-accent-600/10 top-[10%] right-[-15%]" />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
            API Catalog
          </p>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-ink-50 sm:text-5xl">
            Explore the full <span className="text-gradient-gold">API collection</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-400">
            Forty-plus endpoints organized into four powerful categories. Each one
            built with the same commitment to speed, reliability, and developer experience.
          </p>
        </Reveal>

        <div className="space-y-12">
          {apiCategories.map((cat, catIdx) => (
            <Reveal key={cat.category} delay={1}>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold-500/15 to-gold-700/10 ring-1 ring-gold-500/20">
                  <cat.icon className="h-5 w-5 text-gold-400" />
                </div>
                <h3 className="font-serif text-2xl font-semibold text-ink-50">
                  {cat.category}
                </h3>
                <span className="text-sm text-ink-500">
                  {cat.apis.length} APIs
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-gold-500/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {cat.apis.map((api, apiIdx) => (
                  <Reveal key={api.name} delay={((apiIdx % 3) + 1) as 1 | 2 | 3}>
                    <div className="shimmer-border group flex items-center gap-4 rounded-xl p-5">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-ink-800/80 ring-1 ring-gold-500/15 transition-all duration-500 group-hover:ring-gold-500/40">
                        <api.icon className="h-5 w-5 text-gold-400 transition-transform duration-500 group-hover:scale-110" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-ink-100 transition-colors duration-300 group-hover:text-gold-200">
                          {api.name}
                        </h4>
                        <p className="truncate text-xs text-ink-500">
                          {api.desc}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
