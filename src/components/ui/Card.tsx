import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost' | 'colored';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children:   ReactNode;
  variant?:   CardVariant;
  padding?:   'sm' | 'md' | 'lg' | 'xl' | 'none';
  hover?:     boolean;
  clickable?: boolean;
  className?: string;
  /** Colored accent strip (top border) */
  accent?:    string;
}

const VARIANT_STYLES: Record<CardVariant, string> = {
  default:  'bg-white border border-[#e4ddd3] shadow-[0_4px_20px_rgb(0_0_0/0.09),0_1px_6px_rgb(0_0_0/0.05)]',
  elevated: 'bg-white border border-[rgba(0,0,0,0.06)] shadow-[0_12px_40px_rgb(0_0_0/0.12),0_4px_12px_rgb(0_0_0/0.07)]',
  outlined: 'bg-white border-2 border-[#d8d0c6]',
  ghost:    'bg-white/70 border border-white/90 backdrop-blur-sm shadow-[0_2px_12px_rgb(0_0_0/0.06)]',
  colored:  'bg-[#ede9fc] border border-[#c9bff5] shadow-[0_4px_16px_rgb(139_120_224/0.12)]',
};

const PADDING_STYLES: Record<string, string> = {
  none: '',
  sm:   'p-5',
  md:   'p-7',
  lg:   'p-9',
  xl:   'p-12',
};

const HOVER_STYLES = 'transition-all duration-300 hover:shadow-[0_16px_48px_rgb(0_0_0/0.14),0_4px_14px_rgb(0_0_0/0.08)] hover:-translate-y-1.5';

export default function Card({
  children, variant = 'default', padding = 'md', hover = false,
  clickable = false, className, accent, ...motionProps
}: CardProps) {
  return (
    <motion.div
      {...motionProps}
      className={cn(
        'rounded-2xl relative overflow-hidden',
        VARIANT_STYLES[variant],
        PADDING_STYLES[padding],
        (hover || clickable) && HOVER_STYLES,
        clickable && 'cursor-pointer',
        className,
      )}
    >
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: accent }}
        />
      )}
      {children}
    </motion.div>
  );
}

/* ── Card sub-components ─────────────────────────────────────── */

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4', className)}>{children}</div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-bold text-gray-900 leading-snug', className)}>
      {children}
    </h3>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('text-sm text-gray-600 leading-relaxed', className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mt-5 pt-4 border-t border-cream-dark flex items-center justify-between', className)}>
      {children}
    </div>
  );
}
