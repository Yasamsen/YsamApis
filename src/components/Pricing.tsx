import { Reveal } from '@/components/Reveal';
import { Check, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Perfect for exploring and testing',
    features: [
      'Access to 15+ basic APIs',
      '100 requests per day',
      'Community support',
      'Standard rate limits',
      'Basic documentation',
    ],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/ month',
    desc: 'For developers building real products',
    features: [
      'Access to all 40+ APIs',
      '10,000 requests per day',
      'Priority support',
      'Higher rate limits',
      'Advanced documentation',
      'No attribution required',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For teams and high-volume usage',
    features: [
      'Unlimited API access',
      'Custom rate limits',
      'Dedicated support channel',
      'SLA guarantee',
      'On-premise option',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 lg:py-32">
      <div className="glow-orb h-[400px] w-[400px] bg-gold-600/10 top-[30%] left-[-10%]" />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-400">
            Pricing
          </p>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-ink-50 sm:text-5xl">
            Simple, transparent <span className="text-gradient-gold">pricing</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink-400">
            Start free, scale as you grow. No hidden fees, no surprises.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={((i % 3) + 1) as 1 | 2 | 3}>
              <div
                className={`relative h-full rounded-3xl p-8 transition-all duration-500 ${
                  plan.highlight
                    ? 'glass-gold border-2 border-gold-500/30 shadow-2xl shadow-gold-700/10 lg:scale-105'
                    : 'shimmer-border'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-ink-950 shadow-lg">
                      <Sparkles className="h-3.5 w-3.5" />
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="font-serif text-2xl font-bold text-ink-50">{plan.name}</h3>
                <p className="mt-2 text-sm text-ink-400">{plan.desc}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-serif text-5xl font-bold text-gradient-gold">
                    {plan.price}
                  </span>
                  <span className="text-sm text-ink-400">{plan.period}</span>
                </div>

                <ul className="mt-8 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-ink-300">
                      <Check
                        className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                          plan.highlight ? 'text-gold-400' : 'text-accent-400'
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href="#cta"
                  className={`btn-shine mt-8 flex w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-semibold transition-all duration-400 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-ink-950 shadow-lg shadow-gold-700/20 hover:brightness-110'
                      : 'border border-ink-700 bg-ink-900/50 text-ink-100 hover:border-gold-500/40 hover:text-gold-200'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
