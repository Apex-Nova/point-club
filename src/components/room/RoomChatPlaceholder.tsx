import { MessageSquare } from 'lucide-react';

export default function RoomChatPlaceholder() {
  return (
    <div className="border-t border-cream-dark px-3 py-3">
      <div className="rounded-xl bg-cream border border-dashed border-cream-dark p-3 opacity-60 cursor-not-allowed">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-lavender-light flex items-center justify-center">
            <MessageSquare size={12} className="text-lavender-dark" />
          </div>
          <span className="text-xs font-semibold text-gray-600">Room Chat</span>
        </div>
        <p className="text-[10px] text-gray-400">Coming in Phase 5</p>
      </div>
    </div>
  );
}
