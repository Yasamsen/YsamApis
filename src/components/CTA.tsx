import { Reveal } from '@/components/Reveal';
import { ArrowRight, Terminal } from 'lucide-react';

export function CTA() {
  return (
    <section id="cta" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-gold-500/20 bg-gradient-to-br from-ink-900 via-ink-950 to-ink-900 p-10 text-center lg:p-16">
            {/* Glow orbs inside */}
            <div className="glow-orb h-[300px] w-[300px] bg-gold-600/20 top-[-20%] left-[-10%] animate-glow" />
            <div className="glow-orb h-[200px] w-[200px] bg-accent-600/15 bottom-[-10%] right-[-5%] animate-glow" style={{ animationDelay: '1.5s' }} />

            <div className="relative z-10">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-gold-700 shadow-xl shadow-gold-700/30">
                <Terminal className="h-8 w-8 text-ink-950" />
              </div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-ink-50 sm:text-4xl lg:text-5xl">
                Ready to build something <span className="text-gradient-gold">extraordinary?</span>
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
                Get your API key in seconds. Start with our free tier — no credit card required.
                Your next great project starts here.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href="#"
                  className="btn-shine group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-8 py-4 text-base font-semibold text-ink-950 shadow-xl shadow-gold-700/25 transition-all duration-400 hover:brightness-110 hover:shadow-gold-500/30"
                >
                  Get Your API Key
                  <ArrowRight className="h-5 w-5 transition-transform duration-400 group-hover:translate-x-1" />
                </a>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/50 px-8 py-4 text-base font-semibold text-ink-100 transition-all duration-400 hover:border-gold-500/40 hover:text-gold-200"
                >
                  Browse Features
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
