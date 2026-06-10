import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Pencil, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import LocaleSwitcher from '@/components/common/LocaleSwitcher';
import { useAuth } from '@/contexts/AuthContext';

const links: { label: string; href: string }[] = [];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/92 backdrop-blur-xl shadow-[0_1px_0_rgb(0_0_0/0.06),0_4px_16px_rgb(0_0_0/0.06)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-xl bg-lavender flex items-center justify-center shadow-[0_2px_8px_rgb(139_120_224/0.4)] group-hover:bg-lavender-dark transition-colors">
            <Pencil size={15} className="text-white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-lg font-bold text-gray-900 tracking-tight">
            Point Club
          </span>
        </Link>

        {/* Nav links — desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === link.href
                  ? 'text-lavender-dark bg-lavender-light'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-cream'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions — desktop */}
        <div className="hidden md:flex items-center gap-2">
          <LocaleSwitcher />

          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/draw')}>
                <Sparkles size={14} /> Draw
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/draw')}>
                <Pencil size={14} /> Start Free
              </Button>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-xl hover:bg-cream transition-colors text-gray-700"
          aria-label="Toggle menu"
        >
          <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </motion.div>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="md:hidden bg-white border-t border-cream-dark overflow-hidden shadow-[0_8px_24px_rgb(0_0_0/0.10)]"
          >
            <div className="px-6 py-5 flex flex-col gap-3">
              {links.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="py-2 text-gray-700 font-medium hover:text-lavender-dark transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center justify-between pt-2 border-t border-cream-dark">
                <LocaleSwitcher />
              </div>
              <div className="flex flex-col gap-2 pt-1">
                {user ? (
                  <>
                    <Button variant="secondary" size="sm" fullWidth onClick={() => navigate('/dashboard')}>
                      Dashboard
                    </Button>
                    <Button variant="primary" size="sm" fullWidth onClick={() => navigate('/draw')}>
                      <Pencil size={14} /> Start Drawing
                    </Button>
                    <button
                      onClick={() => signOut()}
                      className="text-sm text-gray-400 hover:text-coral-dark transition-colors py-1 text-center"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" size="sm" fullWidth onClick={() => navigate('/login')}>
                      Sign in
                    </Button>
                    <Button variant="primary" size="sm" fullWidth onClick={() => navigate('/draw')}>
                      <Pencil size={14} /> Start Free
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
