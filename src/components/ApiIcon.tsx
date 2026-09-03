import { Activity, Bot, CloudSun, Facebook, Globe, ImagePlus, Instagram, type LucideIcon, Music, Music2, QrCode, Twitter, Volume2, Youtube } from 'lucide-react';

const icons: Record<string, LucideIcon> = { Instagram, Music2, Youtube, Facebook, Music, Twitter, Bot, ImagePlus, QrCode, CloudSun, Globe, Volume2 };

export default function ApiIcon({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = icons[name] ?? Activity;
  const sizes = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };
  return <Icon className={sizes[size]} />;
}
