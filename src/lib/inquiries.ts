import { getCollection, type CollectionEntry } from 'astro:content';

/**
 * An INQUIRY is a single problem worked until it yields — a long work
 * published in sequence, chapter by chapter, over weeks or months.
 *
 * THE HIERARCHY, and the one thing to understand about it:
 *
 *   Inquiry   Brand                 a whole work            named, not numbered
 *     Part    Part Two: <title>     optional grouping       spelled out
 *       Chapter  Chapter 5: <title> the unit — one page     arabic
 *
 * A PART HAS NO ROUTE. It is a heading on the contents page and a segment in
 * a chapter's position line, and nothing else. Resisting the pull to give it
 * a page of its own is what keeps this three-level structure from costing
 * three levels of navigation: the reader still only ever lands on a contents
 * page or a chapter.
 *
 * ONLY THE TWO INNER LEVELS ARE NUMBERED, and the top one is deliberately
 * not. An inquiry is cited by its name; a chapter is cited by its position
 * inside one. Numbering the work as well gave it a second name that had to be
 * kept in step with the first for no reader's benefit. What remains is two
 * numeral styles for two levels — spelled-out for the grouping, arabic for
 * the unit — which is still enough to tell them apart at a glance.
 *
 * This replaces the GROUNDING register. A grounding shipped complete, which
 * is why it had no status and needed no front matter. An inquiry publishes
 * while still moving, which is why it has both.
 */

export type Inquiry = CollectionEntry<'inquiries'>;
export type Chapter = CollectionEntry<'chapters'>;

/* ---- numerals ---------------------------------------------------------- */

/*
 * THERE IS NO `roman()` HERE ANY MORE. It existed for one caller — the
 * inquiry numeral — and when inquiries stopped being numbered it became a
 * tested, documented, exported function that nothing called. Deleted rather
 * than kept "in case": an unused numeral formatter is an invitation to
 * number something.
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty',
  'Ninety',
];

/**
 * Part numerals. `spelledOut(2)` -> `Two`.
 *
 * Stops at 99 and throws beyond it rather than falling back to digits. An
 * inquiry with a hundred parts is a structural mistake, and silently
 * rendering "Part 100" in a design where the spelled-out form is what marks
 * the level would hide it.
 */
export function spelledOut(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 99) {
    throw new Error(
      `spelledOut(): expected an integer between 1 and 99, got ${n}. ` +
        `Parts are a grouping layer; a work needing more than a handful of them wants restructuring, not a bigger numeral.`,
    );
  }
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = ONES[n % 10];
  return ones ? `${tens}-${ones.toLowerCase()}` : tens;
}

/* ---- identity ---------------------------------------------------------- */

/**
 * Whether a piece is live to the reader. Drafts are visible in development
 * and withheld in production, which is the same rule the rest of the site
 * uses — stated once here because the contents page needs to ask the question
 * rather than simply never see the entry.
 */
export const isLive = (entry: { data: { draft: boolean } }): boolean =>
  import.meta.env.PROD ? !entry.data.draft : true;

/** An inquiry's URL segment: its `slug` if it has one, else its filename. */
export const inquirySlug = (inquiry: Inquiry): string =>
  inquiry.data.slug ?? inquiry.id;

/** The inquiry a chapter belongs to, taken from its folder. */
export const inquiryOf = (chapter: Chapter): string => chapter.id.split('/')[0];

/**
 * A chapter's URL segment: its `slug` if it has one, otherwise the filename
 * with any ordering prefix stripped ("05-powers-compose" -> "powers-compose").
 *
 * URLS ARE SLUGS, NOT NUMBERS. Numbers move: insert a chapter into a work in
 * progress and every chapter after it renumbers, so every numeric URL ever
 * shared now points at the wrong chapter — silently, since the page still
 * exists. A slug survives insertion, and the arabic numeral goes on doing what
 * it is for, which is telling the reader where they are.
 */
export const chapterSlug = (chapter: Chapter): string =>
  chapter.data.slug ?? chapter.id.split('/').pop()!.replace(/^\d+[-_]/, '');

export const inquiriesHref = () => '/inquiries/';
export const inquiryHref = (inquiry: string) => `/inquiries/${inquiry}/`;
export const chapterHref = (inquiry: string, chapter: Chapter) =>
  `/inquiries/${inquiry}/${chapterSlug(chapter)}/`;
