import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

export default function OfflineIndicator() {
  const online  = useOnlineStatus();
  const [showReconnect, setShowReconnect] = useState(false);

  useEffect(() => {
    if (!online) {
      setShowReconnect(false);
    } else {
      setShowReconnect(true);
      const t = setTimeout(() => setShowReconnect(false), 3000);
      return () => clearTimeout(t);
    }
  }, [online]);

  return (
    <AnimatePresence>
      {(!online || showReconnect) && (
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 rounded-2xl shadow-xl text-sm font-semibold ${
            online ? 'bg-mint/30 text-emerald-700 border border-emerald-200' : 'bg-coral/20 text-coral-dark border border-coral/30'
          }`}
        >
          {online
            ? <><Wifi size={14} className="text-emerald-500" /> Back online — syncing…</>
            : <><WifiOff size={14} /> Offline — changes saved locally</>
          }
          {!online && (
            <button onClick={() => window.location.reload()} className="ml-1 hover:opacity-70 transition-opacity">
              <RefreshCw size={12} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
