import { motion } from 'framer-motion';
import { Crown, Lock, Sparkles } from 'lucide-react';

interface Props {
  feature:     string;
  description?: string;
  children?:   React.ReactNode;
}

export default function PremiumGate({ feature, description, children }: Props) {
  return (
    <div className="relative">
      {/* Blurred preview */}
      {children && (
        <div className="pointer-events-none select-none filter blur-sm opacity-40">
          {children}
        </div>
      )}

      {/* Gate overlay */}
      <div className={`${children ? 'absolute inset-0' : ''} flex flex-col items-center justify-center gap-3 p-6 text-center`}>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-peach to-coral flex items-center justify-center shadow-lg">
          <Crown size={22} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800">{feature}</p>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-orange-500 bg-peach/30 px-3 py-1 rounded-full">
          <Lock size={9} /> Premium Feature
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-peach to-coral text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
        >
          <Sparkles size={11} /> Upgrade to Pro
          <span className="text-[9px] opacity-75 ml-0.5">· Coming Soon</span>
        </motion.button>
      </div>
    </div>
  );
}