export const inquiryFeedHref = (inquiry: string) =>
  `/inquiries/${inquiry}/rss.xml`;

/* ---- loading ----------------------------------------------------------- */

/**
 * Every inquiry ON DISK, drafts included, most recently opened first.
 *
 * Separate from `getInquiries` because the two answer different questions.
 * "What should a reader see?" is the live set. "What works exist?" is this
 * one, and it is what every structural check has to run against: a chapter
 * folder belonging to a drafted inquiry is not an orphan, it is a work that
 * has not been published yet, and a production build must not fail on it.
 */
async function allInquiries(): Promise<Inquiry[]> {
  return (await getCollection('inquiries')).sort(
    (a, b) =>
      b.data.started.getTime() - a.data.started.getTime() ||
      a.data.title.localeCompare(b.data.title),
  );
}

/**
 * Every inquiry a reader should see, most recently opened first.
 *
 * ORDERED BY `started`, NOT BY A HAND-KEPT SEQUENCE. There is no ordering
 * field to maintain and nothing to renumber when a work is added, because the
 * date a work was opened is a fact already recorded for other reasons. Newest
 * first matches every other listing on the site.
 *
 * Ties are broken by title so the order is stable: two works opened on the
 * same day must not swap places between builds.
 */
export async function getInquiries(): Promise<Inquiry[]> {
  return (await allInquiries()).filter(isLive);
}

/**
 * One inquiry by slug, DRAFTS INCLUDED — this is a structural lookup, not a
 * reader-facing one. Resolving only live works would make the part validation
 * below throw on a work that is simply unpublished.
 */
export async function getInquiry(slug: string): Promise<Inquiry> {
  const found = (await allInquiries()).find((i) => inquirySlug(i) === slug);
  if (!found) {
    throw new Error(`No inquiry with slug "${slug}".`);
  }
  return found;
}

/** Live slugs — what gets routed and listed. */
export const inquirySlugs = async (): Promise<string[]> =>
  (await getInquiries()).map(inquirySlug);

/**
 * Every chapter of one inquiry, in reading order — DRAFTS INCLUDED.
 *
 * Drafts are kept in deliberately. The numbering rules below have to run over
 * the whole work or they report nonsense: with drafts stripped first, an
 * unpublished Chapter 3 sitting between a published 2 and 4 would fail the
 * no-gaps check, and the author would be told their numbering is broken when
 * what is actually true is that they have not finished writing. Callers that
 * need only the live chapters filter with `isLive` after the fact — which is
 * also what lets the contents page grey out what is coming rather than
 * pretending it does not exist.
 */
export async function getChapters(inquiry: string): Promise<Chapter[]> {
  // Checked against every inquiry on disk, not just the published ones. A
  // chapters folder whose work is still drafted is not a mistake.
  const known = new Set((await allInquiries()).map(inquirySlug));
  const all = await getCollection('chapters');

  for (const chapter of all) {
    const slug = inquiryOf(chapter);
    if (!known.has(slug)) {
      throw new Error(
        `"${chapter.id}" sits in a folder named "${slug}", which is not an inquiry. ` +
          `Known inquiries: ${[...known].join(', ') || '(none)'}. ` +
          `Add src/content/inquiries/${slug}.mdx, or move the file.`,
      );
    }
  }

  const chapters = all
    .filter((c) => inquiryOf(c) === inquiry)
    .sort((a, b) => a.data.number - b.data.number);

  validateNumbering(inquiry, chapters);
  await validateParts(inquiry, chapters);

  return chapters;
}

/** The live chapters only — what gets a route and appears in a feed. */
export const liveChapters = (chapters: Chapter[]): Chapter[] =>
  chapters.filter(isLive);

/* ---- validation -------------------------------------------------------- */

/**
 * Chapter numbers are the citable identifiers, so a gap or a duplicate is a
 * defect rather than an inconvenience. Checked here because it is a fact
 * about the collection, which no per-entry schema can see.
 */
function validateNumbering(inquiry: string, chapters: Chapter[]): void {
  const seen = new Map<number, string>();
  for (const c of chapters) {
    const existing = seen.get(c.data.number);
    if (existing) {
      throw new Error(
        `${inquiry}: chapter ${c.data.number} is claimed by both "${existing}" and "${c.id}". ` +
          `Chapter numbers are permanent identifiers; two chapters cannot share one.`,
      );
    }
    seen.set(c.data.number, c.id);
  }

  chapters.forEach((c, i) => {
    if (c.data.number !== i + 1) {
      throw new Error(
        `${inquiry}: chapters must run 1..n with no gaps. Expected ${i + 1} but "${c.id}" is chapter ${c.data.number}. ` +
          `A gap means a reader hits a dead end and a citation points at nothing.`,
      );
    }
  });
}

