import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, Smartphone, Globe, AlertTriangle, CheckCircle, Lock, Eye, EyeOff, Activity, FileText, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToasts } from '@/drawing/hooks/useToasts';
import ToastContainer from '@/drawing/components/ToastContainer';
import Navbar from '@/components/layout/Navbar';

interface Session {
  id:         string;
  device:     string;
  location:   string;
  ip:         string;
  last_seen:  string;
  current:    boolean;
}

interface AuditLog {
  id:          string;
  action:      string;
  resource:    string;
  ip:          string;
  created_at:  string;
  status:      'success' | 'failed' | 'warning';
}

const MOCK_SESSIONS: Session[] = [
  { id: '1', device: 'Chrome on macOS',       location: 'San Francisco, US', ip: '192.168.1.1',  last_seen: new Date().toISOString(),                     current: true  },
  { id: '2', device: 'Safari on iPhone 15',   location: 'San Francisco, US', ip: '192.168.1.2',  last_seen: new Date(Date.now() - 3600000).toISOString(), current: false },
  { id: '3', device: 'Firefox on Windows 11', location: 'New York, US',      ip: '10.0.0.123',   last_seen: new Date(Date.now() - 86400000).toISOString(), current: false },
];

const MOCK_LOGS: AuditLog[] = [
  { id: '1', action: 'login',           resource: 'auth',      ip: '192.168.1.1', created_at: new Date().toISOString(),                     status: 'success' },
  { id: '2', action: 'api_key_created', resource: 'api_keys',  ip: '192.168.1.1', created_at: new Date(Date.now() - 3600000).toISOString(), status: 'success' },
  { id: '3', action: 'payment',         resource: 'billing',   ip: '192.168.1.1', created_at: new Date(Date.now() - 7200000).toISOString(), status: 'success' },
  { id: '4', action: 'login_failed',    resource: 'auth',      ip: '203.0.113.42', created_at: new Date(Date.now() - 86400000).toISOString(), status: 'failed' },
  { id: '5', action: 'profile_updated', resource: 'profiles',  ip: '192.168.1.1', created_at: new Date(Date.now() - 172800000).toISOString(), status: 'success' },
];

const SECURITY_CHECKS = [
  { id: 'password',   label: 'Strong password set',         done: true,  desc: 'Your account is protected with a secure password' },
  { id: 'email',      label: 'Email verified',              done: true,  desc: 'Your email address has been verified' },
  { id: '2fa',        label: 'Two-factor authentication',   done: false, desc: 'Enable 2FA for maximum account security' },
  { id: 'sessions',   label: 'No suspicious sessions',      done: true,  desc: 'All active sessions look normal' },
  { id: 'api_keys',   label: 'API keys reviewed',           done: true,  desc: 'No expired or unused API keys detected' },
  { id: 'soc2',       label: 'SOC2 compliance ready',       done: true,  desc: 'Your data is protected under SOC2 standards' },
];

