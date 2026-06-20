import * as THREE from 'three';
import { golemState, useGolemStore, type GolemTask, type GolemMood } from '../state/golemStore';
import { nextTask, type TaskPlan } from './brain';
import { STATIONS, CANVAS_FOCUS, OBSTACLES, GOLEM } from './golemConfig';
import { groundHeightAt } from '../config/terrain';
import { CursorTracker } from './cursor';
import { paintNext, artworkProgress, artworkComplete } from './canvasArtwork';
import { damp, dampAngle, headingTo, pulse } from './animation';

/** Everything the component applies to the rig each frame. */
export interface GolemPose {
  position: THREE.Vector3;
  yaw: number;
  lean: number;       // forward lean (rad)
  bob: number;        // extra vertical bob
  squash: number;     // uniform squash/stretch (1 = rest)
  brushSwing: number; // painting hand phase (-1..1)
  wiggle: number;     // sideways body wiggle (rad)
  roll: number;       // full-body roll (acrobatics)
  scale: number;      // scale multiplier (fourth-wall emerge)
  stride: number;     // leg swing phase while walking (-1..1)
}

type Phase = 'travel' | 'work';

/** A transient one-shot animation (flip, bow, toss…) that overrides gestures. */
interface Special {
  t: number;
  dur: number;
  apply: (p: GolemPose, k: number) => void;  // k = 0..1 progress
  done?: () => void;
}

export class GolemController {
  readonly pose: GolemPose = {
    position: STATIONS.easel.clone(),
    yaw: 0, lean: 0, bob: 0, squash: 1, brushSwing: 0, wiggle: 0, roll: 0, scale: 1, stride: 0,
  };
  readonly cursor = new CursorTracker();

  private plan: TaskPlan = { task: 'idle', station: 'stool', duration: [4, 6] };
  private phase: Phase = 'work';
  private timer = 2;
  private target = STATIONS.easel.clone();
  private paintAccum = 0;
  private gestureT = 0;
  private noticeCd = 0;
  private noticing = 0;
  private followCd = 10;
  private rareCd = 12;
  private special: Special | null = null;

  private set = useGolemStore.getState().set;
  private tmp = new THREE.Vector3();
  private camPos = new THREE.Vector3();

  update(dt: number, camera: THREE.Camera, pointer: THREE.Vector2) {
    dt = Math.min(dt, 0.05);
    this.cursor.update(pointer, camera, dt);
    const s = golemState();

    if (s.fourthWall !== 'none') { this.updateFourthWall(dt, camera, s.fourthWall); return; }
    this.pose.scale = damp(this.pose.scale, 1, 6, dt);
    this.pose.roll = damp(this.pose.roll, 0, 8, dt);
    this.pose.stride = damp(this.pose.stride, 0, 8, dt); // legs settle when not walking

    // one-shot special actions take priority over the task gesture
    if (this.special) { this.runSpecial(dt); }
    else {
      this.updateCursorAttention(dt, s.distraction);
      this.updateLoop(dt);
      this.updateRareEvents(dt);
    }

    this.resolveObstacles();
    this.pose.position.y = groundHeightAt(this.pose.position.x, this.pose.position.z);
  }

  // ── goal loop ──────────────────────────────────────────────────────
  private updateLoop(dt: number) {
    this.timer -= dt;
    if (this.phase === 'travel') {
      const arrived = this.moveToward(this.target, dt);
      if (this.tmp.set(this.target.x - this.pose.position.x, 0, this.target.z - this.pose.position.z).lengthSq() > 0.02)
        this.faceYaw(headingTo(this.pose.position, this.target), dt, 10);
      this.pose.lean = damp(this.pose.lean, 0.04, 6, dt);
      this.pose.brushSwing = damp(this.pose.brushSwing, 0, 8, dt);
      if (arrived) { this.phase = 'work'; this.gestureT = 0; this.timer = this.pickDuration(); }
      return;
    }
    this.gestureT += dt;
    this.performTask(this.plan.task, dt);
    if (this.timer <= 0) this.chooseNext();
  }

  private chooseNext() {
    this.plan = nextTask(this.plan.task, artworkProgress());
    this.target.copy(STATIONS[this.plan.station]);
    this.phase = 'travel';
    this.set({ task: this.plan.task, mood: this.moodFor(this.plan.task) });
  }

