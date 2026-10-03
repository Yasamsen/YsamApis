import { Reveal } from '@/components/Reveal';
import { TrendingUp, Clock, Server, Users } from 'lucide-react';

const stats = [
  { icon: Server, value: '40+', label: 'API Endpoints', sub: 'Across 8 categories' },
  { icon: Clock, value: '99.9%', label: 'Uptime', sub: 'Enterprise reliability' },
  { icon: TrendingUp, value: '<200ms', label: 'Avg Response', sub: 'Globally distributed' },
  { icon: Users, value: '50K+', label: 'Daily Requests', sub: 'And growing fast' },
];

export function Stats() {
  return (
    <section id="stats" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
            By the Numbers
          </p>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-ink-50 sm:text-5xl">
            Performance that <span className="text-gradient-gold">speaks for itself</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.label} delay={((i % 4) + 1) as 1 | 2 | 3 | 4}>
              <div className="shimmer-border group h-full rounded-2xl p-8 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500/10 to-gold-700/10 ring-1 ring-gold-500/20 transition-all duration-500 group-hover:ring-gold-500/40">
                  <stat.icon className="h-7 w-7 text-gold-400" />
                </div>
                <div className="font-serif text-4xl font-bold text-gradient-gold">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm font-semibold text-ink-100">
                  {stat.label}
                </div>
                <div className="mt-1 text-xs text-ink-500">
                  {stat.sub}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
