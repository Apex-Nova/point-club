import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Pencil, ArrowLeft, ImageDown, Cloud, CloudOff, Loader2, CheckCheck } from 'lucide-react';
import type { CloudSaveStatus } from '@/hooks/useCloudSave';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  title?: string;
  onExportPNG: () => void;
  saveStatus?: CloudSaveStatus;
  lastSaved?: Date | null;
  onManualSave?: () => void;
}

function formatLastSaved(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)  return 'Just now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  const h = Math.floor(diffMin / 60);
  return h === 1 ? '1 hr ago' : `${h} hrs ago`;
}

const statusConfig: Record<CloudSaveStatus, { icon: React.ElementType; label: string; cls: string }> = {
  idle:    { icon: Cloud,     label: 'Cloud',      cls: 'text-gray-300' },
  unsaved: { icon: CloudOff,  label: 'Unsaved',    cls: 'text-orange-400' },
  saving:  { icon: Loader2,   label: 'Saving…',    cls: 'text-lavender-dark animate-spin' },
  saved:   { icon: CheckCheck,label: 'Saved',      cls: 'text-emerald-500' },
  error:   { icon: CloudOff,  label: 'Save failed',cls: 'text-coral' },
};

export default function DrawHeader({ title = 'Untitled Drawing', onExportPNG, saveStatus, lastSaved, onManualSave }: Props) {
  const { user } = useAuth();
  const st = saveStatus && statusConfig[saveStatus];

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex items-center justify-between px-4 h-12 bg-white border-b border-cream-dark shrink-0 z-30"
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to={user ? '/dashboard' : '/'}
          className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors text-sm font-medium shrink-0"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">{user ? 'Dashboard' : 'Home'}</span>
        </Link>

        <div className="w-px h-5 bg-cream-dark shrink-0" />

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 rounded-lg bg-lavender flex items-center justify-center">
            <Pencil size={12} className="text-white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)' }} className="text-sm font-bold text-gray-700 hidden sm:block">
            Point Club
          </span>
        </div>
      </div>

      {/* Center */}
      <span className="text-sm text-gray-400 font-medium hidden sm:block truncate max-w-xs">{title}</span>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Cloud save status */}
        {st && user && (
          <button
            onClick={onManualSave}
            title={lastSaved ? `Last saved ${formatLastSaved(lastSaved)}` : undefined}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-cream transition-colors"
          >
            <st.icon size={14} className={st.cls} />
            <span className={`text-xs font-medium hidden sm:block ${st.cls}`}>{st.label}</span>
          </button>
        )}

        {!user && (
          <Link to="/login" className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-light text-lavender-dark text-xs font-semibold hover:bg-lavender hover:text-white transition-colors">
            Sign in to save
          </Link>
        )}

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onExportPNG}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-lavender-light text-lavender-dark text-xs font-semibold hover:bg-lavender hover:text-white transition-colors"
        >
          <ImageDown size={13} />
          <span className="hidden sm:inline">Export PNG</span>
        </motion.button>
      </div>
    </motion.header>
  );
}
