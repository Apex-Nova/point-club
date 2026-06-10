import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Users, Hash, ArrowRight } from 'lucide-react';
import { createRoom } from '@/lib/services/rooms.service';
import { useAuth } from '@/contexts/AuthContext';
import Modal from '@/components/common/Modal';

export default function RoomsSection() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [createOpen, setCreateOpen] = useState(false);
  const [joinCode,   setJoinCode]   = useState('');
  const [roomName,   setRoomName]   = useState('');
  const [creating,   setCreating]   = useState(false);
  const [error,      setError]      = useState('');

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const { roomId } = await createRoom({
        name:   roomName.trim() || 'Untitled Room',
        userId: user?.id,
      });
      navigate(`/room/${roomId}`);
    } catch {
      setError('Failed to create room. Is the backend running?');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    navigate(`/room/${code}`);
  };

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-5">
        <h2 style={{ fontFamily: 'var(--font-display)' }} className="text-xl font-bold text-gray-700">
          Multiplayer Rooms
        </h2>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral-dark transition-colors shadow-sm"
        >
          <Plus size={15} />
          New Room
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Create card */}
        <motion.button
          whileHover={{ y: -3 }}
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-dashed border-cream-dark hover:border-lavender transition-all text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-lavender-light flex items-center justify-center shrink-0">
            <Users size={22} className="text-lavender-dark" />
          </div>
          <div>
            <p className="font-semibold text-gray-700 text-sm">Create a Room</p>
            <p className="text-xs text-gray-400 mt-0.5">Invite friends to draw together live</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 ml-auto" />
        </motion.button>

        {/* Join card */}
        <div className="flex items-center gap-3 p-5 bg-white rounded-2xl border-2 border-cream-dark">
          <div className="w-12 h-12 rounded-2xl bg-lavender-light flex items-center justify-center shrink-0">
            <Hash size={22} className="text-lavender-dark" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-700 text-sm mb-1.5">Join by Code</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="PC-A7K92M"
                maxLength={9}
                className="flex-1 min-w-0 px-3 py-1.5 rounded-xl border-2 border-cream-dark focus:border-lavender outline-none text-sm font-mono text-gray-700 placeholder-gray-300"
              />
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleJoin}
                disabled={!joinCode.trim()}
                className="px-3 py-1.5 rounded-xl bg-lavender text-white text-sm font-semibold hover:bg-lavender-dark transition-colors disabled:opacity-40"
              >
                Join
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setError(''); setRoomName(''); }} title="Create a Room">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Room name</label>
            <input
              type="text"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Design Sprint"
              autoFocus
              className="w-full px-4 py-3 rounded-2xl border-2 border-cream-dark focus:border-lavender outline-none transition-colors text-gray-800 placeholder-gray-400"
            />
          </div>
          {error && <p className="text-sm text-coral-dark">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button onClick={() => setCreateOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-cream transition-colors">
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-coral text-white text-sm font-semibold hover:bg-coral-dark transition-colors disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create & Enter'}
            </motion.button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
