import { type ReactNode } from 'react';
import { useReveal } from '@/hooks/useReveal';

interface RevealProps {
  children: ReactNode;
  delay?: 1 | 2 | 3 | 4 | 5;
  className?: string;
}

export function Reveal({ children, delay, className = '' }: RevealProps) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  const delayClass = delay ? ` reveal-delay-${delay}` : '';
  return (
    <div
      ref={ref}
      className={`reveal${delayClass}${visible ? ' is-visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
