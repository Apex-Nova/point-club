import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size    = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps {
  children:   ReactNode;
  variant?:   Variant;
  size?:      Size;
  onClick?:   () => void;
  className?: string;
  disabled?:  boolean;
  type?:      'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:   'bg-lavender text-white hover:bg-lavender-dark shadow-[0_4px_14px_rgb(139_120_224/0.38)] hover:shadow-[0_6px_20px_rgb(139_120_224/0.48)]',
  secondary: 'bg-white text-gray-800 border border-cream-dark hover:border-lavender shadow-[0_2px_8px_rgb(0_0_0/0.07)] hover:shadow-[0_4px_16px_rgb(0_0_0/0.10)]',
  outline:   'bg-transparent text-lavender-dark border-2 border-lavender hover:bg-lavender hover:text-white',
  ghost:     'bg-transparent text-gray-600 hover:bg-cream hover:text-gray-800',
  danger:    'bg-coral text-white hover:bg-coral-dark shadow-[0_4px_14px_rgb(242_112_89/0.38)]',
};

const SIZE_STYLES: Record<Size, string> = {
  xs: 'px-3.5 py-2 text-xs rounded-lg',
  sm: 'px-5 py-2.5 text-sm rounded-xl',
  md: 'px-7 py-3.5 text-sm rounded-2xl',
  lg: 'px-9 py-4 text-base rounded-2xl',
};

export default function Button({
  children, variant = 'primary', size = 'md', onClick,
  className, disabled, type = 'button', fullWidth = false,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { scale: 1.02, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'font-semibold cursor-pointer transition-all duration-200 inline-flex items-center justify-center gap-2 select-none',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        fullWidth && 'w-full',
        className,
      )}
    >
      {children}
    </motion.button>
  );
}
