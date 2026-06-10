import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Pencil, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import GoogleButton from '@/components/auth/GoogleButton';

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/dashboard';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoad, setGoogleLoad] = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoad(true);
    try {
      await signInWithGoogle();
      // Redirect handled by OAuth callback → /dashboard
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign in failed');
      setGoogleLoad(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-2/5 bg-lavender-dark flex-col justify-between p-12 relative overflow-hidden"
      >
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/10 translate-y-1/2 -translate-x-1/4" />

        <Link to="/" className="flex items-center gap-2 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Pencil size={18} className="text-white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-white">
            Point Club
          </span>
        </Link>

        <div className="relative z-10">
          {/* Mini illustration */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' as const }}
            className="mb-10"
          >
            <svg width="160" height="120" viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="15" width="120" height="85" rx="12" fill="white" opacity="0.15" />
              <path d="M35 70 Q 55 40 75 65 Q 95 90 115 55" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
              <circle cx="60" cy="50" r="8" fill="white" opacity="0.3" />
              <circle cx="110" cy="75" r="6" fill="white" opacity="0.25" />
              <path d="M45 40 Q 55 30 65 40" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
            </svg>
          </motion.div>

          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-4xl font-bold text-white leading-tight mb-4">
            Draw Together.<br />Think Together.
          </h1>
          <p className="text-lavender-light text-lg">
            Your creative space, synced across every device.
          </p>
        </div>

        <p className="text-lavender-light/70 text-sm relative z-10">
          Join 2,400+ creators already drawing on Point Club.
        </p>
      </motion.div>

      {/* Right panel — form */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 flex items-center justify-center px-6 py-12 bg-cream"
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-xl bg-lavender flex items-center justify-center">
              <Pencil size={14} className="text-white" />
            </div>
            <span style={{ fontFamily: 'var(--font-display)' }} className="text-lg font-bold text-gray-800">
              Point Club
            </span>
          </Link>

          <div className="mb-8">
            <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-bold text-gray-800 mb-1">
              Welcome back
            </h2>
            <p className="text-gray-500">Sign in to your creative space</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-coral/15 border border-coral-light text-coral-dark text-sm mb-5"
            >
              <AlertCircle size={15} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 rounded-2xl border-2 border-cream-dark bg-white focus:border-lavender outline-none transition-colors text-gray-800 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 pr-11 rounded-2xl border-2 border-cream-dark bg-white focus:border-lavender outline-none transition-colors text-gray-800 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-lavender-dark text-white font-semibold hover:bg-lavender transition-colors shadow-md disabled:opacity-60 text-sm"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </motion.button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-cream-dark" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-cream-dark" />
          </div>

          <GoogleButton onClick={handleGoogle} loading={googleLoad} />

          <p className="text-center text-sm text-gray-500 mt-6">
            New to Point Club?{' '}
            <Link to="/signup" className="text-lavender-dark font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
