import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

/* ── Single item ──────────────────────────────────────────────── */
interface AccordionItemProps {
  trigger:      ReactNode;
  children:     ReactNode;
  defaultOpen?: boolean;
  className?:   string;
  triggerClass?: string;
  contentClass?: string;
  /** Controls border between header and body */
  divided?: boolean;
}

export function AccordionItem({
  trigger, children, defaultOpen = false,
  className, triggerClass, contentClass, divided = false,
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn('overflow-hidden', className)}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className={cn(
          'w-full flex items-center justify-between gap-3 text-left transition-colors duration-150',
          triggerClass,
        )}
      >
        <span className="flex-1">{trigger}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="shrink-0 text-gray-400"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {divided && <div className="border-t border-cream-dark mx-0" />}
            <div className={cn('pt-3', contentClass)}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Group (border-separated list) ──────────────────────────── */
interface AccordionGroupProps {
  items: {
    id:       string;
    trigger:  ReactNode;
    content:  ReactNode;
  }[];
  className?: string;
  /** Only one open at a time */
  exclusive?: boolean;
}

export function AccordionGroup({ items, className, exclusive = false }: AccordionGroupProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={cn('divide-y divide-cream-dark', className)}>
      {items.map(item => {
        const isOpen = exclusive ? openId === item.id : undefined;
        return (
          <AccordionItem
            key={item.id}
            trigger={item.trigger}
            triggerClass="py-4 px-0 hover:text-lavender-dark"
            contentClass="pb-4"
            defaultOpen={!exclusive}
            {...(exclusive ? {
              defaultOpen: openId === item.id,
            } : {})}
          >
            {item.content}
          </AccordionItem>
        );
        void isOpen;
      })}
    </div>
  );
}

export default AccordionItem;
