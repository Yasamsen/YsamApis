import { ArrowRight, Zap, Shield, Globe } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-28 pb-16">
      {/* Background glow orbs */}
      <div className="glow-orb h-[500px] w-[500px] bg-gold-600/20 top-[-10%] left-[-5%] animate-glow" />
      <div className="glow-orb h-[400px] w-[400px] bg-accent-600/15 bottom-[10%] right-[-5%] animate-glow" style={{ animationDelay: '2s' }} />
      <div className="glow-orb h-[300px] w-[300px] bg-gold-500/10 top-[40%] left-[50%] animate-float" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(234,180,66,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(234,180,66,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        {/* Badge */}
        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-gold-500/20 bg-gold-500/5 px-5 py-2 opacity-0"
          style={{ animation: 'fadeUp 0.8s ease-out 0.1s forwards' }}
        >
          <span className="flex h-2 w-2 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(95,179,161,0.8)]" />
          <span className="text-sm font-medium tracking-wide text-gold-200">
            40+ Premium APIs · Unified Platform
          </span>
        </div>

        {/* Headline */}
        <h1
          className="font-serif text-5xl font-bold leading-[1.1] tracking-tight text-ink-50 sm:text-6xl lg:text-7xl opacity-0"
          style={{ animation: 'fadeUp 0.8s ease-out 0.2s forwards' }}
        >
          Every API you need,
          <br />
          <span className="text-gradient-gold">elevated to perfection</span>
        </h1>

        {/* Subtitle */}
        <p
          className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-ink-300 sm:text-xl opacity-0"
          style={{ animation: 'fadeUp 0.8s ease-out 0.35s forwards' }}
        >
          A meticulously crafted toolkit of powerful APIs — from AI chat to media
          downloads, stalker tools to utility services. One platform, infinite possibilities.
        </p>

        {/* CTAs */}
        <div
          className="mt-12 flex flex-col items-center justify-center gap-4 opacity-0 sm:flex-row"
          style={{ animation: 'fadeUp 0.8s ease-out 0.5s forwards' }}
        >
          <a
            href="#apis"
            className="btn-shine group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-8 py-4 text-base font-semibold text-ink-950 shadow-xl shadow-gold-700/25 transition-all duration-400 hover:shadow-gold-500/30 hover:brightness-110"
          >
            Explore APIs
            <ArrowRight className="h-5 w-5 transition-transform duration-400 group-hover:translate-x-1" />
          </a>
          <a
            href="#cta"
            className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/50 px-8 py-4 text-base font-semibold text-ink-100 backdrop-blur-sm transition-all duration-400 hover:border-gold-500/40 hover:bg-ink-800/50 hover:text-gold-200"
          >
            View Documentation
          </a>
        </div>

        {/* Feature pills */}
        <div
          className="mt-16 flex flex-wrap items-center justify-center gap-6 opacity-0"
          style={{ animation: 'fadeUp 0.8s ease-out 0.65s forwards' }}
        >
          {[
            { icon: Zap, label: 'Lightning Fast' },
            { icon: Shield, label: 'Secure & Reliable' },
            { icon: Globe, label: 'Global Coverage' },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-sm font-medium text-ink-400"
            >
              <item.icon className="h-4 w-4 text-gold-400" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
