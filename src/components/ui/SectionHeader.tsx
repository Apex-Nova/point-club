import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface SectionHeaderProps {
  eyebrow?:    ReactNode;
  title:       ReactNode;
  subtitle?:   ReactNode;
  align?:      'left' | 'center' | 'right';
  divider?:    boolean;
  eyebrowColor?: string;
  className?:  string;
  animate?:    boolean;
}

export default function SectionHeader({
  eyebrow, title, subtitle, align = 'center',
  divider = true, eyebrowColor, className, animate = true,
}: SectionHeaderProps) {
  const { ref, isInView } = useScrollAnimation();

  const alignClass = align === 'center' ? 'text-center items-center' : align === 'right' ? 'text-right items-end' : 'text-left items-start';

  const content = (
    <div className={cn('flex flex-col gap-4', alignClass, className)}>
      {eyebrow && (
        <span
          className={cn(
            'inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-sm',
            eyebrowColor ?? 'bg-lavender-light text-lavender-dark',
          )}
        >
          {eyebrow}
        </span>
      )}

      <h2
        style={{ fontFamily: 'var(--font-display)' }}
        className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-gray-900"
      >
        {title}
      </h2>

      {divider && (
        <div className={cn(
          'h-[3px] w-12 rounded-full bg-gradient-to-r from-lavender to-coral',
          align !== 'center' && 'ml-0',
        )} />
      )}

      {subtitle && (
        <p className={cn(
          'text-base md:text-xl text-gray-500 leading-relaxed',
          align === 'center' && 'max-w-2xl mx-auto',
          align === 'left' && 'max-w-2xl',
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
    >
      {content}
    </motion.div>
  );
}
