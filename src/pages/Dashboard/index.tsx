import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, LogOut, Pencil, ChevronDown, Compass, User, MessageSquare, Settings, Gamepad2, Globe, Zap, Crown, BarChart3, Users, GraduationCap, Briefcase, Code2, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDrawings } from '@/hooks/useDrawings';
import { useToasts } from '@/drawing/hooks/useToasts';
import DrawingCard from '@/components/dashboard/DrawingCard';
import DrawingGridSkeleton from '@/components/dashboard/DrawingSkeleton';
import EmptyDrawings from '@/components/dashboard/EmptyDrawings';
import RoomsSection from '@/components/dashboard/RoomsSection';
import ToastContainer from '@/drawing/components/ToastContainer';
import Modal from '@/components/common/Modal';
import NotificationCenter from '@/components/social/NotificationCenter';
import FriendsPanel from '@/components/social/FriendsPanel';
import XPBar from '@/components/xp/XPBar';
import DailyChallengeWidget from '@/components/challenges/DailyChallenge';
import GlobalSearch from '@/components/search/GlobalSearch';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { drawings, loading, error, create, rename, remove, duplicate } = useDrawings();
  const { toasts, addToast, removeToast } = useToasts();

  const [query, setQuery]                 = useState('');
  const [createOpen, setCreateOpen]       = useState(false);
  const [newTitle, setNewTitle]           = useState('');
  const [deleteTarget, setDeleteTarget]   = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [creating, setCreating]           = useState(false);

  const displayName = user?.user_metadata?.full_name
    ?? user?.email?.split('@')[0]
    ?? 'Artist';

  const filtered = useMemo(() =>
    query.trim()
      ? drawings.filter(d => d.title.toLowerCase().includes(query.toLowerCase()))
      : drawings,
    [drawings, query],
  );

  const handleCreate = async () => {
    const title = newTitle.trim() || 'Untitled Drawing';
    setCreating(true);
    try {
      const drawing = await create(title);
      setCreateOpen(false);
      setNewTitle('');
      navigate(`/draw/${drawing.id}`);
    } catch {
      addToast('Failed to create drawing', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (id: string, title: string) => {
    try {
      await rename(id, title);
      addToast('Drawing renamed', 'success');
    } catch {
      addToast('Failed to rename', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      addToast('Drawing deleted', 'info');
    } catch {
      addToast('Failed to delete', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicate(id);
      addToast('Drawing duplicated', 'success');
    } catch {
      addToast('Failed to duplicate', 'error');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/92 backdrop-blur-xl border-b border-[#e4ddd3] shadow-[0_1px_0_rgb(0_0_0/0.04),0_4px_16px_rgb(0_0_0/0.05)]">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-lavender flex items-center justify-center">
              <Pencil size={13} className="text-white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">
              Point Club
            </span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            <GlobalSearch />

            <Link to="/discover" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-cream hover:text-lavender-dark transition-colors">
              <Compass size={15} /> Discover
            </Link>
            <Link to="/messages" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-cream hover:text-lavender-dark transition-colors">
              <MessageSquare size={15} /> Messages
            </Link>

            <NotificationCenter />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-cream transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-lavender-light flex items-center justify-center text-xs font-bold text-lavender-dark">
                  {displayName[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[140px] truncate">
                  {displayName}
                </span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-xl border border-cream-dark py-1 z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-cream-dark">
                      <p className="text-xs font-medium text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link to={`/profile/${displayName.replace(/\s+/g, '_').toLowerCase()}`}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-cream transition-colors">
                      <User size={14} /> View Profile
                    </Link>
                    <Link to="/settings/profile"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-cream transition-colors">
                      <Settings size={14} /> Edit Profile
                    </Link>
                    <Link to="/subscription"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-cream transition-colors">
                      <Crown size={14} /> Subscription
                    </Link>
                    <Link to="/analytics"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-cream transition-colors">
                      <BarChart3 size={14} /> Analytics
                    </Link>
                    <Link to="/discover"
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-cream transition-colors sm:hidden">
                      <Compass size={14} /> Discover
                    </Link>
                    <div className="border-t border-cream-dark my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-cream hover:text-coral-dark transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-14">
        {/* ── Welcome bar ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-lavender-dark mb-1.5">
              Your Creative Space
            </p>
            <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-4xl font-bold text-gray-900 leading-tight">
              {greeting()}, {displayName.split(' ')[0]} ✨
            </h1>
            <p className="text-gray-400 text-sm mt-1.5">
              {drawings.length === 0
                ? 'Start your first drawing today'
                : `${drawings.length} drawing${drawings.length !== 1 ? 's' : ''} in your workspace`}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-lavender text-white font-bold text-sm hover:bg-lavender-dark transition-all shrink-0 shadow-[0_4px_14px_rgb(139_120_224/0.4)]"
          >
            <Plus size={16} />
            New Drawing
          </motion.button>
        </motion.div>

        {/* ── Search bar ───────────────────────────────────────────────── */}
        <div className="relative mb-10 max-w-lg">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search your drawings…"
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-cream-dark bg-white focus:border-lavender outline-none transition-colors text-sm text-gray-700 placeholder-gray-400 shadow-[0_1px_4px_rgb(0_0_0/0.05)]"
          />
        </div>

        {/* ── Drawings grid ────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-900">
              My Drawings
            </h2>
            {filtered.length > 0 && (
              <span className="text-xs text-gray-400 font-medium">{filtered.length} drawings</span>
            )}
          </div>

          {error && (
            <div className="text-coral-dark bg-coral/10 border border-coral-light rounded-2xl px-4 py-3 text-sm mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <DrawingGridSkeleton />
          ) : filtered.length === 0 && !query ? (
            <EmptyDrawings onCreateNew={() => setCreateOpen(true)} />
          ) : filtered.length === 0 ? (
            <p className="text-gray-400 text-sm py-12 text-center">No drawings match "{query}"</p>
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
              layout
            >
              <AnimatePresence>
                {filtered.map((drawing, i) => (
                  <motion.div
                    key={drawing.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <DrawingCard
                      drawing={drawing}
                      onRename={handleRename}
                      onDelete={(id) => setDeleteTarget(id)}
                      onDuplicate={handleDuplicate}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* ── Phase 4 — Multiplayer Rooms ─────────────────────────────── */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-900">
              Live Rooms
            </h2>
          </div>
          <RoomsSection />
        </section>

        {/* ── Phase 6 Quick Access ─────────────────────────────────────── */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-900">
              Explore
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { to: '/games',       icon: Gamepad2, label: 'Games',       sub: 'Draw & compete',   accent: '#f27059', bg: 'bg-coral/15' },
              { to: '/world',       icon: Globe,    label: 'World',       sub: 'Infinite canvas',  accent: '#8b78e0', bg: 'bg-lavender-light' },
              { to: '/challenges',  icon: Zap,      label: 'Challenges',  sub: 'Daily prompt',     accent: '#f9c784', bg: 'bg-peach/35' },
              { to: '/marketplace', icon: Crown,    label: 'Market',      sub: 'Brushes & kits',   accent: '#f9c784', bg: 'bg-peach/35' },
              { to: '/communities', icon: Users,    label: 'Communities', sub: 'Find your tribe',  accent: '#7dd3b2', bg: 'bg-mint/20' },
            ].map(({ to, icon: Icon, label, sub, accent, bg }) => (
              <Link key={to} to={to}>
                <motion.div
                  whileHover={{ y: -5, transition: { duration: 0.18 } }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white rounded-2xl border border-[#e4ddd3] p-5 flex flex-col gap-4 cursor-pointer shadow-[0_4px_20px_rgb(0_0_0/0.09),0_1px_6px_rgb(0_0_0/0.04)] hover:shadow-[0_12px_36px_rgb(0_0_0/0.12)] transition-all duration-250 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
                    style={{ boxShadow: `0 4px 12px ${accent}30` }}
                  >
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{label}</p>
                    <p className="text-[11px] text-gray-500 leading-snug mt-0.5">{sub}</p>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── XP + Daily Challenge ──────────────────────────────────────── */}
        <section className="mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <XPBar />
            <DailyChallengeWidget compact />
          </div>
        </section>

        {/* ── Phase 5 — Friends & Social ──────────────────────────────── */}
        <section className="mt-14 mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-2xl font-bold text-gray-900">
              Friends & Community
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FriendsPanel />
            <div className="bg-white rounded-2xl border border-[#e4ddd3] p-10 flex flex-col items-center justify-center text-center gap-5 shadow-[0_4px_20px_rgb(0_0_0/0.09),0_1px_6px_rgb(0_0_0/0.04)] min-h-[200px]">
              <div className="w-14 h-14 bg-lavender-light rounded-2xl flex items-center justify-center">
                <Compass size={24} className="text-lavender-dark" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-800 mb-1">Discover Creators</p>
                <p className="text-sm text-gray-400">Find artists, follow their work, join rooms</p>
              </div>
              <Link to="/discover">
                <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
                  className="px-6 py-2.5 rounded-xl bg-lavender text-white text-sm font-bold hover:bg-lavender-dark transition-colors shadow-[0_3px_10px_rgb(139_120_224/0.35)]">
                  Explore
                </motion.button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* ── Create drawing modal ─────────────────────────────────────── */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Drawing">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Drawing name</label>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Untitled Drawing"
              autoFocus
              className="w-full px-4 py-3 rounded-2xl border-2 border-cream-dark focus:border-lavender outline-none transition-colors text-gray-800 placeholder-gray-400"
            />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-cream transition-colors">
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-lavender text-white text-sm font-semibold hover:bg-lavender-dark transition-colors disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create & Open'}
            </motion.button>
          </div>
        </div>
      </Modal>

      {/* ── Delete confirm modal ─────────────────────────────────────── */}
      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete Drawing?">
        <p className="text-gray-500 text-sm mb-5">
          This will permanently delete the drawing and all its strokes. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-cream transition-colors">
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => deleteTarget && handleDelete(deleteTarget)}
            className="px-5 py-2 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral-dark transition-colors"
          >
            Delete
          </motion.button>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