  private performTask(task: GolemTask, dt: number) {
    switch (task) {
      case 'paint': {
        this.faceLook(CANVAS_FOCUS, dt);
        this.pose.lean = damp(this.pose.lean, 0.22, 5, dt);
        this.pose.brushSwing = Math.sin(this.gestureT * 4.5) * 0.8;
        this.pose.bob = damp(this.pose.bob, Math.sin(this.gestureT * 4.5) * 0.02, 6, dt);
        this.paintAccum += dt;
        if (this.paintAccum > 1.6 && !artworkComplete()) {
          this.paintAccum = 0;
          this.set({ artProgress: paintNext(1) });
        }
        break;
      }
      case 'inspect':
      case 'review': {
        this.faceLook(CANVAS_FOCUS, dt);
        this.pose.lean = damp(this.pose.lean, 0.18 + Math.sin(this.gestureT * 1.2) * 0.05, 4, dt);
        this.pose.wiggle = damp(this.pose.wiggle, Math.sin(this.gestureT * 0.8) * 0.08, 4, dt);
        this.pose.brushSwing = damp(this.pose.brushSwing, 0, 6, dt);
        this.pose.bob = damp(this.pose.bob, 0, 6, dt);
        break;
      }
      case 'measure': {
        const t = (Math.sin(this.gestureT * 0.8) + 1) / 2;
        this.tmp.copy(STATIONS.canvasLeft).lerp(STATIONS.canvasRight, t);
        this.moveToward(this.tmp, dt);
        this.faceLook(CANVAS_FOCUS, dt);
        this.pose.lean = damp(this.pose.lean, 0.1, 4, dt);
        break;
      }
      case 'mix':
      case 'fetch': {
        this.faceLook(STATIONS.bench, dt);
        this.pose.lean = damp(this.pose.lean, 0.12, 4, dt);
        this.pose.brushSwing = Math.sin(this.gestureT * 2.6) * 0.35;
        this.pose.bob = damp(this.pose.bob, 0, 6, dt);
        break;
      }
      case 'plan': {
        this.faceLook(CANVAS_FOCUS, dt);
        this.pose.lean = damp(this.pose.lean, 0.04, 4, dt);
        this.pose.wiggle = damp(this.pose.wiggle, Math.sin(this.gestureT * 0.6) * 0.12, 3, dt);
        break;
      }
      case 'celebrate': {
        this.faceLook(CANVAS_FOCUS, dt);
        this.pose.bob = damp(this.pose.bob, Math.abs(Math.sin(this.gestureT * 5)) * 0.08, 6, dt);
        this.pose.squash = 1 + Math.sin(this.gestureT * 5) * 0.04;
        break;
      }
      case 'idle':
      default: {
        this.pose.bob = damp(this.pose.bob, Math.sin(this.gestureT * 1.4) * 0.015, 3, dt);
        this.pose.lean = damp(this.pose.lean, 0, 4, dt);
        this.pose.brushSwing = Math.sin(this.gestureT * 0.5) * 0.12;
        this.faceYaw(this.baseYaw() + Math.sin(this.gestureT * 0.3) * 0.5, dt, 2);
        break;
      }
    }
  }

  // ── cursor awareness ───────────────────────────────────────────────
  private updateCursorAttention(dt: number, distraction: number) {
    const dist = this.cursor.distanceTo(this.pose.position);
    const near = dist < 2.2;
    const active = this.cursor.activity > 0.25;
    this.noticeCd -= dt; this.followCd -= dt;

    let d = distraction;
    d = near && active ? Math.min(1, d + dt * 0.7) : Math.max(0, d - dt * 0.35);
    this.set({ distraction: d });

    if (!golemState().following && this.followCd <= 0 && near && active && Math.random() < 0.05 * dt * 60) this.startFollow();
    if (golemState().following) { this.followCursor(dt); return; }

    if (this.noticing > 0) {
      this.noticing -= dt;
      this.faceLook(this.cursor.world, dt, 6);
    } else if (near && this.noticeCd <= 0) {
      this.noticing = 0.7 + Math.random() * 0.8;
      this.noticeCd = 3 + Math.random() * 4;
      this.set({ mood: 'curious' });
    }

    if (d > 0.55) {
      this.set({ mood: d > 0.85 ? 'annoyed' : 'curious' });
      this.pose.wiggle += Math.sin(performance.now() * 0.02) * 0.04 * d;
      if (d > 0.85) {
        this.set({ mood: 'playful' });
        this.pose.bob = Math.max(this.pose.bob, Math.abs(Math.sin(performance.now() * 0.012)) * 0.07); // small tickle hop
        this.pose.squash = 1 + Math.sin(performance.now() * 0.024) * 0.04;
      }
    }
  }

  private startFollow() {
    this.set({ following: true, mood: 'playful' });
    this.followCd = 20 + Math.random() * 12;
    this.noticing = 0;
    window.setTimeout(() => this.set({ following: false, mood: 'neutral' }), 5000 + Math.random() * 5000);
  }
  private followCursor(dt: number) {
    this.moveToward(this.cursor.world, dt);
    this.faceLook(this.cursor.world, dt, 8);
    this.pose.brushSwing = Math.sin(performance.now() * 0.01) * 0.6;
  }

