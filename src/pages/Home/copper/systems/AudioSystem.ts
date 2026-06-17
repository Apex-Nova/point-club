/**
 * AudioSystem — tiny WebAudio synth so we need no asset files. All sounds are
 * generated: soft brush ticks, wooden footsteps, cute mechanical blips, cheerful
 * celebration chimes, plus a gentle ambient bed of wind + occasional birdsong.
 *
 * Disabled by default (browsers block autoplay); the scene's speaker toggle
 * calls setEnabled(true) from a user gesture, which resumes the context.
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private birdTimer = 0;
  enabled = false;

  private ensure() {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.0;
    this.master.connect(this.ctx.destination);
    this.startAmbient();
    return this.ctx;
  }

  setEnabled(on: boolean) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    this.enabled = on;
    if (on) void ctx.resume();
    this.master.gain.linearRampToValueAtTime(on ? 0.5 : 0.0, ctx.currentTime + 0.4);
  }

  private startAmbient() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    // filtered noise → wind
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buffer.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer; noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 420;
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.12;
    noise.connect(lp).connect(this.ambientGain).connect(this.master);
    noise.start();
  }

  private blip(freq: number, dur: number, type: OscillatorType, gain = 0.2) {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.enabled) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(g).connect(this.master);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  brushTick() { this.blip(180 + Math.random() * 80, 0.06, 'triangle', 0.05); }
  footstep()  { this.blip(90 + Math.random() * 20, 0.1, 'sine', 0.12); }
  blipCute()  { this.blip(520, 0.08, 'square', 0.08); this.blip(780, 0.1, 'square', 0.05); }
  thud()      { this.blip(70, 0.18, 'sine', 0.22); }

  chime() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.blip(f, 0.35, 'triangle', 0.12), i * 70));
  }

  /** call each frame for sparse birdsong */
  tickAmbient(dt: number) {
    if (!this.enabled) return;
    this.birdTimer -= dt;
    if (this.birdTimer <= 0) {
      this.birdTimer = 4 + Math.random() * 7;
      const base = 1400 + Math.random() * 800;
      this.blip(base, 0.08, 'sine', 0.05);
      setTimeout(() => this.blip(base * 1.18, 0.07, 'sine', 0.04), 90);
    }
  }
}
