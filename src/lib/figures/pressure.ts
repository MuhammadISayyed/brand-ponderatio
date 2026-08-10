/**
 * The data behind the "what the pressures take" figure.
 *
 * IN ITS OWN MODULE BECAUSE IT IS NEEDED TWICE: the component's frontmatter
 * draws the served state at build time, and the browser redraws as the reader
 * moves the slider. Kept as two copies inside the component, the prose drifted
 * within a day — the copy was revised in one and not the other, which would
 * have shipped a figure whose caption changed the moment it was touched.
 *
 * The words here are the author's, and this is the only place they live.
 */

export interface Stop {
  /** The heading in the readout. */
  name: string;
  /** What this pressure does, in the author's words. */
  line: string;
}

export const STOPS: Stop[] = [
  {
    name: 'Marketing as it is',
    line: 'Marketing is complex. The marketer has to understand the context as is and act accordingly.',
  },
  {
    name: 'Pressure from the top',
    line: 'Only what is simple and measurable counts. Marketers aren’t compensated for anything else.',
  },
  {
    name: 'Pressure from within',
    line: 'What survives from previous pressure gets renamed and repackaged, sometimes claiming that it’s not even marketing.',
  },
  {
    name: 'Dogmatic pressure',
    line: 'Universal laws answer the questions in advance. Nothing is left to figure out. Marketing stales and is finally boring.',
  },
];

/**
 * `dies` is the step at which a thing stops counting; 0 means it survives to
 * the end. Hand-placed rather than generated — a lattice on a perfect grid
 * reads as a diagram of a grid, and this is a diagram of a field of work.
 */
export const NODES: Array<{ x: number; y: number; dies: number }> = [
  { x: 40, y: 32, dies: 0 }, { x: 122, y: 40, dies: 0 },
  { x: 198, y: 30, dies: 1 }, { x: 284, y: 38, dies: 0 },
  { x: 358, y: 30, dies: 2 }, { x: 442, y: 40, dies: 1 },
  { x: 34, y: 88, dies: 0 }, { x: 116, y: 96, dies: 3 },
  { x: 204, y: 84, dies: 0 }, { x: 276, y: 92, dies: 1 },
  { x: 364, y: 86, dies: 0 }, { x: 446, y: 94, dies: 0 },
  { x: 44, y: 146, dies: 1 }, { x: 126, y: 140, dies: 2 },
  { x: 196, y: 150, dies: 0 }, { x: 288, y: 144, dies: 0 },
  { x: 356, y: 146, dies: 1 }, { x: 438, y: 140, dies: 1 },
];

/** [from, to, dies] */
export const EDGES: Array<[number, number, number]> = [
  [0, 1, 2], [1, 2, 1], [2, 3, 1], [3, 4, 1], [4, 5, 1],
  [6, 7, 3], [7, 8, 2], [8, 9, 1], [9, 10, 1], [10, 11, 1],
  [12, 13, 1], [13, 14, 1], [14, 15, 2], [15, 16, 1], [16, 17, 1],
  [0, 6, 3], [1, 7, 2], [2, 8, 1], [3, 9, 1], [4, 10, 1], [5, 11, 1],
  [6, 12, 1], [7, 13, 2], [8, 14, 3], [9, 15, 1], [10, 16, 1], [11, 17, 1],
  [0, 7, 2], [2, 9, 1], [4, 11, 1], [8, 13, 3], [10, 15, 2],
];

export const nodeAlive = (i: number, stop: number): boolean =>
  NODES[i].dies === 0 || stop < NODES[i].dies;

export const edgeAlive = (
  e: [number, number, number],
  stop: number,
): boolean => stop < e[2] && nodeAlive(e[0], stop) && nodeAlive(e[1], stop);
