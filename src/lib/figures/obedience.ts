/**
 * The steps behind the "concessions" figure.
 *
 * One module for the same reason as pressure.ts: the frontmatter draws the
 * served state and the browser draws every state after it, and two copies of
 * the same sentences drift apart the first time one of them is edited.
 *
 * `said` is phrased as the concession sounds from inside — first person, and
 * reasonable — because that is the only way it ever gets agreed to. The last
 * one is not in the first person, which is the whole point of the figure.
 */

export interface Step {
  name: string;
  said: string;
  company: { x: number; y: number; w: number; h: number };
  mark: { x: number; y: number; w: number; h: number };
  /** True once the boundary has been redrawn without the role. */
  outside: boolean;
}

export const STEPS: Step[] = [
  {
    name: 'The remit',
    said: 'We are responsible for the market: how it forms, what it wants, and what we come to mean to it.',
    company: { x: 24, y: 24, w: 372, h: 140 },
    mark: { x: 56, y: 52, w: 300, h: 84 },
    outside: false,
  },
  {
    name: 'First concession',
    said: 'We will claim only what boardrooms can understand easily.',
    company: { x: 24, y: 24, w: 372, h: 140 },
    mark: { x: 56, y: 52, w: 212, h: 84 },
    outside: false,
  },
  {
    name: 'Second concession',
    said: 'We will claim only what we can attribute. Narrower and genuinely measurable.',
    company: { x: 24, y: 24, w: 372, h: 140 },
    mark: { x: 56, y: 52, w: 132, h: 84 },
    outside: false,
  },
  {
    name: 'The boundary is redrawn',
    said: 'What is left is a set of tasks the company can buy anywhere.',
    company: { x: 24, y: 24, w: 300, h: 140 },
    mark: { x: 404, y: 72, w: 84, h: 44 },
    outside: true,
  },
];
