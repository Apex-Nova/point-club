import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, Flag, BarChart3, DollarSign, Loader2, CheckCircle, XCircle, Pencil } from 'lucide-react';
import { getPlatformStats } from '@/lib/services/analytics.service';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

interface Stats { totalUsers: number; totalDrawings: number; gamesPlayed: number; challengeEntries: number; totalRevenueCents: number }
interface Report { id: string; target_type: string; target_id: string; reason: string; created_at: string; reporter?: { username: string } }
interface AdminUser { id: string; username: string | null; email: string; premium_tier: string; xp: number; level: number; is_admin: boolean }

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-cream-dark p-5">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={16} className="text-white" />
      </div>
      <p className="text-2xl font-black text-gray-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function AdminPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [tab,      setTab]      = useState<'stats' | 'users' | 'reports'>('stats');
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [users,    setUsers]    = useState<AdminUser[]>([]);
  const [reports,  setReports]  = useState<Report[]>([]);
  const [isAdmin,  setIsAdmin]  = useState<boolean | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      .then(({ data }) => {
        const admin = (data as { is_admin: boolean } | null)?.is_admin ?? false;
        setIsAdmin(admin);
        if (!admin) navigate('/dashboard');
      });
  }, [user, navigate]);

  const authHeader = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    Promise.all([
      getPlatformStats().then(d => setStats(d as Stats)),
      authHeader().then(h => fetch(`${API}/api/admin/users`, { headers: h })).then(r => r.json()).then(d => setUsers((d as { users: AdminUser[] }).users ?? [])),
      authHeader().then(h => fetch(`${API}/api/admin/reports`, { headers: h })).then(r => r.json()).then(d => setReports((d as { reports: Report[] }).reports ?? [])),
    ]).finally(() => setLoading(false));
  }, [isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  const banUser = async (uid: string) => {
    const h = await authHeader();
    await fetch(`${API}/api/admin/users/${uid}/ban`, { method: 'POST', headers: h });
    setUsers(prev => prev.filter(u => u.id !== uid));
  };

  const resolveReport = async (rid: string, action: 'dismiss' | 'remove') => {
    const h = await authHeader();
    await fetch(`${API}/api/admin/reports/${rid}/resolve`, {
      method: 'POST', headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setReports(prev => prev.filter(r => r.id !== rid));
  };

  if (isAdmin === null || loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <Loader2 size={24} className="text-lavender-dark animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-cream-dark sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Dashboard</Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-coral flex items-center justify-center">
                <Shield size={13} className="text-white" />
              </div>
              <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">Admin</span>
            </div>
          </div>
          <div className="flex gap-1 bg-cream rounded-xl p-1">
            {(['stats','users','reports'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  tab === t ? 'bg-white text-lavender-dark shadow-sm' : 'text-gray-500'
                }`}>
                {t}
                {t === 'reports' && reports.length > 0 && (
                  <span className="ml-1.5 w-4 h-4 rounded-full bg-coral text-white text-[9px] font-bold inline-flex items-center justify-center">{reports.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats tab */}
        {tab === 'stats' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <StatCard label="Total Users"    value={stats.totalUsers}    icon={Users}     color="bg-lavender" />
              <StatCard label="Drawings"       value={stats.totalDrawings} icon={Pencil}    color="bg-sky-400" />
              <StatCard label="Games Played"   value={stats.gamesPlayed}   icon={BarChart3} color="bg-coral" />
              <StatCard label="Challenges"     value={stats.challengeEntries} icon={Flag}  color="bg-mint-500 bg-emerald-500" />
              <StatCard label="Revenue"        value={`$${(stats.totalRevenueCents / 100).toFixed(2)}`} icon={DollarSign} color="bg-peach/80 bg-orange-400" />
            </div>

            <div className="bg-white rounded-2xl border border-cream-dark p-6">
              <h3 className="text-sm font-bold text-gray-700 mb-4">Platform Health</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Backend API',    ok: true },
                  { label: 'Socket.IO',      ok: true },
                  { label: 'Supabase DB',    ok: true },
                  { label: 'Stripe',         ok: Boolean(import.meta.env.VITE_STRIPE_PK) },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center gap-2 text-sm">
                    {ok
                      ? <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      : <XCircle    size={14} className="text-gray-300 shrink-0" />
                    }
                    <span className={ok ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-dark bg-cream/50">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Level</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-cream-dark/50 hover:bg-cream/30">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-gray-700">{u.username ?? 'Anonymous'}</p>
                      <p className="text-[10px] text-gray-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        u.premium_tier === 'pro' ? 'bg-coral/20 text-coral-dark' :
                        u.premium_tier === 'plus' ? 'bg-lavender-light text-lavender-dark' :
                        'bg-cream text-gray-500'
                      }`}>{u.premium_tier}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.level}</td>
                    <td className="px-4 py-3 text-right">
                      {!u.is_admin && (
                        <motion.button whileTap={{ scale: 0.93 }}
                          onClick={() => banUser(u.id)}
                          className="px-3 py-1 rounded-lg text-xs text-coral-dark bg-coral/10 hover:bg-coral/20 font-semibold transition-colors">
                          Ban
                        </motion.button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Reports tab */}
        {tab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Flag size={32} className="mx-auto mb-3 opacity-30" />
                <p>No pending reports</p>
              </div>
            ) : reports.map(r => (
              <div key={r.id} className="bg-white rounded-2xl border border-cream-dark p-5 flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-coral-dark bg-coral/10 px-2 py-0.5 rounded-full">{r.target_type}</span>
                  <p className="text-sm font-semibold text-gray-700 mt-1.5">{r.reason}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Reported by {r.reporter?.username ?? 'Anonymous'} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => resolveReport(r.id, 'remove')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-coral/20 text-coral-dark hover:bg-coral/30 transition-colors">
                    Remove
                  </button>
                  <button onClick={() => resolveReport(r.id, 'dismiss')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cream text-gray-500 hover:bg-cream-dark transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
