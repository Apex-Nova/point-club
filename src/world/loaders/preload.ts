import { useGLTF, useTexture } from '@react-three/drei';
import { ALL_FOLIAGE_MODELS, ALL_PROP_MODELS, EFFECTS } from '../config/assets';

/**
 * Kick off caching of every GLTF/texture the world needs so the scene pops in
 * fully formed rather than piece-by-piece. drei caches by URL, so components
 * that later call useGLTF/useTexture get instant cache hits.
 */
export function preloadWorldAssets() {
  [...ALL_FOLIAGE_MODELS, ...ALL_PROP_MODELS].forEach(url => useGLTF.preload(url));
  [...EFFECTS.powderPuffs, EFFECTS.powderSoft].forEach(url => useTexture.preload(url));
}
