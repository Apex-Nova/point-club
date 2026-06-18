import * as THREE from 'three';
import { golemState, useGolemStore, type GolemTask, type GolemMood } from '../state/golemStore';
import { nextTask, type TaskPlan } from './brain';
import { STATIONS, CANVAS_FOCUS, GOLEM } from './golemConfig';
import { CursorTracker } from './cursor';
import { paintNext, artworkProgress, artworkComplete } from './canvasArtwork';
import { damp, dampAngle, headingTo, pulse } from './animation';

/** Everything the component applies to the rig each frame. */
export interface GolemPose {
  position: THREE.Vector3;
  yaw: number;
  /** forward lean (rad). */
  lean: number;
  /** extra vertical bob. */
  bob: number;
  /** uniform squash/stretch (1 = rest). */
  squash: number;
  /** brush swing phase scalar (-1..1) for the painting hand. */
  brushSwing: number;
  /** sideways body wiggle (rad) — tickle/annoyance. */
  wiggle: number;
  /** scale multiplier (grows during the fourth-wall emerge). */
  scale: number;
}

type Phase = 'travel' | 'work';

/**
 * Drives the Copper Golem: a goal-based loop (travel → work) with procedural,
 * weighted animation, cursor awareness, and the scripted fourth-wall sequence.
 * Authoritative on position/yaw; the component reads `pose` and applies it.
 */
export class GolemController {
  readonly pose: GolemPose = {
    position: STATIONS.easel.clone(),
    yaw: 0, lean: 0, bob: 0, squash: 1, brushSwing: 0, wiggle: 0, scale: 1,
  };

  readonly cursor = new CursorTracker();

  private plan: TaskPlan = { task: 'idle', station: 'stool', duration: [4, 6] };
  private phase: Phase = 'work';
  private timer = 2;
  private target = STATIONS.easel.clone();
  private lookTarget = CANVAS_FOCUS.clone();
  private paintAccum = 0;
  private gestureT = 0;
  // cursor-attention bookkeeping
  private noticeCd = 0;       // cooldown before it can glance at cursor again
  private noticing = 0;       // time left actively watching the cursor
  private followCd = 8;       // min seconds before another follow event
  private rareCd = 14;        // rare personality events
  // fourth-wall
  private fwActive = false;
  private fwPos = new THREE.Vector3();
  private camPos = new THREE.Vector3();

  private set = useGolemStore.getState().set;
  private tmp = new THREE.Vector3();

  /** Called every frame by the component. */
  update(dt: number, camera: THREE.Camera, pointer: THREE.Vector2) {
    dt = Math.min(dt, 0.05);
    this.cursor.update(pointer, camera, dt);
    const s = golemState();

    // The scripted set-piece overrides the normal loop while active.
    if (s.fourthWall !== 'none') { this.updateFourthWall(dt, camera, s.fourthWall); return; }
    this.fwActive = false;
    this.pose.scale = damp(this.pose.scale, 1, 6, dt);

    this.updateCursorAttention(dt, s.distraction);
    this.updateLoop(dt);
    this.updateRareEvents(dt);
  }

  // ── goal loop ──────────────────────────────────────────────────────
  private updateLoop(dt: number) {
    this.timer -= dt;

    if (this.phase === 'travel') {
      const arrived = this.moveToward(this.target, dt);
      // face travel direction
      this.tmp.copy(this.target).sub(this.pose.position);
      if (this.tmp.lengthSq() > 0.01) this.faceYaw(headingTo(this.pose.position, this.target), dt, 9);
      this.pose.lean = damp(this.pose.lean, 0.05, 6, dt);
      this.pose.brushSwing = damp(this.pose.brushSwing, 0, 8, dt);
      if (arrived) { this.phase = 'work'; this.gestureT = 0; this.timer = this.pickDuration(); }
      return;
    }

    // WORK — perform the current task's gesture
    this.gestureT += dt;
    this.performTask(this.plan.task, dt);

    if (this.timer <= 0) this.chooseNext();
  }

