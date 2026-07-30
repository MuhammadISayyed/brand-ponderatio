/**
 * Per-page sidenote numbering.
 *
 * CSS counters can number sidenotes on screen but cannot produce an `id`, and
 * without ids there is nothing to link to. So the number is computed here, at
 * build time, and used for both the visible numeral and the anchor pair.
 *
 * The counter is keyed on the Request object rather than on a module-level
 * integer. One page render is one Request, shared by every component in it, so
 * numbering restarts at 1 for each page automatically. A module-level counter
 * would run on across pages in a build — and worse, would keep climbing across
 * re-renders in dev, so the same note would be 1 on first load and 7 on the
 * next.
 *
 * A WeakMap because the Request is dead once the page is rendered and there is
 * no reason to hold it.
 */
const counters = new WeakMap<Request, number>();

export function nextSidenoteNumber(request: Request): number {
  const n = (counters.get(request) ?? 0) + 1;
  counters.set(request, n);
  return n;
}
