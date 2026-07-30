import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * The Inquiry — one long work, published complete, read in order.
 *
 * The work's own framing lives here rather than in a content file because
 * there is exactly one of them. If a second work ever appears, this becomes a
 * `works` collection and every function below takes a work id; nothing else
 * about the shape needs to change.
 */
export const INQUIRY = {
  title: 'An Inquiry into the Dispositional Basis of Demand',
  short: 'Inquiry',
  /** Shown on the spine, above the contents. One paragraph, no more. */
  abstract:
    'Demand is treated in economics as a quantity — something read off a schedule, revealed by what was bought. This inquiry argues that it is a disposition: a causal power that exists whether or not it is exercised, that composes with other powers rather than summing with them, and that a curve fitted to transactions records only where it has already been manifested.',
} as const;

export type Part = CollectionEntry<'inquiry'>;

/**
 * Every part, in argument order. Order comes from the `part` number and never
 * from the filename or the filesystem — a file rename must not be able to
 * reorder an argument.
 */
export async function getParts(): Promise<Part[]> {
  const parts = await getCollection('inquiry', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
  parts.sort((a, b) => a.data.part - b.data.part);

  // The part numbers ARE the citable identifiers, so a gap or a duplicate is
  // a defect rather than an inconvenience — §7 must mean one thing forever.
  // Checked here because it is a fact about the collection, which no
  // per-entry schema can see.
  const seen = new Map<number, string>();
  for (const p of parts) {
    const existing = seen.get(p.data.part);
    if (existing) {
      throw new Error(
        `Inquiry: part ${p.data.part} is claimed by both "${existing}" and "${p.id}". ` +
          `Part numbers are permanent identifiers; two parts cannot share one.`,
      );
    }
    seen.set(p.data.part, p.id);
  }
  parts.forEach((p, i) => {
    if (p.data.part !== i + 1) {
      throw new Error(
        `Inquiry: parts must run 1..n with no gaps. Expected ${i + 1} but "${p.id}" is part ${p.data.part}. ` +
          `A gap means a reader hits a dead end and a citation points at nothing.`,
      );
    }
  });

  return parts;
}

export const partHref = (part: number) => `/inquiry/${part}/`;
export const inquiryHref = () => '/inquiry/';
