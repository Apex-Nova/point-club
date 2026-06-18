import { useGolemStore, type FourthWallPhase } from '../state/golemStore';
import { WORLD } from '../config/worldConfig';

/**
 * Orchestrates the signature set-piece: the golem accidentally stains the
 * viewer's screen, freezes ("did anyone notice?"), approaches the edge of its
 * world, reaches out, partially emerges, wipes the stain off the screen, then
 * returns to work. Phases are timed here; GolemController drives the motion and
 * ScreenStain renders the stain on the camera layer.
 */

let running = false;

const PHASES: { phase: FourthWallPhase; ms: number }[] = [
  { phase: 'freeze', ms: 2400 },
  { phase: 'approach', ms: 2600 },
  { phase: 'reach', ms: 1600 },
  { phase: 'emerge', ms: 1400 },
  { phase: 'clean', ms: 3200 },
  { phase: 'return', ms: 6000 }, // controller ends this early on arrival
];

export function triggerScreenStain(clientX: number, clientY: number) {
  if (running) return;
  const s = useGolemStore.getState();
  if (s.fourthWall !== 'none') return;
  running = true;

  const color = WORLD.holiColors[Math.floor(Math.random() * WORLD.holiColors.length)];
  s.set({
    stain: { x: clientX, y: clientY, color, id: Date.now() },
    mood: 'startled',
  });

  let i = 0;
  const step = () => {
    if (i >= PHASES.length) { finish(); return; }
    const { phase, ms } = PHASES[i++];
    useGolemStore.getState().set({ fourthWall: phase });
    // if the controller already ended the sequence (return → none), stop.
    window.setTimeout(() => {
      if (useGolemStore.getState().fourthWall === 'none') { finish(); return; }
      step();
    }, ms);
  };
  step();
}

function finish() {
  running = false;
  const s = useGolemStore.getState();
  s.set({ fourthWall: 'none', stain: null });
}