  private chooseNext() {
    const prog = artworkProgress();
    this.plan = nextTask(this.plan.task, prog);
    this.target.copy(STATIONS[this.plan.station]);
    this.phase = 'travel';
    this.set({ task: this.plan.task, mood: this.moodFor(this.plan.task) });
  }

  private performTask(task: GolemTask, dt: number) {
    switch (task) {
      case 'paint': {
        this.faceLook(CANVAS_FOCUS, dt);
        this.pose.lean = damp(this.pose.lean, 0.22, 5, dt);
        // rhythmic, deliberate strokes (not endless): swing + periodic commit
        this.pose.brushSwing = Math.sin(this.gestureT * 5) * 0.8;
        this.pose.bob = Math.sin(this.gestureT * 5) * 0.03;
        this.paintAccum += dt;
        if (this.paintAccum > 1.4 && !artworkComplete()) {
          this.paintAccum = 0;
          const p = paintNext(1);
          this.set({ artProgress: p });
        }
        break;
      }
      case 'inspect':
      case 'review': {
        this.faceLook(CANVAS_FOCUS, dt);
        // lean in to examine, then squint/tilt
        this.pose.lean = damp(this.pose.lean, 0.18 + Math.sin(this.gestureT * 1.2) * 0.06, 4, dt);
        this.pose.wiggle = damp(this.pose.wiggle, Math.sin(this.gestureT * 0.8) * 0.08, 4, dt); // head tilt
        this.pose.brushSwing = damp(this.pose.brushSwing, 0, 6, dt);
        break;
      }
      case 'measure': {
        // walk left↔right comparing sections
        const t = (Math.sin(this.gestureT * 0.9) + 1) / 2;
        this.tmp.copy(STATIONS.canvasLeft).lerp(STATIONS.canvasRight, t);
        this.moveToward(this.tmp, dt, 0.05);
        this.faceLook(CANVAS_FOCUS, dt);
        this.pose.lean = damp(this.pose.lean, 0.1, 4, dt);
        break;
      }
      case 'mix':
      case 'fetch': {
        this.faceLook(STATIONS.bench, dt);
        this.pose.lean = damp(this.pose.lean, 0.12, 4, dt);
        this.pose.brushSwing = Math.sin(this.gestureT * 3) * 0.4; // stirring
        this.pose.bob = Math.sin(this.gestureT * 3) * 0.02;
        break;
      }
      case 'plan': {
        this.faceLook(CANVAS_FOCUS, dt);
        this.pose.lean = damp(this.pose.lean, 0.04, 4, dt);
        this.pose.wiggle = damp(this.pose.wiggle, Math.sin(this.gestureT * 0.6) * 0.12, 3, dt); // pondering tilt
        break;
      }
      case 'celebrate': {
        this.faceLook(CANVAS_FOCUS, dt);
        const hop = Math.abs(Math.sin(this.gestureT * 6));
        this.pose.bob = hop * 0.18;
        this.pose.squash = 1 + Math.sin(this.gestureT * 6) * 0.06;
        this.pose.yaw += dt * 1.5; // little spin of joy
        break;
      }
      case 'idle':
      default: {
        // enjoy the scenery — gentle breathe, occasional look around
        this.pose.bob = damp(this.pose.bob, Math.sin(this.gestureT * 1.4) * 0.02, 3, dt);
        this.pose.lean = damp(this.pose.lean, 0, 4, dt);
        this.pose.brushSwing = Math.sin(this.gestureT * 0.5) * 0.15; // idle brush spin
        const sway = Math.sin(this.gestureT * 0.3);
        this.faceYaw(this.baseYaw() + sway * 0.5, dt, 2);
        break;
      }
    }
    this.pose.wiggle = damp(this.pose.wiggle, this.pose.wiggle, 6, dt);
  }

