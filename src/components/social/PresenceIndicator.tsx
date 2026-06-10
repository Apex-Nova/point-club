const STATUS_COLORS = {
  online:   'bg-emerald-400',
  away:     'bg-yellow-400',
  drawing:  'bg-lavender',
  in_room:  'bg-sky-400',
  offline:  'bg-gray-300',
};

const STATUS_LABELS = {
  online:   'Online',
  away:     'Away',
  drawing:  'Drawing',
  in_room:  'In a room',
  offline:  'Offline',
};

type Status = keyof typeof STATUS_COLORS;

interface Props {
  status: Status;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export default function PresenceIndicator({ status, size = 'sm', showLabel }: Props) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`${dotSize} rounded-full ${STATUS_COLORS[status] ?? STATUS_COLORS.offline} shrink-0`} />
      {showLabel && <span className="text-xs text-gray-500">{STATUS_LABELS[status] ?? 'Offline'}</span>}
    </span>
  );
}
