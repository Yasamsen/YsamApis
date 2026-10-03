import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Marquee } from '@/components/Marquee';
import { Features } from '@/components/Features';
import { ApiShowcase } from '@/components/ApiShowcase';
import { Stats } from '@/components/Stats';
import { Pricing } from '@/components/Pricing';
import { CTA } from '@/components/CTA';
import { Footer } from '@/components/Footer';

function App() {
  return (
    <div className="relative min-h-screen bg-ink-950 text-ink-50">
      <div className="noise-overlay" />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Marquee />
        <Features />
        <ApiShowcase />
        <Stats />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

export default App;
