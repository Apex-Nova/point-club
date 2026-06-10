import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Key, Plus, Trash2, Copy, CheckCircle, Loader2, Globe, Webhook } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToasts } from '@/drawing/hooks/useToasts';
import ToastContainer from '@/drawing/components/ToastContainer';

const API = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';
interface ApiKey { id: string; name: string; key_prefix: string; scopes: string[]; is_active: boolean; last_used_at: string | null; created_at: string }
interface NewKey  extends ApiKey { key: string }

const ENDPOINTS = [
  { method: 'GET',  path: '/api/v1/me',        desc: 'Get your profile',             scope: 'read:profile' },
  { method: 'GET',  path: '/api/v1/drawings',  desc: 'List your drawings',           scope: 'read:drawings' },
  { method: 'GET',  path: '/api/v1/gallery',   desc: 'Browse public gallery',        scope: 'read:drawings' },
];

export default function ApiDocsPage() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToasts();
  const [tab,      setTab]      = useState<'overview' | 'keys' | 'webhooks'>('overview');
  const [keys,     setKeys]     = useState<ApiKey[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKey,   setNewKey]   = useState<NewKey | null>(null);
  const [keyName,  setKeyName]  = useState('');
  const [copied,   setCopied]   = useState('');

  const authH = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` };
  };

  const loadKeys = async () => {
    if (!user) return;
    setLoading(true);
    const h = await authH();
    const r = await fetch(`${API}/api/developer/keys`, { headers: h });
    const d = await r.json() as { keys: ApiKey[] };
    setKeys(d.keys ?? []);
    setLoading(false);
  };

  useEffect(() => { if (tab === 'keys') loadKeys(); }, [tab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const createKey = async () => {
    if (!keyName.trim() || !user) return;
    setCreating(true);
    const h = await authH();
    const r = await fetch(`${API}/api/developer/keys`, {
      method: 'POST', headers: h,
      body: JSON.stringify({ name: keyName.trim() }),
    });
    const d = await r.json() as NewKey;
    setNewKey(d);
    setKeyName('');
    setKeys(prev => [d, ...prev]);
    setCreating(false);
  };

  const revokeKey = async (id: string) => {
    const h = await authH();
    await fetch(`${API}/api/developer/keys/${id}`, { method: 'DELETE', headers: h });
    setKeys(prev => prev.filter(k => k.id !== id));
    addToast('API key revoked', 'info');
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const METHOD_COLOR: Record<string, string> = { GET: 'text-emerald-600 bg-mint/20', POST: 'text-sky-600 bg-sky/20', PUT: 'text-orange-500 bg-peach/30', DELETE: 'text-coral-dark bg-coral/10' };

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-cream-dark sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Dashboard</Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center">
              <Code2 size={13} className="text-white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">Developer Portal</span>
            <span className="text-[10px] font-bold bg-mint/30 text-emerald-600 px-2 py-0.5 rounded-full">API v1</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl p-1 border border-cream-dark mb-6 w-fit">
          {(['overview', 'keys', 'webhooks'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-lavender text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === 'overview' ? '📖 Overview' : t === 'keys' ? '🔑 API Keys' : '🔗 Webhooks'}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Intro */}
              <div className="bg-white rounded-2xl border border-cream-dark p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-3">Point Club Public API</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  Build apps and integrations on top of Point Club. Authenticate with an API key, send it in the <code className="bg-cream px-1 rounded text-xs">X-API-Key</code> header.
                </p>
                <div className="bg-gray-900 rounded-xl p-4 text-xs text-green-400 font-mono">
                  <p className="text-gray-500 mb-1"># Example request</p>
                  <p>curl {API}/api/v1/me \</p>
                  <p className="pl-4">-H "X-API-Key: pc_live_..."</p>
                </div>
              </div>

              {/* Endpoints */}
              <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden">
                <div className="px-5 py-3 border-b border-cream-dark flex items-center gap-2">
                  <Globe size={14} className="text-lavender-dark" />
                  <h3 className="text-sm font-bold text-gray-700">Endpoints</h3>
                </div>
                {ENDPOINTS.map((ep, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3 border-b border-cream-dark last:border-0 hover:bg-cream/30 transition-colors">
                    <span className={`text-[10px] font-black w-12 text-center py-0.5 rounded-lg shrink-0 ${METHOD_COLOR[ep.method]}`}>{ep.method}</span>
                    <code className="text-xs font-mono text-gray-700 flex-1">{ep.path}</code>
                    <span className="text-[10px] text-gray-400 hidden sm:block">{ep.desc}</span>
                    <span className="text-[9px] bg-cream text-gray-500 px-1.5 py-0.5 rounded-full shrink-0">{ep.scope}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-cream-dark p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Quick Start</h3>
                <div className="space-y-3 text-[11px] text-gray-500">
                  <p>1. <Link to="/api-docs" onClick={() => setTab('keys')} className="text-lavender-dark font-semibold hover:underline">Create an API key</Link></p>
                  <p>2. Add <code className="bg-cream px-1 rounded">X-API-Key: your_key</code> to requests</p>
                  <p>3. Query <code className="bg-cream px-1 rounded">/api/v1/me</code> to verify</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-cream-dark p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Rate Limits</h3>
                <div className="space-y-1.5 text-[11px]">
                  {[['Free', '100 req/min'], ['Plus', '500 req/min'], ['Pro', '2,000 req/min'], ['Team', '10,000 req/min']].map(([plan, rate]) => (
                    <div key={plan} className="flex justify-between text-gray-500">
                      <span>{plan}</span><span className="font-semibold">{rate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'keys' && (
          <div className="max-w-2xl space-y-4">
            {/* New key revealed */}
            {newKey && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-mint/20 border-2 border-emerald-300 rounded-2xl p-5">
                <p className="text-sm font-bold text-emerald-700 mb-2">✓ New API key created! Copy it now — it won't be shown again.</p>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-emerald-200 px-3 py-2">
                  <code className="text-xs text-gray-700 flex-1 font-mono break-all">{newKey.key}</code>
                  <button onClick={() => { copy(newKey.key, 'newkey'); setNewKey(null); }}>
                    {copied === 'newkey' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="text-gray-400" />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Create key */}
            {user ? (
              <div className="bg-white rounded-2xl border border-cream-dark p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Create API Key</h3>
                <div className="flex gap-2">
                  <input value={keyName} onChange={e => setKeyName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && void createKey()}
                    placeholder="Key name (e.g. My App)"
                    className="flex-1 px-4 py-2 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none text-sm" />
                  <motion.button whileHover={{ scale: 1.03 }} onClick={createKey} disabled={creating || !keyName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-lavender text-white text-sm font-semibold hover:bg-lavender-dark disabled:opacity-50 transition-colors">
                    {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Create
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="bg-lavender-light rounded-2xl p-5 text-center">
                <p className="text-sm font-semibold text-lavender-dark">Sign in to create API keys</p>
              </div>
            )}

            {/* Keys list */}
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 size={20} className="text-lavender-dark animate-spin" /></div>
            ) : keys.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Key size={32} className="mx-auto mb-3 opacity-30" />
                <p>No API keys yet</p>
              </div>
            ) : keys.map(key => (
              <div key={key.id} className="bg-white rounded-2xl border border-cream-dark p-4 flex items-center gap-4">
                <Key size={16} className="text-lavender-dark shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-700">{key.name}</p>
                  <code className="text-[11px] text-gray-400 font-mono">{key.key_prefix}••••••••</code>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {key.last_used_at ? `Last used ${new Date(key.last_used_at).toLocaleDateString()}` : 'Never used'}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => copy(key.key_prefix, key.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-cream hover:text-gray-600 transition-colors">
                    {copied === key.id ? <CheckCircle size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                  <button onClick={() => revokeKey(key.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-coral/10 hover:text-coral-dark transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'webhooks' && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-2xl border border-cream-dark p-6 text-center">
              <Webhook size={32} className="mx-auto mb-3 text-lavender-dark opacity-60" />
              <h3 className="text-sm font-bold text-gray-700 mb-2">Webhook Management</h3>
              <p className="text-xs text-gray-400 mb-4">Configure endpoint URLs to receive real-time events from Point Club.</p>
              <div className="text-left bg-cream rounded-xl p-4 space-y-1.5 text-[11px] text-gray-600 mb-4">
                {['drawing.created','drawing.published','drawing.liked','follower.new','challenge.completed','tip.received'].map(ev => (
                  <p key={ev}><code className="font-mono">{ev}</code></p>
                ))}
              </div>
              <Link to="/api-docs" className="text-lavender-dark text-sm font-semibold hover:underline">
                Create webhook via API →
              </Link>
            </div>
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
