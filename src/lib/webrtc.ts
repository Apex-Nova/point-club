export const ICE_SERVERS: RTCIceServer[] = [
  // Multiple STUN servers — critical for mobile users behind carrier-grade NAT
  { urls: 'stun:stun.l.google.com:19302'  },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: ICE_SERVERS,
    // Allow both UDP and TCP ICE candidates — TCP fallback helps on restrictive networks
    iceTransportPolicy: 'all',
  });
}

// Attaches a MediaStream to an audio element (handles autoplay policy)
export function attachRemoteStream(audio: HTMLAudioElement, stream: MediaStream): void {
  audio.srcObject = stream;
  audio.play().catch(() => {
    // Autoplay blocked — user gesture needed, ignore silently
  });
}

// Volume analyser for speaking detection
export function createVolumeAnalyser(stream: MediaStream) {
  const ctx     = new AudioContext();
  const src     = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.4;
  src.connect(analyser);
  const buf = new Uint8Array(analyser.frequencyBinCount);

  let rafId = 0;
  let cb: ((speaking: boolean) => void) | null = null;
  const THRESHOLD = 18;

  function tick() {
    analyser.getByteFrequencyData(buf);
    const rms = buf.reduce((a, b) => a + b, 0) / buf.length;
    cb?.(rms > THRESHOLD);
    rafId = requestAnimationFrame(tick);
  }

  return {
    start: (onSpeaking: (speaking: boolean) => void) => { cb = onSpeaking; rafId = requestAnimationFrame(tick); },
    stop:  () => { cancelAnimationFrame(rafId); ctx.close().catch(() => {}); },
  };
}

export function isWebRTCSupported(): boolean {
  return typeof RTCPeerConnection !== 'undefined' && typeof navigator?.mediaDevices?.getUserMedia !== 'undefined';
}
