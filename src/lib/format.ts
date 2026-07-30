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

/** Post URLs are flat: `/posts/<slug>`. Notes are not filed separately by
 *  reference code — the code is a filing label, not a route. */
export const postHref = (id: string): string => `/posts/${id}/`;