function SecurityScore({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
  const bg    = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="bg-white rounded-3xl border border-cream-dark p-6 flex items-center gap-5">
      <div className="relative w-20 h-20 shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="16" fill="none" stroke="#f5f0ff" strokeWidth="3" />
          <circle cx="18" cy="18" r="16" fill="none" stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
            strokeWidth="3" strokeDasharray={`${score} 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-black ${color}`}>{score}</span>
        </div>
      </div>
      <div>
        <p className="text-lg font-black text-gray-800">Security Score</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {score >= 80 ? 'Your account is well protected' : score >= 60 ? 'A few improvements recommended' : 'Action required to secure account'}
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className={`w-2 h-2 rounded-full ${bg}`} />
          <span className={`text-xs font-semibold ${color}`}>
            {score >= 80 ? 'Strong' : score >= 60 ? 'Moderate' : 'Weak'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SecurityPage() {
  const { user } = useAuth();
  const { toasts, addToast, removeToast } = useToasts();
  const [sessions,       setSessions]       = useState<Session[]>(MOCK_SESSIONS);
  const [logs,           setLogs]           = useState<AuditLog[]>(MOCK_LOGS);
  const [tab,            setTab]            = useState<'overview' | 'sessions' | 'audit' | 'compliance'>('overview');
  const [showPassword,   setShowPassword]   = useState(false);
  const [newPassword,    setNewPassword]    = useState('');
  const [confirmPwd,     setConfirmPwd]     = useState('');
  const [changingPwd,    setChangingPwd]    = useState(false);
  const [twoFAEnabled,   setTwoFAEnabled]   = useState(false);

  const score = SECURITY_CHECKS.filter(c => c.done).length / SECURITY_CHECKS.length * 100 | 0;

  const handleChangePassword = async () => {
    if (newPassword !== confirmPwd) { addToast('Passwords do not match', 'error'); return; }
    if (newPassword.length < 8) { addToast('Password must be at least 8 characters', 'error'); return; }
    setChangingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      addToast('Password updated successfully', 'success');
      setNewPassword(''); setConfirmPwd('');
    } catch {
      addToast('Failed to update password', 'error');
    } finally { setChangingPwd(false); }
  };

  const revokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id === id || s.current));
    addToast('Session revoked', 'info');
  };

  void user;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-lavender-light rounded-2xl flex items-center justify-center">
            <Shield size={18} className="text-lavender-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800">Security Center</h1>
            <p className="text-xs text-gray-400">Enterprise-grade security for your account</p>
          </div>
        </div>

        {/* Score */}
        <SecurityScore score={score} />

        {/* Tabs */}
        <div className="flex items-center gap-1.5 my-5 overflow-x-auto pb-0.5">
          {[
            { id: 'overview',    label: 'Overview',    icon: Shield   },
            { id: 'sessions',    label: 'Sessions',    icon: Globe    },
            { id: 'audit',       label: 'Audit Log',   icon: Activity },
            { id: 'compliance',  label: 'Compliance',  icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id as typeof tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                tab === id ? 'bg-lavender text-white' : 'bg-white border border-cream-dark text-gray-500 hover:border-lavender'
              }`}>
              <Icon size={11} /> {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-4">
            {/* Checklist */}
            <div className="bg-white rounded-2xl border border-cream-dark p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-4">Security Checklist</h2>
              <div className="space-y-3">
                {SECURITY_CHECKS.map(check => (
                  <div key={check.id} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${check.done ? 'bg-mint/30' : 'bg-amber-50'}`}>
                      {check.done
                        ? <CheckCircle size={13} className="text-emerald-600" />
                        : <AlertTriangle size={13} className="text-amber-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700">{check.label}</p>
                      <p className="text-[10px] text-gray-400">{check.desc}</p>
                    </div>
                    {!check.done && (
                      <button className="text-[10px] font-bold text-lavender-dark bg-lavender-light px-2 py-0.5 rounded-full hover:bg-lavender hover:text-white transition-colors">
                        Enable
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Change password */}
            <div className="bg-white rounded-2xl border border-cream-dark p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Key size={14} className="text-lavender-dark" /> Change Password</h2>
              <div className="space-y-3">
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-dark text-sm focus:border-lavender outline-none pr-9" />
                  <button onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-dark text-sm focus:border-lavender outline-none" />
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => void handleChangePassword()}
                  disabled={!newPassword || !confirmPwd || changingPwd}
                  className="px-4 py-2 bg-lavender text-white rounded-xl text-xs font-bold hover:bg-lavender-dark transition-colors disabled:opacity-40">
                  {changingPwd ? 'Updating…' : 'Update Password'}
                </motion.button>
              </div>
            </div>

            {/* 2FA */}
            <div className="bg-white rounded-2xl border border-cream-dark p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone size={16} className="text-lavender-dark" />
                  <div>
                    <p className="text-sm font-bold text-gray-700">Two-Factor Authentication</p>
                    <p className="text-[11px] text-gray-400">Add an extra layer of security with 2FA</p>
                  </div>
                </div>
                <button onClick={() => { setTwoFAEnabled(v => !v); addToast(twoFAEnabled ? '2FA disabled' : '2FA setup coming soon — stay tuned', 'info'); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${twoFAEnabled ? 'bg-mint/30 text-emerald-700' : 'bg-lavender text-white hover:bg-lavender-dark'}`}>
                  {twoFAEnabled ? '✓ Enabled' : 'Enable 2FA'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'sessions' && (
          <div className="bg-white rounded-2xl border border-cream-dark p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Globe size={14} className="text-lavender-dark" /> Active Sessions</h2>
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className={`flex items-center gap-3 p-3 rounded-xl ${s.current ? 'bg-lavender-light/30 border border-lavender/20' : 'bg-cream'}`}>
                  <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0">
                    <Globe size={14} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      {s.device}
                      {s.current && <span className="text-[9px] font-bold bg-lavender text-white px-1.5 py-0.5 rounded-full">Current</span>}
                    </p>
                    <p className="text-[10px] text-gray-400">{s.location} · {s.ip}</p>
                    <p className="text-[10px] text-gray-400">Last seen: {new Date(s.last_seen).toLocaleString()}</p>
                  </div>
                  {!s.current && (
                    <button onClick={() => revokeSession(s.id)}
                      className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors">
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => { setSessions([MOCK_SESSIONS[0]]); addToast('All other sessions revoked', 'info'); }}
              className="mt-4 text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
              Revoke all other sessions
            </button>
          </div>
        )}

        {tab === 'audit' && (
          <div className="bg-white rounded-2xl border border-cream-dark p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Activity size={14} className="text-lavender-dark" /> Audit Log</h2>
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b border-cream last:border-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${log.status === 'success' ? 'bg-emerald-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 capitalize">{log.action.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] text-gray-400">{log.resource} · {log.ip}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'compliance' && (
          <div className="space-y-4">
            {[
              { title: 'SOC2 Type II', status: 'In Progress', desc: 'Point Club is actively pursuing SOC2 Type II certification. Audit preparation is underway with continuous monitoring enabled.', icon: '🛡️', progress: 75 },
              { title: 'GDPR Compliance', status: 'Compliant', desc: 'All user data processing follows GDPR requirements. Data export and deletion requests are supported.', icon: '🇪🇺', progress: 100 },
              { title: 'CCPA Compliance', status: 'Compliant', desc: 'California Consumer Privacy Act requirements met. Users can opt out of data sharing at any time.', icon: '🏛️', progress: 100 },
              { title: 'Data Encryption', status: 'Active', desc: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Encryption keys are rotated quarterly.', icon: '🔐', progress: 100 },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl border border-cream-dark p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="text-sm font-bold text-gray-800">{item.title}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'Compliant' || item.status === 'Active' ? 'bg-mint/30 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
                <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.progress}%` }} transition={{ duration: 1, delay: 0.2 }}
                    className={`h-full rounded-full ${item.progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
              </div>
            ))}

            <div className="bg-white rounded-2xl border border-cream-dark p-5">
              <h2 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><Users size={14} className="text-lavender-dark" /> Data Requests</h2>
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center gap-2 p-3 rounded-xl bg-cream hover:bg-cream-dark transition-colors text-left">
                  <Lock size={14} className="text-lavender-dark" />
                  <div>
                    <p className="text-xs font-bold text-gray-700">Export My Data</p>
                    <p className="text-[10px] text-gray-400">Download all your data</p>
                  </div>
                </button>
                <button className="flex items-center gap-2 p-3 rounded-xl bg-red-50 hover:bg-red-100 transition-colors text-left">
                  <AlertTriangle size={14} className="text-red-500" />
                  <div>
                    <p className="text-xs font-bold text-red-700">Delete Account</p>
                    <p className="text-[10px] text-red-400">Permanently remove data</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
