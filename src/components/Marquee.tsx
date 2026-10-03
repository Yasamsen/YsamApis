const apis = [
  'Spotify', 'YouTube', 'TikTok', 'Instagram', 'AI Chat', 'AI Image',
  'Pinterest', 'Wikipedia', 'QR Code', 'Weather', 'IP Lookup', 'Earthquake',
  'MealDB', 'Lyrics', 'Facebook', 'Twitter', 'TeraBox', 'CapCut',
  'Text-to-Speech', 'TempMail', 'Nano Banana', 'Alight Motion',
];

export function Marquee() {
  return (
    <section className="relative border-y border-ink-800/50 bg-ink-950/50 py-8">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-ink-950 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-ink-950 to-transparent" />
      <div className="overflow-hidden">
        <div className="marquee-track gap-8">
          {[...apis, ...apis].map((name, i) => (
            <span
              key={i}
              className="whitespace-nowrap font-serif text-lg font-medium text-ink-500 transition-colors hover:text-gold-400"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
