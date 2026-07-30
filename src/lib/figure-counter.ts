/**
 * Per-page figure numbering.
 *
 * Same mechanism and same reasoning as the sidenote counter: keyed on the
 * Request object, because one page render is one Request shared by every
 * component in it, so numbering restarts at 1 for each page. A module-level
 * integer would run on across pages in a build and climb on every re-render
 * in dev.
 */
const counters = new WeakMap<Request, number>();

export function nextFigureNumber(request: Request): number {
  const n = (counters.get(request) ?? 0) + 1;
  counters.set(request, n);
  return n;
}
