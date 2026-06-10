import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingBag, Pencil, Star, Download, Plus, Search } from 'lucide-react';
import { getMarketplaceItems, purchaseItem, type MarketplaceItem } from '@/lib/services/marketplace.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToasts } from '@/drawing/hooks/useToasts';
import ToastContainer from '@/drawing/components/ToastContainer';

type ItemType = 'all' | 'brush_pack' | 'template' | 'color_palette' | 'creative_kit' | 'world_asset';
type SortMode = 'popular' | 'new' | 'free';

const TYPE_LABELS: Record<string, string> = {
  all: 'All', brush_pack: 'Brush Packs', template: 'Templates',
  color_palette: 'Palettes', creative_kit: 'Creative Kits', world_asset: 'World Assets',
};

const TYPE_EMOJIS: Record<string, string> = {
  brush_pack: '🖌️', template: '📋', color_palette: '🎨', creative_kit: '💼', world_asset: '🌍',
};

function ItemCard({ item, onBuy }: { item: MarketplaceItem; onBuy: (id: string) => void }) {
  return (
    <motion.div whileHover={{ y: -3 }}
      className="bg-white rounded-2xl border border-cream-dark overflow-hidden hover:shadow-lg transition-shadow">
      <div className="h-36 bg-gradient-to-br from-lavender/20 to-coral/10 flex items-center justify-center relative">
        {item.preview_url
          ? <img src={item.preview_url} alt={item.title} className="w-full h-full object-cover" />
          : <span className="text-5xl">{TYPE_EMOJIS[item.type] ?? '🎨'}</span>
        }
        <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/90 text-gray-600 px-2 py-0.5 rounded-full capitalize">
          {TYPE_LABELS[item.type] ?? item.type}
        </span>
      </div>
      <div className="p-4">
        <p className="text-sm font-bold text-gray-800 truncate mb-0.5">{item.title}</p>
        <Link to={`/profile/${item.seller?.username}`}
          className="text-[10px] text-gray-400 hover:text-lavender-dark transition-colors">
          by {item.seller?.username ?? 'Creator'}
        </Link>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span className="flex items-center gap-0.5"><Star size={9} className="text-peach fill-peach" /> {item.like_count}</span>
            <span className="flex items-center gap-0.5"><Download size={9} /> {item.purchase_count}</span>
          </div>
          <div>
            {item.price_cents === 0 ? (
              <motion.button whileTap={{ scale: 0.93 }}
                onClick={() => onBuy(item.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-mint/30 text-emerald-700 text-xs font-bold hover:bg-mint/50 transition-colors">
                <Download size={10} /> Free
              </motion.button>
            ) : (
              <motion.button whileTap={{ scale: 0.93 }}
                onClick={() => onBuy(item.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lavender text-white text-xs font-bold hover:bg-lavender-dark transition-colors">
                ${(item.price_cents / 100).toFixed(2)}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const { user }  = useAuth();
  const { toasts, addToast, removeToast } = useToasts();
  const [items,   setItems]   = useState<MarketplaceItem[]>([]);
  const [type,    setType]    = useState<ItemType>('all');
  const [sort,    setSort]    = useState<SortMode>('popular');
  const [query,   setQuery]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMarketplaceItems({ type: type === 'all' ? undefined : type, sort, limit: 30 })
      .then(d => { setItems(d); setLoading(false); });
  }, [type, sort]);

  const handleBuy = async (itemId: string) => {
    if (!user) { addToast('Sign in to get items', 'info'); return; }
    try {
      await purchaseItem(itemId);
      addToast('Added to your library!', 'success');
    } catch {
      addToast('Already in your library', 'info');
    }
  };

  const filtered = query
    ? items.filter(i => i.title.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-cream-dark sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Dashboard</Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-peach/50 flex items-center justify-center">
                <ShoppingBag size={13} className="text-orange-600" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">Marketplace</span>
            </div>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search items…"
              className="w-full pl-8 pr-4 py-2 rounded-2xl border-2 border-cream-dark focus:border-lavender outline-none text-sm bg-cream placeholder-gray-400" />
          </div>
          {user && (
            <motion.button whileHover={{ scale: 1.03 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lavender text-white text-sm font-semibold hover:bg-lavender-dark transition-colors">
              <Plus size={13} /> Sell Item
            </motion.button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-lavender-dark to-lavender rounded-3xl p-8 mb-8 flex items-center justify-between overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 rounded-full bg-white/10 translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-white mb-1">Creator Marketplace</h2>
            <p className="text-lavender-light text-sm">Brushes, palettes, templates — crafted by the community.</p>
          </div>
          <div className="flex items-center gap-2 relative z-10 text-lavender-light text-sm">
            <Pencil size={14} />
            <span>Sell your creations</span>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-1 bg-white rounded-2xl p-1 border border-cream-dark flex-wrap">
            {(Object.keys(TYPE_LABELS) as ItemType[]).map(t => (
              <button key={t} onClick={() => setType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  type === t ? 'bg-lavender text-white' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-white rounded-2xl p-1 border border-cream-dark">
            {(['popular','new','free'] as SortMode[]).map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                  sort === s ? 'bg-coral text-white' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-cream-dark overflow-hidden animate-pulse">
                <div className="h-36 bg-cream-dark" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-cream-dark rounded w-3/4" />
                  <div className="h-2.5 bg-cream-dark rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ShoppingBag size={36} className="mx-auto mb-3 opacity-30" />
            <p>No items found{query ? ` for "${query}"` : ''}.</p>
            <p className="text-xs mt-1">Be the first to publish!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(item => <ItemCard key={item.id} item={item} onBuy={handleBuy} />)}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