/**
 * `part` is ALL-OR-NOTHING within one inquiry, and this is the rule the whole
 * degradation story rests on. An inquiry where some chapters are grouped and
 * others float has no honest contents page: the ungrouped ones either invent
 * a heading they do not have or sit outside the structure looking dropped.
 * Refusing the state is cheaper than rendering it.
 */
async function validateParts(inquiry: string, chapters: Chapter[]): Promise<void> {
  const grouped = chapters.filter((c) => c.data.part !== undefined);
  const flat = chapters.filter((c) => c.data.part === undefined);

  if (grouped.length === 0) return;

  if (flat.length > 0) {
    throw new Error(
      `${inquiry}: \`part\` is all-or-nothing within an inquiry. ` +
        `${grouped.length} chapter(s) declare a part and ${flat.length} do not — ` +
        `first without: "${flat[0].id}". ` +
        `Either give every chapter a part, or remove the field from all of them.`,
    );
  }

  const declared = (await getInquiry(inquiry)).data.parts;
  if (!declared || declared.length === 0) {
    throw new Error(
      `${inquiry}: chapters declare a \`part\`, but the inquiry declares no \`parts\`. ` +
        `Add the parts to src/content/inquiries/${inquiry}.mdx.`,
    );
  }

  const numbers = new Set(declared.map((p) => p.number));
  for (const c of grouped) {
    if (!numbers.has(c.data.part!)) {
      throw new Error(
        `${inquiry}: "${c.id}" claims part ${c.data.part}, which the inquiry does not declare. ` +
          `Declared parts: ${[...numbers].sort((a, b) => a - b).join(', ')}.`,
      );
    }
  }

  // Chapters run continuously through the work, so their parts must not
  // interleave: Part One, Part Two, Part One again is a contents page that
  // lists the same heading twice and a reader who cannot tell where a part
  // ends. Chapter order is already fixed by number, so this only has to check
  // that the part numbers never go backwards along it.
  let highest = 0;
  for (const c of grouped) {
    const part = c.data.part!;
    if (part < highest) {
      throw new Error(
        `${inquiry}: "${c.id}" is chapter ${c.data.number} in part ${part}, but an earlier chapter is already in part ${highest}. ` +
          `Chapter numbers run continuously through the work, so parts cannot interleave. Renumber the chapters to match the parts.`,
      );
    }
    highest = part;
  }
}

/* ---- shape ------------------------------------------------------------- */

/** One part with the chapters that fall under it, for the contents page. */
export interface PartGroup {
  number: number;
  title: string;
  chapters: Chapter[];
}

/**
 * The contents, grouped or flat.
 *
 * `groups` is null for a flat inquiry rather than a single synthetic group
 * holding everything. A caller that has to render a flat list must not be
 * able to reach for a heading that does not exist — see the degradation rule:
 * with no parts declared, the part label vanishes from the page entirely
 * rather than degrading to "Part One".
 *
 * Empty parts are kept. A declared part with nothing written under it yet is
 * the author saying what is coming, which is most of the value of a contents
 * page for a work in progress.
 */
export async function getContents(
  inquiry: string,
): Promise<{ chapters: Chapter[]; groups: PartGroup[] | null }> {
  const chapters = await getChapters(inquiry);
  const declared = (await getInquiry(inquiry)).data.parts;

  const grouped = declared && chapters.some((c) => c.data.part !== undefined);
  if (!grouped) return { chapters, groups: null };

  const groups = [...declared]
    .sort((a, b) => a.number - b.number)
    .map((part) => ({
      number: part.number,
      title: part.title,
      chapters: chapters.filter((c) => c.data.part === part.number),
    }));

  return { chapters, groups };
}

/** The part a chapter sits in, or undefined for a flat inquiry. */
export async function partOf(
  chapter: Chapter,
): Promise<{ number: number; title: string } | undefined> {
  if (chapter.data.part === undefined) return undefined;
  const declared = (await getInquiry(inquiryOf(chapter))).data.parts;
  return declared?.find((p) => p.number === chapter.data.part);
}
