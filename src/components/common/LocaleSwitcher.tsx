import { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { setLocale, getLocale, getLocaleName, getAllLocales, type Locale } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';

const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪',
  ja: '🇯🇵', pt: '🇧🇷', zh: '🇨🇳', ko: '🇰🇷', ar: '🇸🇦', hi: '🇮🇳',
};

export default function LocaleSwitcher() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Locale>(getLocale());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (locale: Locale) => {
    setLocale(locale);
    setCurrent(locale);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-cream transition-colors text-gray-500 hover:text-gray-700"
        title="Change language">
        <Globe size={14} />
        <span className="text-xs font-semibold hidden sm:inline">{LOCALE_FLAGS[current]}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }} transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-2xl shadow-xl border border-cream-dark z-50 overflow-hidden py-1">
            {getAllLocales().map(locale => (
              <button key={locale} onClick={() => handleSelect(locale)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-cream transition-colors ${current === locale ? 'bg-lavender-light/50' : ''}`}>
                <span className="text-base">{LOCALE_FLAGS[locale]}</span>
                <span className="text-xs font-medium text-gray-700">{getLocaleName(locale)}</span>
                {current === locale && <span className="ml-auto text-lavender-dark text-[10px]">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
