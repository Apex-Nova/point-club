import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Zap, Trophy, Users, Clock, Star, Globe, ChevronRight, CheckCircle } from 'lucide-react';
import { getEvents, registerForEvent, getEventLeaderboard, type WorldEvent, type EventSubmission } from '@/lib/services/events.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToasts } from '@/drawing/hooks/useToasts';
import ToastContainer from '@/drawing/components/ToastContainer';
import Navbar from '@/components/layout/Navbar';

const TYPE_EMOJI: Record<string, string> = {
  global_art_week: '🌍', world_canvas: '🖼️', monthly_challenge: '⚡',
  competition: '🏆', workshop: '🛠️', festival: '🎉',
};

const STATUS_COLORS: Record<string, string> = {
  live:     'bg-mint/30 text-emerald-700 border-emerald-200',
  upcoming: 'bg-sky/20 text-sky-700 border-sky-200',
  ended:    'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  live: 'Live Now', upcoming: 'Upcoming', ended: 'Ended',
};

function TimeLeft({ endsAt, startsAt, status }: { endsAt: string; startsAt: string; status: string }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const update = () => {
      const target = status === 'upcoming' ? new Date(startsAt) : new Date(endsAt);
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { setLabel(status === 'upcoming' ? 'Starting…' : 'Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (d > 0) setLabel(`${d}d ${h}h ${status === 'upcoming' ? 'until start' : 'left'}`);
      else if (h > 0) setLabel(`${h}h ${m}m ${status === 'upcoming' ? 'until start' : 'left'}`);
      else setLabel(`${m}m ${status === 'upcoming' ? 'until start' : 'left'}`);
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [endsAt, startsAt, status]);
  return <span>{label}</span>;
}

function EventCard({ event, onRegister, onSelect }: { event: WorldEvent; onRegister: (id: string) => void; onSelect: (e: WorldEvent) => void }) {
  const isLive = event.status === 'live';
  return (
    <motion.div whileHover={{ y: -4 }} onClick={() => onSelect(event)}
      className="bg-white rounded-3xl border border-cream-dark overflow-hidden cursor-pointer hover:shadow-xl transition-shadow group">
      {/* Banner */}
      <div className={`h-36 relative flex items-center justify-center ${
        isLive ? 'bg-gradient-to-br from-lavender/30 via-coral/10 to-mint/20' : 'bg-gradient-to-br from-cream to-cream-dark'
      }`}>
        <span className="text-6xl opacity-60">{TYPE_EMOJI[event.type] ?? '🎨'}</span>
        {isLive && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-700">LIVE</span>
          </div>
        )}
        <div className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[event.status]}`}>
          {STATUS_LABELS[event.status]}
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-base font-bold text-gray-800 mb-1.5 leading-snug group-hover:text-lavender-dark transition-colors">
          {event.title}
        </h3>
        <p className="text-[11px] text-gray-400 mb-4 line-clamp-2 leading-relaxed">{event.description}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {event.prize_pool && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
              <Trophy size={9} /> ${event.prize_pool.toLocaleString()} prize
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] font-semibold text-lavender-dark bg-lavender-light px-2 py-1 rounded-full">
            <Zap size={9} /> +{event.xp_reward} XP
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-cream px-2 py-1 rounded-full">
            <Users size={9} /> {event.participant_count.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock size={9} />
            <TimeLeft endsAt={event.ends_at} startsAt={event.starts_at} status={event.status} />
          </span>

          {event.status !== 'ended' && (
            <motion.button whileTap={{ scale: 0.95 }}
              onClick={e => { e.stopPropagation(); onRegister(event.id); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                event.is_registered
                  ? 'bg-mint/30 text-emerald-700'
                  : 'bg-lavender text-white hover:bg-lavender-dark'
              }`}>
              {event.is_registered ? <><CheckCircle size={11} /> Registered</> : 'Register'}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EventDetail({ event, leaderboard, onClose, onRegister }: {
  event: WorldEvent; leaderboard: EventSubmission[]; onClose: () => void; onRegister: (id: string) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className={`h-48 relative flex items-center justify-center rounded-t-3xl ${
          event.status === 'live' ? 'bg-gradient-to-br from-lavender/30 via-coral/10 to-mint/20' : 'bg-gradient-to-br from-cream to-cream-dark'
        }`}>
          <span className="text-7xl">{TYPE_EMOJI[event.type]}</span>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 text-gray-600 hover:bg-white">✕</button>
        </div>

        <div className="p-6">
          <div className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border mb-3 ${STATUS_COLORS[event.status]}`}>
            {event.status === 'live' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
            {STATUS_LABELS[event.status]}
          </div>
          <h2 className="text-xl font-black text-gray-800 mb-2">{event.title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">{event.description}</p>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-cream rounded-2xl p-3 text-center">
              <p className="text-lg font-black text-gray-800">{event.participant_count.toLocaleString()}</p>
              <p className="text-[10px] text-gray-400">participants</p>
            </div>
            <div className="bg-lavender-light rounded-2xl p-3 text-center">
              <p className="text-lg font-black text-lavender-dark">+{event.xp_reward}</p>
              <p className="text-[10px] text-lavender-dark/70">XP reward</p>
            </div>
            {event.prize_pool ? (
              <div className="bg-amber-50 rounded-2xl p-3 text-center">
                <p className="text-lg font-black text-amber-700">${event.prize_pool.toLocaleString()}</p>
                <p className="text-[10px] text-amber-600">prize pool</p>
              </div>
            ) : (
              <div className="bg-cream rounded-2xl p-3 text-center">
                <p className="text-lg font-black text-gray-400">🎉</p>
                <p className="text-[10px] text-gray-400">community</p>
              </div>
            )}
          </div>

          {leaderboard.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-bold text-gray-700 mb-2">Leaderboard</h3>
              {leaderboard.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 py-2 border-b border-cream last:border-0">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-gray-700">@{s.profile?.username}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-0.5"><Star size={9} className="fill-amber-400 text-amber-400" /> {s.votes.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {event.status !== 'ended' && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => onRegister(event.id)}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition-colors ${
                event.is_registered
                  ? 'bg-mint/30 text-emerald-700'
                  : 'bg-lavender text-white hover:bg-lavender-dark'
              }`}>
              {event.is_registered ? '✓ You\'re Registered' : 'Register for This Event'}
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

const FILTERS = ['all', 'live', 'upcoming', 'ended'] as const;
type Filter = typeof FILTERS[number];

export default function EventsPage() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToasts();
  const [events,      setEvents]      = useState<WorldEvent[]>([]);
  const [filter,      setFilter]      = useState<Filter>('all');
  const [selected,    setSelected]    = useState<WorldEvent | null>(null);
  const [leaderboard, setLeaderboard] = useState<EventSubmission[]>([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    getEvents().then(e => { setEvents(e); setLoading(false); });
  }, []);

  const handleSelect = async (event: WorldEvent) => {
    setSelected(event);
    const lb = await getEventLeaderboard(event.id);
    setLeaderboard(lb);
  };

  const handleRegister = async (eventId: string) => {
    if (!user) { addToast('Sign in to register for events', 'error'); return; }
    try {
      await registerForEvent(eventId);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, is_registered: true, participant_count: e.participant_count + 1 } : e));
      if (selected?.id === eventId) setSelected(prev => prev ? { ...prev, is_registered: true } : null);
      addToast('Registered! Good luck 🎉', 'success');
    } catch {
      addToast('Registration failed', 'error');
    }
  };

  const visible = events.filter(e => filter === 'all' || e.status === filter);
  const liveCount = events.filter(e => e.status === 'live').length;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-lavender/20 via-white to-coral/10 border-b border-cream-dark">
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Globe size={18} className="text-lavender-dark" />
            <span className="text-xs font-bold uppercase tracking-widest text-lavender-dark">World Events</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">
            Create Together,<br /><span className="text-lavender">Globally</span>
          </h1>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Join platform-wide events, competitions, and collaborative art experiences with thousands of creators worldwide.
          </p>
          {liveCount > 0 && (
            <div className="inline-flex items-center gap-2 bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {liveCount} event{liveCount > 1 ? 's' : ''} happening right now
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-6">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                filter === f ? 'bg-lavender text-white' : 'bg-white border border-cream-dark text-gray-500 hover:border-lavender'
              }`}>
              {f === 'all' ? `All Events (${events.length})` : f === 'live' ? `Live (${events.filter(e=>e.status==='live').length})` : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-cream-dark h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((event, i) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <EventCard event={event} onRegister={handleRegister} onSelect={handleSelect} />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🎭</p>
            <p className="text-sm text-gray-400">No {filter !== 'all' ? filter : ''} events right now. Check back soon!</p>
          </div>
        )}

        {/* Stats banner */}
        <div className="mt-12 bg-gradient-to-r from-lavender to-lavender-dark rounded-3xl p-8 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Total Participants', value: '47,320+' },
              { label: 'Events Hosted', value: '128' },
              { label: 'Prize Pool Awarded', value: '$42,500' },
              { label: 'Countries Represented', value: '87' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-black mb-0.5">{s.value}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar preview */}
        <div className="mt-8 bg-white rounded-3xl border border-cream-dark p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-lavender-dark" /> Upcoming Calendar
          </h2>
          <div className="space-y-2">
            {events.filter(e => e.status !== 'ended').slice(0, 4).map(e => (
              <div key={e.id} onClick={() => void handleSelect(e)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-cream transition-colors cursor-pointer group">
                <span className="text-xl">{TYPE_EMOJI[e.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-lavender-dark transition-colors truncate">{e.title}</p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(e.starts_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                    {' → '}
                    {new Date(e.ends_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[e.status]}`}>
                  {STATUS_LABELS[e.status]}
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-lavender transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <EventDetail event={selected} leaderboard={leaderboard} onClose={() => setSelected(null)} onRegister={handleRegister} />
        )}
      </AnimatePresence>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
