import { Sparkles, Github, Twitter, Mail } from 'lucide-react';

const sections = [
  {
    title: 'Product',
    links: ['Features', 'APIs', 'Pricing', 'Documentation'],
  },
  {
    title: 'Company',
    links: ['About', 'Blog', 'Careers', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['API Reference', 'Guides', 'Status', 'Community'],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-ink-800/60 bg-ink-950 pt-20 pb-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            <a href="#" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-700 shadow-lg shadow-gold-700/30">
                <Sparkles className="h-5 w-5 text-ink-950" />
              </div>
              <span className="font-serif text-xl font-bold text-ink-50">Enhancer</span>
            </a>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-400">
              A premium API platform bringing together 40+ powerful endpoints
              into one beautifully designed, developer-first toolkit.
            </p>
            <div className="mt-6 flex gap-3">
              {[
                { icon: Github, label: 'GitHub' },
                { icon: Twitter, label: 'Twitter' },
                { icon: Mail, label: 'Email' },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink-800 bg-ink-900/50 text-ink-400 transition-all duration-400 hover:border-gold-500/40 hover:text-gold-300"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gold-400">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-ink-400 transition-colors duration-300 hover:text-gold-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-ink-800/60 pt-8 sm:flex-row">
          <p className="text-sm text-ink-500">
            © 2026 Enhancer. Crafted with precision.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-ink-500 transition-colors hover:text-gold-300">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-ink-500 transition-colors hover:text-gold-300">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
