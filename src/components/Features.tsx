import { Reveal } from '@/components/Reveal';
import {
  MessageSquare, Image, Music, Download, Search, QrCode,
  Cloud, MapPin, Newspaper, Code2, Mail, Shield,
} from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: 'AI Chat & Assistant',
    desc: 'Intelligent conversational AI ready to power your applications with natural language understanding.',
    tag: 'AI',
  },
  {
    icon: Image,
    title: 'AI Image Generation',
    desc: 'Generate stunning visuals from text prompts with cutting-edge diffusion models.',
    tag: 'AI',
  },
  {
    icon: Music,
    title: 'Music & Lyrics',
    desc: 'Search tracks, fetch lyrics, and retrieve Spotify metadata in seconds.',
    tag: 'Media',
  },
  {
    icon: Download,
    title: 'Media Downloader',
    desc: 'Download from YouTube, TikTok, Instagram, Facebook, Twitter, TeraBox, and CapCut.',
    tag: 'Media',
  },
  {
    icon: Search,
    title: 'Stalker & Search',
    desc: 'Look up profiles and content across social platforms with detailed metadata.',
    tag: 'Tools',
  },
  {
    icon: QrCode,
    title: 'QR Code Generator',
    desc: 'Create beautiful, customizable QR codes for any URL, text, or contact.',
    tag: 'Tools',
  },
  {
    icon: Cloud,
    title: 'Weather Data',
    desc: 'Real-time weather information for any location around the globe.',
    tag: 'Utility',
  },
  {
    icon: MapPin,
    title: 'IP Lookup',
    desc: 'Geolocate and retrieve detailed information about any IP address.',
    tag: 'Utility',
  },
  {
    icon: Newspaper,
    title: 'Wikipedia & News',
    desc: 'Access the world\'s knowledge with Wikipedia search and earthquake data feeds.',
    tag: 'Info',
  },
  {
    icon: Code2,
    title: 'Developer-First API',
    desc: 'Clean REST endpoints, consistent response formats, and comprehensive docs.',
    tag: 'Platform',
  },
  {
    icon: Mail,
    title: 'TempMail & Utilities',
    desc: 'Temporary email, text-to-speech, and everyday utilities at your fingertips.',
    tag: 'Utility',
  },
  {
    icon: Shield,
    title: 'Reliable & Secure',
    desc: 'Enterprise-grade infrastructure with 99.9% uptime and encrypted endpoints.',
    tag: 'Platform',
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32">
      <div className="glow-orb h-[400px] w-[400px] bg-gold-700/10 top-[20%] right-[-10%]" />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
            Capabilities
          </p>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-ink-50 sm:text-5xl">
            A universe of APIs, <span className="text-gradient-gold">one platform</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-400">
            From artificial intelligence to social media, from utilities to entertainment —
            every tool you need, beautifully unified.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <article className="shimmer-border group h-full rounded-2xl p-7">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-ink-800 to-ink-900 ring-1 ring-gold-500/20 transition-all duration-500 group-hover:ring-gold-500/50">
                    <feature.icon className="h-6 w-6 text-gold-400 transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <span className="rounded-full border border-gold-500/15 bg-gold-500/5 px-3 py-1 text-xs font-medium text-gold-300">
                    {feature.tag}
                  </span>
                </div>
                <h3 className="mb-3 font-serif text-xl font-semibold text-ink-50 transition-colors duration-300 group-hover:text-gold-200">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-400">
                  {feature.desc}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
