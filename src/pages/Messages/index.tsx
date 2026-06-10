import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Pencil, ArrowLeft, Lock } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-cream-dark px-6 py-4 flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-7 h-7 rounded-lg bg-lavender flex items-center justify-center">
            <Pencil size={13} className="text-white" />
          </div>
          <span style={{ fontFamily: 'var(--font-display)' }} className="font-bold text-gray-800">
            Point Club
          </span>
        </div>
      </header>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 rounded-3xl bg-lavender-light flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={36} className="text-lavender-dark" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-peach/40 text-orange-500 text-xs font-semibold mb-4">
            <Lock size={10} /> Coming in Phase 6
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)' }} className="text-3xl font-bold text-gray-800 mb-3">
            Direct Messages
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            Private conversations with friends and collaborators are on the way.
            For now, connect through rooms and voice chat!
          </p>

          <div className="space-y-3">
            <Link to="/discover">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-2xl bg-lavender text-white font-semibold text-sm hover:bg-lavender-dark transition-colors"
              >
                Discover Creators
              </motion.button>
            </Link>
            <Link to="/dashboard">
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="w-full py-2.5 rounded-2xl border-2 border-cream-dark text-gray-500 font-semibold text-sm hover:border-lavender/50 transition-colors"
              >
                Back to Dashboard
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