  // ── cursor awareness: notice / distract / tickle / follow ──────────
  private updateCursorAttention(dt: number, distraction: number) {
    const dist = this.cursor.distanceTo(this.pose.position);
    const near = dist < 2.2;
    const active = this.cursor.activity > 0.25;

    this.noticeCd -= dt;
    this.followCd -= dt;

    // build / decay distraction pressure from fidgeting nearby
    let d = distraction;
    if (near && active) d = Math.min(1, d + dt * 0.7);
    else d = Math.max(0, d - dt * 0.35);
    this.set({ distraction: d });

    // rare "the cursor is helping" follow event (~5% when conditions ripe)
    if (!golemState().following && this.followCd <= 0 && near && active && Math.random() < 0.05 * dt * 60) {
      this.startFollow();
    }
    if (golemState().following) { this.followCursor(dt); return; }

    // glance at the cursor briefly, then back to work
    if (this.noticing > 0) {
      this.noticing -= dt;
      this.faceLook(this.cursor.world, dt, 6);
      this.pose.lean = damp(this.pose.lean, 0.02, 5, dt);
    } else if (near && this.noticeCd <= 0) {
      this.noticing = 0.8 + Math.random() * 0.8;
      this.noticeCd = 3 + Math.random() * 4;
      this.set({ mood: 'curious' });
    }

    // distraction reactions: annoyance + protective tilt; tickle = wiggle/jump
    if (d > 0.55) {
      this.set({ mood: d > 0.85 ? 'annoyed' : 'curious' });
      this.pose.wiggle += Math.sin(performance.now() * 0.02) * 0.05 * d; // brush/body wobble
      if (d > 0.85) {
        // tickle: playful wiggle + small jump
        this.set({ mood: 'playful' });
        this.pose.bob = Math.max(this.pose.bob, Math.abs(Math.sin(performance.now() * 0.012)) * 0.12);
        this.pose.squash = 1 + Math.sin(performance.now() * 0.024) * 0.05;
      }
    }
  }

  private startFollow() {
    this.set({ following: true, mood: 'playful' });
    this.followCd = 18 + Math.random() * 12;
    this.noticing = 0;
    window.setTimeout(() => this.set({ following: false, mood: 'neutral' }), 5000 + Math.random() * 5000);
  }

  private followCursor(dt: number) {
    // approach a point a little short of the cursor, mimic its motion, "paint" near it
    this.tmp.copy(this.cursor.world);
    const home = STATIONS.easel;
    // keep the golem within the workshop so it doesn't wander off the platform
    this.tmp.clampLength(0, 6).add(home).multiplyScalar(0.5);
    this.moveToward(this.cursor.world, dt, 0.4);
    this.faceLook(this.cursor.world, dt, 8);
    this.pose.brushSwing = Math.sin(performance.now() * 0.01) * 0.6;
    this.pose.bob = Math.abs(Math.sin(performance.now() * 0.008)) * 0.06;
  }

  private updateRareEvents(dt: number) {
    this.rareCd -= dt;
    if (this.rareCd > 0) return;
    this.rareCd = 16 + Math.random() * 20;
    // brief personality flourishes layered onto whatever it's doing
    const roll = Math.random();
    if (roll < 0.4) this.set({ mood: 'proud' });      // admire masterpiece
    else if (roll < 0.7) this.takeABow();
    else this.set({ mood: 'curious' });               // bird lands / watch colours
  }

