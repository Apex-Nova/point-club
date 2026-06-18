import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useWorldStore } from '../state/worldStore';

gsap.registerPlugin(ScrollTrigger);

/**
 * Drives the master timeline from page scroll. Tracks the whole document
 * (start 0 → end max) so progress 0→1 maps across the entire scroll range and
 * feeds worldStore.scrollProgress. The world reads this to evolve atmosphere,
 * powder density and camera. Fully reversible — no page transitions.
 *
 *   0%  minimal atmosphere
 *  25%  more floating particles
 *  50%  growing colour clouds
 *  75%  rich environment activity
 * 100%  fully evolved scene
 */
export function useScrollTimeline() {
  const set = useWorldStore.getState().set;

  useLayoutEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: self => set({ scrollProgress: self.progress }),
    });

    // Layout settles after fonts / canvas mount — recompute the scroll range.
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      window.clearTimeout(id);
      st.kill();
    };
  }, [set]);
}
