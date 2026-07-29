/**
 * Single GSAP entry point. Every diagram imports from here, never from `gsap`
 * directly, so plugin registration happens exactly once and no diagram can
 * forget it.
 *
 * This module is CLIENT-ONLY. DrawSVGPlugin and MorphSVGPlugin touch the DOM
 * at import time, so it must only ever be pulled in from a `<script>` tag in
 * an .astro component — never from a component's frontmatter, which runs
 * during the static build.
 *
 * Note on licensing: as of GSAP 3.13 every plugin ships in the public `gsap`
 * package, including the formerly Club-only ones used here. There is no
 * .npmrc, no auth token, and no npm.greensock.com registry in this project,
 * and none should be added.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, MorphSVGPlugin);

/**
 * True when the reader has asked for reduced motion.
 *
 * Every timeline in this project is wrapped in a check against this. The
 * contract is NOT "skip the animation" — it is "render the finished end
 * state immediately." A diagram whose build animation is suppressed must
 * still show the fully built diagram.
 */
export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap, ScrollTrigger, DrawSVGPlugin, MorphSVGPlugin };
