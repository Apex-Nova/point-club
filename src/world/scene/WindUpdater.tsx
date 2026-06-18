import { useFrame } from '@react-three/fiber';
import { windUniforms } from '../shaders/wind';
import { worldState } from '../state/worldStore';

/**
 * Single per-frame driver for the shared wind uniforms. One component updates
 * the whole forest (every patched material references these uniform objects).
 */
export default function WindUpdater() {
  useFrame((_s, delta) => {
    windUniforms.uTime.value += Math.min(delta, 0.05);
    windUniforms.uWind.value = worldState().windStrength;
  });
  return null;
}