  // ── personality / special one-shots ────────────────────────────────
  private updateRareEvents(dt: number) {
    this.rareCd -= dt;
    if (this.rareCd > 0) return;
    this.rareCd = 16 + Math.random() * 22;
    const r = Math.random();
    if (r < 0.18) this.startSpecial(this.flip());
    else if (r < 0.34) this.startSpecial(this.tossBrush());
    else if (r < 0.5) this.startSpecial(this.sit());
    else if (r < 0.68) this.startSpecial(this.observe());
    else if (r < 0.84) this.startSpecial(this.bow());
    else this.set({ mood: 'proud' }); // admire the masterpiece
  }

  private startSpecial(s: Special) { this.special = s; this.gestureT = 0; }
  private runSpecial(dt: number) {
    const s = this.special!;
    s.t += dt;
    const k = Math.min(1, s.t / s.dur);
    s.apply(this.pose, k);
    if (k >= 1) { s.done?.(); this.special = null; }
  }

  private flip(): Special {
    this.set({ mood: 'playful' });
    return { t: 0, dur: 0.9, apply: (p, k) => {
      p.bob = pulse(k) * 0.9;                 // leap
      p.roll = -k * Math.PI * 2;              // full forward rotation
      p.squash = 1 + (k < 0.15 ? k * 0.4 : 0) - (k > 0.85 ? (k - 0.85) * 0.6 : 0);
    }, done: () => this.set({ mood: 'neutral' }) };
  }
  private tossBrush(): Special {
    this.set({ mood: 'playful' });
    return { t: 0, dur: 1.1, apply: (p, k) => {
      p.brushSwing = Math.sin(k * Math.PI) * 2.0;  // big up-and-catch arc
      p.bob = pulse(k) * 0.06; p.lean = -0.1 * pulse(k);
    }, done: () => this.set({ mood: 'proud' }) };
  }
  private sit(): Special {
    this.set({ mood: 'neutral' });
    return { t: 0, dur: 3.2, apply: (p, k) => {
      const s = k < 0.2 ? k / 0.2 : k > 0.8 ? (1 - k) / 0.2 : 1; // ease down then up
      p.bob = -0.18 * s; p.lean = -0.12 * s; p.squash = 1 + 0.08 * s;
    } };
  }
  private observe(): Special {
    this.set({ mood: 'curious' });
    return { t: 0, dur: 2.6, apply: (p, k) => {
      p.yaw = this.baseYaw() + Math.sin(k * Math.PI * 2) * 0.9; // look around at scenery
      p.lean = Math.sin(k * Math.PI) * 0.1;
    } };
  }
  private bow(): Special {
    this.set({ mood: 'proud' });
    return { t: 0, dur: 1.0, apply: (p, k) => { p.lean = 0.05 + pulse(k) * 0.55; }, done: () => this.set({ mood: 'neutral' }) };
  }

  // ── fourth-wall set-piece (made large & clearly visible) ───────────
  private updateFourthWall(dt: number, camera: THREE.Camera, phase: string) {
    this.camPos.setFromMatrixPosition(camera.matrixWorld);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    const edge = this.camPos.clone().addScaledVector(fwd, 9).setY(0.2); // edge of the world

    switch (phase) {
      case 'freeze': {
        const t = (performance.now() % 2400) / 2400;
        this.faceYaw(this.baseYaw() + Math.sin(t * Math.PI * 2) * 1.0, dt, 5);
        this.pose.lean = damp(this.pose.lean, 0, 5, dt);
        this.pose.position.y = groundHeightAt(this.pose.position.x, this.pose.position.z);
        break;
      }
      case 'approach': {
        this.moveToward(edge, dt);
        this.faceLook(this.camPos, dt, 6);
        this.pose.position.y = groundHeightAt(this.pose.position.x, this.pose.position.z);
        break;
      }
      case 'reach': {
        // climb up toward the viewer with little hops, growing larger
        const front = this.frontOfCamera(camera, 9, -0.6);
        this.pose.position.lerp(front, 1 - Math.exp(-6 * dt));
        this.faceLook(this.camPos, dt, 8);
        this.pose.lean = damp(this.pose.lean, 0.4, 4, dt);
        this.pose.scale = damp(this.pose.scale, 1.6, 4, dt);
        this.pose.bob = Math.abs(Math.sin(performance.now() * 0.009)) * 0.22; // climbing hops
        break;
      }
      case 'emerge': {
        // multiple jumps right up to the camera — occupies ~30% of the frame
        const front = this.frontOfCamera(camera, 7.5, -0.5);
        this.pose.position.lerp(front, 1 - Math.exp(-7 * dt));
        this.faceLook(this.camPos, dt, 10);
        this.pose.scale = damp(this.pose.scale, 2.1, 5, dt);
        this.pose.bob = Math.abs(Math.sin(performance.now() * 0.012)) * 0.3;
        break;
      }
      case 'clean': {
        // big, slow, clearly-visible scrubbing centred on the stain
        const front = this.frontOfCamera(camera, 7.5, -0.45);
        this.pose.position.lerp(front, 1 - Math.exp(-6 * dt));
        this.faceLook(this.camPos, dt, 8);
        this.pose.scale = damp(this.pose.scale, 2.0, 4, dt);
        this.pose.brushSwing = Math.sin(performance.now() * 0.009) * 1.3;     // sweeping wipes
        this.pose.lean = 0.25 + Math.sin(performance.now() * 0.009) * 0.12;
        this.pose.wiggle = Math.sin(performance.now() * 0.009) * 0.18;        // whole-body scrub
        this.pose.bob = Math.abs(Math.sin(performance.now() * 0.018)) * 0.05;
        break;
      }
      case 'return': {
        this.pose.scale = damp(this.pose.scale, 1, 5, dt);
        const arrived = this.moveToward(STATIONS.easel, dt);
        this.faceLook(CANVAS_FOCUS, dt, 5);
        this.pose.lean = damp(this.pose.lean, 0.05, 4, dt);
        this.pose.position.y = groundHeightAt(this.pose.position.x, this.pose.position.z);
        if (arrived) {
          this.set({ fourthWall: 'none', mood: 'proud', task: 'review' });
          this.phase = 'work'; this.plan = nextTask('paint', artworkProgress()); this.timer = 2;
        }
        break;
      }
    }
  }

