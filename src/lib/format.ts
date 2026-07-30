/**
 * Presentation helpers. Pure functions, no DOM — these run during the static
 * build, so nothing here may touch `window`.
 */

/**
 * Dates are formatted in UTC, not the build machine's zone. Frontmatter dates
 * are bare `YYYY-MM-DD`, which Zod parses as midnight UTC; formatting those in
 * a negative-offset zone silently renders the previous day.
 */
const DATELINE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export const formatDateline = (date: Date): string => DATELINE.format(date);

/** `2026-07-29` — for the `datetime` attribute on `<time>`. */
export const machineDate = (date: Date): string =>
  date.toISOString().slice(0, 10);

const KIND_LABELS = {
  note: 'Note',
  essay: 'Essay',
  case: 'Case',
} as const;

export const kindLabel = (kind: keyof typeof KIND_LABELS): string =>
  KIND_LABELS[kind];

/**
 * Essay URLs are `/essays/<slug>`, under the section they belong to rather
 * than a `/posts/` path that names the collection instead of the thing. The
 * navigation says Essays; the URL should agree, or "which section am I in"
 * has two answers.
 *
 * The slug is whatever the frontmatter says, falling back to the filename —
 * so renaming a file does not have to move a published URL, and a published
 * URL does not have to dictate a filename.
 */
export const postSlug = (entry: {
  id: string;
  data: { slug?: string };
}): string => entry.data.slug ?? entry.id;

export const postHref = (entry: {
  id: string;
  data: { slug?: string };
}): string => `/essays/${postSlug(entry)}/`;
