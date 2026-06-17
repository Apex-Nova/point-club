import { useMemo, useEffect } from 'react';
import { PaintingSystem } from '../systems/PaintingSystem';

/**
 * usePainting — creates a single PaintingSystem (CanvasTexture + virtual pen)
 * for the lifetime of the scene and disposes it on unmount. The returned
 * system is advanced by the scene's frame loop via `system.update(dt)`.
 */
export function usePainting(size = 1024) {
  const system = useMemo(() => new PaintingSystem(size), [size]);
  useEffect(() => () => system.dispose(), [system]);
  return system;
}
