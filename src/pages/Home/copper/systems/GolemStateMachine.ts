/**
 * GolemStateMachine — a small deterministic FSM that decides what the
 * Copper Golem is "doing". It never touches three.js; it only emits the
 * current state + a normalised phase so the animation hook can blend poses.
 *
 * Painting is the resting/working state. The golem periodically drifts into
 * lookingAround / admiring, walks when its paint target is far, and a click
 * forces the scripted interaction → celebration sequence.
 */

export type GolemState =
  | 'idle'
  | 'walking'
  | 'painting'
  | 'lookingAround'
  | 'excited'
  | 'interaction'
  | 'celebration';

export interface GolemContext {
  /** horizontal distance (world units) from golem to its paint target */
  distanceToTarget: number;
  /** seconds since last user click, or Infinity */
  sinceClick: number;
}

/** The scripted click sequence, expressed as ordered beats (seconds). */
export const CLICK_TIMELINE = {
  notice: 0.0,   // looks at user
  stepBack: 0.35,
  jump: 0.7,
  wave: 1.2,
  spin: 1.6,
  celebrate: 2.1,
  done: 3.0,
} as const;

export class GolemStateMachine {
  state: GolemState = 'painting';
  /** seconds spent in the current state */
  timeInState = 0;
  /** 0..1 progress through a timed state (interaction/celebration) */
  phase = 0;

  private nextIdleCheck = 4 + Math.random() * 4;
  private clickActive = false;
  private clickClock = 0;

  /** External trigger — call once per user click. */
  triggerClick() {
    this.clickActive = true;
    this.clickClock = 0;
    this.transitionTo('interaction');
  }

  private transitionTo(next: GolemState) {
    if (next === this.state) return;
    this.state = next;
    this.timeInState = 0;
  }

  update(dt: number, ctx: GolemContext): GolemState {
    this.timeInState += dt;

    // ── Scripted click sequence takes priority ──────────────────
    if (this.clickActive) {
      this.clickClock += dt;
      const t = this.clickClock;
      this.phase = Math.min(1, t / CLICK_TIMELINE.done);
      if (t >= CLICK_TIMELINE.celebrate && this.state !== 'celebration') {
        this.transitionTo('celebration');
      }
      if (t >= CLICK_TIMELINE.done) {
        this.clickActive = false;
        this.phase = 0;
        this.transitionTo('painting');
      }
      return this.state;
    }

    // ── Ambient behaviour ───────────────────────────────────────
    // Walk when the target is meaningfully far away.
    if (ctx.distanceToTarget > 0.9) {
      this.transitionTo('walking');
      this.nextIdleCheck = this.timeInState + 3 + Math.random() * 4;
      return this.state;
    }

    // Close enough → paint, but occasionally pause to admire / look around.
    if (this.state === 'walking') {
      this.transitionTo('painting');
    }

    if (this.timeInState > this.nextIdleCheck) {
      this.nextIdleCheck = this.timeInState + 4 + Math.random() * 5;
      // alternate between admiring (lookingAround) and a tiny excited beat
      this.transitionTo(Math.random() < 0.7 ? 'lookingAround' : 'excited');
    }

    // Time-box the idle flourishes, then return to painting.
    if (this.state === 'lookingAround' && this.timeInState > 2.4) this.transitionTo('painting');
    if (this.state === 'excited' && this.timeInState > 1.1) this.transitionTo('painting');
    if (this.state === 'idle' && this.timeInState > 1.5) this.transitionTo('painting');

    return this.state;
  }
}
