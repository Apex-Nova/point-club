import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, Globe } from 'lucide-react';
import { getCommunities, createCommunity, type Community } from '@/lib/services/communities.service';
import CommunityCard from '@/components/community/CommunityCard';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/common/Modal';
import { useToasts } from '@/drawing/hooks/useToasts';
import ToastContainer from '@/drawing/components/ToastContainer';

const CATEGORIES = ['all','art','design','gaming','architecture','business','practice'];

export default function CommunitiesPage() {
  const { user }  = useAuth();
  const { toasts, addToast, removeToast } = useToasts();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [category,    setCategory]    = useState('all');
  const [query,       setQuery]       = useState('');
  const [loading,     setLoading]     = useState(true);
  const [createOpen,  setCreateOpen]  = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', category: 'art' });

  useEffect(() => {
    setLoading(true);
    getCommunities(category === 'all' ? undefined : category)
      .then(d => { setCommunities(d); setLoading(false); });
  }, [category]);

  const filtered = query
    ? communities.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : communities;

  const handleCreate = async () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setCreating(true);
    try {
      await createCommunity({ ...form, slug: form.slug.toLowerCase().replace(/\s+/g, '-') });
      addToast('Community created!', 'success');
      setCreateOpen(false);
      getCommunities().then(setCommunities);
    } catch {
      addToast('Failed to create community', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-cream-dark sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Dashboard</Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky/30 flex items-center justify-center">
                <Globe size={13} className="text-sky-600" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">Communities</span>
            </div>
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search communities…"
              className="w-full pl-8 pr-4 py-2 rounded-2xl border-2 border-cream-dark focus:border-lavender outline-none text-sm bg-cream placeholder-gray-400" />
          </div>
          {user && (
            <motion.button whileHover={{ scale: 1.03 }} onClick={() => setCreateOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lavender text-white text-sm font-semibold hover:bg-lavender-dark transition-colors">
              <Plus size={13} /> Create
            </motion.button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-sky-500 to-lavender rounded-3xl p-8 mb-8 text-white">
          <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold mb-1">Find Your Creative Tribe</h2>
          <p className="text-sky-100 text-sm">Join communities of artists, builders, and dreamers. Post your work, join challenges, and grow together.</p>
        </motion.div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                category === cat ? 'bg-lavender text-white' : 'bg-white border border-cream-dark text-gray-500 hover:border-lavender/50'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-cream-dark overflow-hidden animate-pulse">
                <div className="h-16 bg-cream-dark" />
                <div className="p-4 -mt-6 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-cream-dark" />
                  <div className="h-3 bg-cream-dark rounded w-2/3" />
                  <div className="h-2.5 bg-cream-dark rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Users size={36} className="mx-auto mb-3 opacity-30" />
            <p>No communities found.</p>
            {user && <button onClick={() => setCreateOpen(true)} className="text-lavender-dark text-sm font-semibold hover:underline mt-2">Create the first one →</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((c, i) => <CommunityCard key={c.id} community={c} index={i} />)}
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Community">
        <div className="space-y-4">
          {[
            { label: 'Name',        key: 'name',        placeholder: 'Game Artists' },
            { label: 'Slug (URL)',  key: 'slug',        placeholder: 'game-artists' },
            { label: 'Description',key: 'description', placeholder: 'A community for…' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
              <input value={form[key as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none text-sm text-gray-700" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none text-sm text-gray-700 bg-white">
              {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-cream rounded-xl transition-colors">Cancel</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleCreate} disabled={creating || !form.name.trim()}
              className="px-5 py-2 rounded-xl bg-lavender text-white text-sm font-semibold hover:bg-lavender-dark disabled:opacity-50 transition-colors">
              {creating ? 'Creating…' : 'Create'}
            </motion.button>
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
