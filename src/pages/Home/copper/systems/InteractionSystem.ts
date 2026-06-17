import { CLICK_TIMELINE } from './GolemStateMachine';

/**
 * InteractionSystem — reads the click clock and produces the per-beat pose
 * targets for the scripted celebration: notice → step back → jump → wave →
 * spin → celebrate → return. Pure functions of elapsed time so the animation
 * hook stays declarative and every transition is smoothly interpolated.
 */

export interface InteractionPose {
  /** extra height added to the golem (jump arc) */
  jumpY: number;
  /** squash & stretch scale (1 = neutral) */
  squashY: number;
  squashXZ: number;
  /** body yaw spin in radians */
  spin: number;
  /** how strongly the golem faces the camera (0 canvas .. 1 user) */
  faceUser: number;
  /** brush wave amount */
  wave: number;
  /** backward step offset along +Z (toward viewer) */
  stepBack: number;
  /** true on the single frame the golem lands (impact dust / sound) */
  landed: boolean;
  /** true on the frame celebration starts (colour burst) */
  burst: boolean;
}

const T = CLICK_TIMELINE;

function ramp(t: number, a: number, b: number) {
  return Math.max(0, Math.min(1, (t - a) / (b - a)));
}
function pulse(t: number, a: number, b: number) {
  const m = (a + b) / 2;
  return t < m ? ramp(t, a, m) : 1 - ramp(t, m, b);
}

export function interactionPose(t: number, prevT: number): InteractionPose {
  // jump arc between jump and wave beats
  const jumpP = pulse(t, T.jump, T.wave);
  const jumpY = Math.sin(jumpP * Math.PI) * 0.9;

  // squash before takeoff and on landing, stretch mid-air
  let squashY = 1, squashXZ = 1;
  if (t > T.jump - 0.12 && t < T.jump + 0.05) { squashY = 0.78; squashXZ = 1.16; }
  else if (jumpY > 0.2) { squashY = 1.12; squashXZ = 0.93; }

  const landT = T.wave; // apex→land around wave beat
  const landed = prevT < landT && t >= landT;
  if (landed) { squashY = 0.82; squashXZ = 1.14; }

  const spin = ramp(t, T.spin, T.celebrate) * Math.PI * 2;
  const faceUser = ramp(t, T.notice, T.stepBack) * (1 - ramp(t, T.celebrate, T.done));
  const wave = pulse(t, T.wave, T.spin) * 1.6 + (t > T.celebrate ? Math.sin(t * 18) * 0.4 : 0);
  const stepBack = pulse(t, T.stepBack, T.jump) * 0.5 + ramp(t, T.jump, T.done) * 0.2;
  const burst = prevT < T.celebrate && t >= T.celebrate;

  return { jumpY, squashY, squashXZ, spin, faceUser, wave, stepBack, landed, burst };
}