  /** A point centred on the stain (or screen centre), `dist` in front of camera. */
  private frontOfCamera(camera: THREE.Camera, dist: number, vshift: number): THREE.Vector3 {
    const stain = golemState().stain;
    const ndc = new THREE.Vector3(0, vshift, 0.5);
    if (stain && typeof window !== 'undefined') {
      ndc.x = (stain.x / window.innerWidth) * 2 - 1;
      ndc.y = -((stain.y / window.innerHeight) * 2 - 1) + vshift;
    }
    ndc.unproject(camera);
    const dir = ndc.sub(this.camPos).normalize();
    return this.camPos.clone().addScaledVector(dir, dist);
  }

  // ── motion helpers ─────────────────────────────────────────────────
  /** Walk toward target (gentle bob, not a hop). Returns true when arrived. */
  private moveToward(target: THREE.Vector3, dt: number): boolean {
    const p = this.pose.position;
    this.tmp.set(target.x - p.x, 0, target.z - p.z);
    const d = this.tmp.length();
    if (d < 0.06) { this.pose.bob = damp(this.pose.bob, 0, 6, dt); this.pose.squash = damp(this.pose.squash, 1, 6, dt); return true; }
    const step = Math.min(d, GOLEM.walkSpeed * dt);
    this.tmp.normalize().multiplyScalar(step);
    p.x += this.tmp.x; p.z += this.tmp.z;
    const stride = Math.sin(performance.now() * 0.001 * GOLEM.stepRate * Math.PI * 2);
    this.pose.stride = stride;                 // drives the leg swing
    this.pose.bob = Math.abs(stride) * GOLEM.bobHeight;
    this.pose.squash = 1 + stride * 0.025;     // subtle weight shift
    this.pose.wiggle = stride * 0.04;          // gentle waddle
    this.pose.brushSwing = damp(this.pose.brushSwing, 0, 8, dt);
    return false;
  }

  /** Push the golem out of any soft obstacle it overlaps. */
  private resolveObstacles() {
    const p = this.pose.position;
    for (const o of OBSTACLES) {
      const dx = p.x - o.x, dz = p.z - o.z;
      const d = Math.hypot(dx, dz);
      if (d < o.r && d > 1e-4) {
        const push = (o.r - d);
        p.x += (dx / d) * push;
        p.z += (dz / d) * push;
      }
    }
  }

  private faceYaw(target: number, dt: number, lambda = 6) { this.pose.yaw = dampAngle(this.pose.yaw, target, lambda, dt); }
  private faceLook(point: THREE.Vector3, dt: number, lambda = 5) { this.faceYaw(headingTo(this.pose.position, point), dt, lambda); }
  private baseYaw(): number { return headingTo(this.pose.position, CANVAS_FOCUS); }
  private pickDuration(): number { const [a, b] = this.plan.duration; return a + Math.random() * (b - a); }
  private moodFor(task: GolemTask): GolemMood {
    if (task === 'celebrate') return 'proud';
    if (task === 'idle' || task === 'paint') return 'neutral';
    return 'curious';
  }
}
