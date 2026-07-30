import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * A GROUNDING is one thing that thinking is grounded in — a long work,
 * published complete, read in order, divided into parts.
 *
 * The site can hold several. Each lives in its own folder under
 * src/content/groundings/, and the folder name is the slug: the grounding a
 * part belongs to is derived from where the file sits rather than declared in
 * its frontmatter, so the two can never disagree.
 */
export interface Grounding {
  title: string;
  /** Used in the running head and page titles, where the full title is long. */
  short: string;
  /** Shown on the spine, above the contents. One paragraph, no more. */
  abstract: string;
}

export const GROUNDINGS: Record<string, Grounding> = {
  demand: {
    title: 'The Dispositional Basis of Demand',
    short: 'Demand',
    abstract:
      'Demand is treated in economics as a quantity — something read off a schedule, revealed by what was bought. This grounding argues that it is a disposition: a causal power that exists whether or not it is exercised, that composes with other powers rather than summing with them, and that a curve fitted to transactions records only where it has already been manifested.',
  },
};

export type Part = CollectionEntry<'groundings'>;

/**
 * Parts are numbered in ROMAN NUMERALS on the page — Part IV, not Part 4.
 * The arabic number stays the ordering key in frontmatter and in every sort,
 * because that is what a computer should be comparing; the roman is a
 * rendering of it, and the URL is neither — see partSlug.
 */
const ROMAN: ReadonlyArray<[number, string]> = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function roman(n: number): string {
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`roman(): expected a positive integer, got ${n}`);
  }
  let rest = n;
  let out = '';
  for (const [value, numeral] of ROMAN) {
    while (rest >= value) {
      out += numeral;
      rest -= value;
    }
  }
  return out;
}

/** The grounding a part belongs to, taken from its folder. */
export const groundingOf = (part: Part): string => part.id.split('/')[0];

export const groundingSlugs = (): string[] => Object.keys(GROUNDINGS);

/**
 * Every part of one grounding, in argument order. Order comes from the `part`
 * number, never from the filename — a file rename must not be able to
 * reorder an argument.
 */
export async function getParts(grounding: string): Promise<Part[]> {
  const all = await getCollection('groundings', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );

  for (const part of all) {
    const slug = groundingOf(part);
    if (!GROUNDINGS[slug]) {
      throw new Error(
        `"${part.id}" sits in a folder named "${slug}", which is not a grounding. ` +
          `Known groundings: ${groundingSlugs().join(', ') || '(none)'}. ` +
          `Add it to GROUNDINGS in lib/groundings.ts, or move the file.`,
      );
    }
  }

  const parts = all
    .filter((p) => groundingOf(p) === grounding)
    .sort((a, b) => a.data.part - b.data.part);

  // The part numbers ARE the citable identifiers, so a gap or a duplicate is
  // a defect rather than an inconvenience — Part VII must mean one thing
  // forever. Checked here because it is a fact about the collection, which no
  // per-entry schema can see.
  const seen = new Map<number, string>();
  for (const p of parts) {
    const existing = seen.get(p.data.part);
    if (existing) {
      throw new Error(
        `${grounding}: part ${p.data.part} is claimed by both "${existing}" and "${p.id}". ` +
          `Part numbers are permanent identifiers; two parts cannot share one.`,
      );
    }
    seen.set(p.data.part, p.id);
  }
  parts.forEach((p, i) => {
    if (p.data.part !== i + 1) {
      throw new Error(
        `${grounding}: parts must run 1..n with no gaps. Expected ${i + 1} but "${p.id}" is part ${p.data.part}. ` +
          `A gap means a reader hits a dead end and a citation points at nothing.`,
      );
    }
  });

  return parts;
}

/**
 * A part's URL segment: its `slug` if it has one, otherwise the filename with
 * any ordering prefix stripped ("01-powers-compose" -> "powers-compose").
 *
 * URLS ARE SLUGS, NOT NUMBERS, and this reverses what this file said an hour
 * ago. The argument for numbers was that the number is the identifier. The
 * argument against is stronger: numbers MOVE. Insert a new Part II into a
 * finished argument and every part after it renumbers, so every numeric URL
 * that was ever shared now points at the wrong part — silently, since the
 * page still exists. A slug survives insertion, and the roman numeral goes on
 * doing what it was always for, which is telling the reader where they are.
 */
export const partSlug = (part: Part): string =>
  part.data.slug ?? part.id.split('/').pop()!.replace(/^\d+[-_]/, '');

export const groundingHref = (grounding: string) => `/groundings/${grounding}/`;
export const partHref = (grounding: string, part: Part) =>
  `/groundings/${grounding}/${partSlug(part)}/`;
