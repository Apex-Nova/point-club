import { useEffect, useState } from 'react';

export default function PortraitOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      setShow(window.innerWidth < 768 && window.innerHeight > window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-lavender flex flex-col items-center justify-center gap-5">
      <div className="text-6xl" style={{ transform: 'rotate(90deg)' }}>📱</div>
      <p className="text-white text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        Rotate your device
      </p>
      <p className="text-white/70 text-sm text-center px-10">
        Point Club works in landscape mode only
      </p>
    </div>
  );
}
