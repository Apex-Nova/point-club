import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

type BadgeVariant = 'lavender' | 'coral' | 'mint' | 'sky' | 'peach' | 'amber' | 'emerald' | 'gray' | 'white';
type BadgeSize    = 'xs' | 'sm' | 'md';

interface BadgeProps {
  children:   ReactNode;
  variant?:   BadgeVariant;
  size?:      BadgeSize;
  dot?:       boolean;
  dotPulse?:  boolean;
  /** Legacy pass-through for old color string API */
  color?:     string;
  className?: string;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  lavender: 'bg-lavender-light text-lavender-dark',
  coral:    'bg-coral/15 text-coral-dark',
  mint:     'bg-mint/20 text-emerald-700',
  sky:      'bg-sky/20 text-sky-700',
  peach:    'bg-peach/30 text-orange-600',
  amber:    'bg-amber-50 text-amber-700',
  emerald:  'bg-emerald-50 text-emerald-700',
  gray:     'bg-gray-100 text-gray-600',
  white:    'bg-white text-gray-700 border border-gray-200',
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  lavender: 'bg-lavender',
  coral:    'bg-coral',
  mint:     'bg-mint',
  sky:      'bg-sky-400',
  peach:    'bg-peach',
  amber:    'bg-amber-400',
  emerald:  'bg-emerald-500',
  gray:     'bg-gray-400',
  white:    'bg-gray-400',
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-2 py-0.5 gap-1',
  sm: 'text-xs px-3 py-1 gap-1.5',
  md: 'text-sm px-3.5 py-1.5 gap-2',
};

export default function Badge({
  children, variant = 'lavender', size = 'sm',
  dot = false, dotPulse = false, color, className,
}: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-semibold',
      color ?? VARIANT_STYLES[variant],
      SIZE_STYLES[size],
      className,
    )}>
      {dot && (
        <span className={cn(
          'rounded-full shrink-0',
          size === 'xs' ? 'w-1.5 h-1.5' : 'w-2 h-2',
          DOT_COLORS[variant],
          dotPulse && 'animate-pulse',
        )} />
      )}
      {children}
    </span>
  );
}
