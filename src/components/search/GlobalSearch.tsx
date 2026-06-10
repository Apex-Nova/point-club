import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Users, Image, Globe, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { search, type SearchResult } from '@/lib/services/search.service';

const TYPE_ICONS = { user: Users, drawing: Image, community: Globe, room: Globe };
const TYPE_COLORS = {
  user:      'bg-lavender-light text-lavender-dark',
  drawing:   'bg-sky/20 text-sky-600',
  community: 'bg-mint/20 text-emerald-600',
  room:      'bg-peach/30 text-orange-500',
};

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

export default function GlobalSearch() {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(
    debounce(async (q: string) => {
      if (q.length < 2) { setResults([]); setLoading(false); return; }
      const data = await search(q);
      setResults(data);
      setLoading(false);
    }, 300),
    [],
  );

  useEffect(() => {
    if (!query) { setResults([]); return; }
    setLoading(true);
    doSearch(query);
  }, [query, doSearch]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
    const handler = (e: MouseEvent) => {
      if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(true); }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cream border border-cream-dark text-gray-400 text-sm hover:border-lavender/50 transition-colors"
      >
        <Search size={13} />
        <span className="hidden sm:inline text-[11px]">Search…</span>
        <kbd className="hidden sm:inline text-[9px] bg-white border border-cream-dark rounded px-1 py-0.5 font-mono">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-cream-dark overflow-hidden z-50"
          >
            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-cream-dark">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search users, drawings, communities…"
                className="flex-1 text-sm text-gray-700 outline-none placeholder-gray-400"
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); }} className="text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
              {loading && <Loader2 size={13} className="text-lavender-dark animate-spin shrink-0" />}
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 && query.length >= 2 && !loading && (
                <div className="py-8 text-center text-sm text-gray-400">No results for "{query}"</div>
              )}
              {results.length === 0 && query.length < 2 && (
                <div className="py-6 text-center text-xs text-gray-400">
                  Type to search across users, drawings, and communities
                </div>
              )}
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <p className="px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-cream/50">
                    {type}s
                  </p>
                  {items.map(r => {
                    const Icon  = TYPE_ICONS[r.type as keyof typeof TYPE_ICONS] ?? Search;
                    const color = TYPE_COLORS[r.type as keyof typeof TYPE_COLORS] ?? '';
                    return (
                      <Link key={r.id} to={r.url} onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream transition-colors">
                        <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                          {r.image
                            ? <img src={r.image} alt="" className="w-full h-full object-cover rounded-lg" />
                            : <Icon size={13} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700 truncate">{r.title}</p>
                          {r.description && <p className="text-[10px] text-gray-400 truncate">{r.description}</p>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
