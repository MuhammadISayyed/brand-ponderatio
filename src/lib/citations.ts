/**
 * Citation registry.
 *
 * Every <Cite> rendered during a page render records itself here, so that by
 * the time the sources block renders — which happens after the prose slot,
 * because that is the order the layout puts them in — the layout knows which
 * sources were actually used and how many times.
 *
 * Keyed on the Request for the same reason the sidenote counter is: one page
 * render is one Request, so the registry starts empty for each page and is
 * never polluted by the page rendered before it.
 */

interface Registry {
  /** key -> number of times cited on this page. */
  counts: Map<string, number>;
}

const registries = new WeakMap<Request, Registry>();

function registryFor(request: Request): Registry {
  let registry = registries.get(request);
  if (!registry) {
    registry = { counts: new Map() };
    registries.set(request, registry);
  }
  return registry;
}

/**
 * Records one citation of `key` and returns its occurrence number — 1 for the
 * first use on the page, 2 for the second. The number is what makes each
 * citation's anchor unique, so the source entry can link back to every place
 * it was used rather than only the first.
 */
export function registerCitation(request: Request, key: string): number {
  const { counts } = registryFor(request);
  const n = (counts.get(key) ?? 0) + 1;
  counts.set(key, n);
  return n;
}

export function citationCounts(request: Request): Map<string, number> {
  return registries.get(request)?.counts ?? new Map();
}

export const citeId = (key: string, n: number) => `cite-${key}-${n}`;
export const sourceId = (key: string) => `src-${key}`;

/**
 * Counts citations by reading the post's raw MDX rather than by asking the
 * registry.
 *
 * The registry cannot answer this. Astro evaluates a template's expressions
 * before the slot content streams, so a layout that asks "which sources were
 * cited?" anywhere in its own template gets an empty registry every time —
 * the audit would pass on a post that cites nothing at all. That is the worst
 * kind of check: one that always succeeds.
 *
 * Scanning the source is order-independent and runs before anything renders.
 * The registry still numbers each <Cite> for its id; the two agree because
 * render order is document order.
 *
 * Fenced code and MDX comments are stripped first, so an example of the
 * syntax written up in a post does not count as a real citation.
 */
export function scanCitations(body: string): Map<string, number> {
  const scannable = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  const counts = new Map<string, number>();
  for (const match of scannable.matchAll(
    /<Cite\s[^>]*?source=["']([^"']+)["']/g,
  )) {
    const key = match[1];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