  private takeABow() {
    this.set({ mood: 'proud' });
    const start = performance.now();
    const tick = () => {
      const t = (performance.now() - start) / 900;
      if (t >= 1) { this.set({ mood: 'neutral' }); return; }
      this.pose.lean = 0.05 + pulse(t) * 0.5;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ── fourth-wall set-piece ──────────────────────────────────────────
  private updateFourthWall(dt: number, camera: THREE.Camera, phase: string) {
    this.camPos.setFromMatrixPosition(camera.matrixWorld);
    // a point in front of the camera, low in frame (the "edge of the world")
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    this.fwPos.copy(this.camPos).addScaledVector(fwd, 6).setY(0.2);

    switch (phase) {
      case 'freeze': {
        // did anyone notice? look left, then right
        const t = (performance.now() % 2400) / 2400;
        this.faceYaw(this.baseYaw() + Math.sin(t * Math.PI * 2) * 0.9, dt, 5);
        this.pose.lean = damp(this.pose.lean, 0, 5, dt);
        break;
      }
      case 'approach': {
        this.moveToward(this.fwPos, dt);
        this.faceLook(this.camPos, dt, 6);
        break;
      }
      case 'reach': {
        this.moveToward(this.fwPos, dt, 0.2);
        this.faceLook(this.camPos, dt, 8);
        this.pose.lean = damp(this.pose.lean, 0.5, 4, dt);   // lean toward the viewer
        this.pose.scale = damp(this.pose.scale, 1.6, 4, dt); // loom larger in frame
        break;
      }
      case 'emerge': {
        // a partial jump toward the viewer — not all the way out
        this.pose.position.lerp(this.fwPos.clone().addScaledVector(fwd, 1.6), 1 - Math.exp(-8 * dt));
        this.faceLook(this.camPos, dt, 10);
        this.pose.scale = damp(this.pose.scale, 2.0, 5, dt);
        this.pose.bob = Math.abs(Math.sin(performance.now() * 0.012)) * 0.2;
        break;
      }
      case 'clean': {
        this.faceLook(this.camPos, dt, 8);
        this.pose.scale = damp(this.pose.scale, 1.9, 4, dt);
        // big deliberate wiping strokes
        this.pose.brushSwing = Math.sin(performance.now() * 0.012) * 1.0;
        this.pose.lean = 0.25 + Math.sin(performance.now() * 0.012) * 0.1;
        break;
      }
      case 'return': {
        this.pose.scale = damp(this.pose.scale, 1, 5, dt);
        const arrived = this.moveToward(STATIONS.easel, dt);
        this.faceLook(CANVAS_FOCUS, dt, 5);
        this.pose.lean = damp(this.pose.lean, 0.05, 4, dt);
        if (arrived) { this.set({ fourthWall: 'none', mood: 'proud', task: 'review' }); this.phase = 'work'; this.plan = nextTask('paint', artworkProgress()); this.timer = 2; }
        break;
      }
    }
  }

  // ── motion helpers ─────────────────────────────────────────────────
  /** Move toward target on the ground; returns true when essentially there. */
  private moveToward(target: THREE.Vector3, dt: number, hopScale = 1): boolean {
    const p = this.pose.position;
    this.tmp.set(target.x - p.x, 0, target.z - p.z);
    const d = this.tmp.length();
    if (d < 0.06) { this.pose.bob = damp(this.pose.bob, 0, 6, dt); return true; }
    const step = Math.min(d, GOLEM.walkSpeed * dt);
    this.tmp.normalize().multiplyScalar(step);
    p.x += this.tmp.x; p.z += this.tmp.z;
    // hop-walk: bob + squash synced to cadence
    const hop = Math.abs(Math.sin(performance.now() * 0.001 * GOLEM.hopRate * Math.PI));
    this.pose.bob = hop * GOLEM.hopHeight * hopScale;
    this.pose.squash = 1 + (0.5 - hop) * 0.05;
    this.pose.brushSwing = damp(this.pose.brushSwing, 0, 8, dt);
    return false;
  }

  private faceYaw(target: number, dt: number, lambda = 6) {
    this.pose.yaw = dampAngle(this.pose.yaw, target, lambda, dt);
  }
  private faceLook(point: THREE.Vector3, dt: number, lambda = 5) {
    this.faceYaw(headingTo(this.pose.position, point), dt, lambda);
  }
  /** Default facing: toward the canvas. */
  private baseYaw(): number {
    return headingTo(this.pose.position, CANVAS_FOCUS);
  }

  private pickDuration(): number {
    const [a, b] = this.plan.duration;
    return a + Math.random() * (b - a);
  }
  private moodFor(task: GolemTask): GolemMood {
    if (task === 'celebrate') return 'proud';
    if (task === 'idle') return 'neutral';
    if (task === 'paint') return 'neutral';
    return 'curious';
  }
}
