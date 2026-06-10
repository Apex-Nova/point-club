import { motion } from 'framer-motion';
import { Wifi, WifiOff, Loader2, RefreshCw } from 'lucide-react';
import type { ConnectionStatus } from '@/types/room';

const config: Record<ConnectionStatus, { icon: React.ElementType; label: string; cls: string }> = {
  connecting:   { icon: Loader2,   label: 'Connecting…',  cls: 'text-gray-400 animate-spin' },
  syncing:      { icon: RefreshCw, label: 'Syncing…',     cls: 'text-lavender-dark animate-spin' },
  connected:    { icon: Wifi,      label: 'Connected',    cls: 'text-emerald-500' },
  reconnecting: { icon: RefreshCw, label: 'Reconnecting…',cls: 'text-orange-400 animate-spin' },
  disconnected: { icon: WifiOff,   label: 'Disconnected', cls: 'text-coral' },
};

export default function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  const { icon: Icon, label, cls } = config[status];
  return (
    <motion.div
      key={status}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 text-xs font-medium"
    >
      <Icon size={13} className={cls} />
      <span className={`hidden md:inline ${cls}`}>{label}</span>
    </motion.div>
  );
}
