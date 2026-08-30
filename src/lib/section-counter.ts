/**
 * Per-page section numbering, and the roman numeral it is set in.
 *
 * Same mechanism and same reasoning as the figure and sidenote counters:
 * keyed on the Request object, because one page render is one Request shared
 * by every component in it, so the numerals restart at I on each page.
 *
 * THE `roman()` DELETED FROM lib/inquiries.ts IS BACK, AND THIS TIME IT HAS A
 * CALLER. It was removed there because inquiries stopped being numbered and it
 * had become an exported function nothing called — "an invitation to number
 * something". This is that something: a chapter's internal sections are marked
 * by numeral and nothing else, so the numeral is the section's whole name. It
 * lives beside the counter that produces its input rather than back in
 * inquiries.ts, which knows about works and chapters and has no business
 * knowing how a section inside one is set.
 */
const counters = new WeakMap<Request, number>();

export function nextSectionNumber(request: Request): number {
  const n = (counters.get(request) ?? 0) + 1;
  counters.set(request, n);
  return n;
}

const NUMERALS: [number, string][] = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/**
 * `roman(4)` -> `IV`.
 *
 * Stops at 20 and throws beyond it rather than growing an arm of numerals no
 * reader can count at a glance. A numeral is doing the job a title would
 * otherwise do — telling you which section you are in — and it can only do
 * that while it stays readable at a glance. `XVII` is not read, it is decoded.
 * A chapter that has run past twenty sections wants splitting, not a longer
 * numeral, and failing the build is how that gets said.
 */
export function roman(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 20) {
    throw new Error(
      `roman(): expected an integer between 1 and 20, got ${n}. ` +
        `Sections are marked by numeral alone, and a numeral past XX is decoded rather than read — split the chapter instead.`,
    );
  }
  let rest = n;
  let out = '';
  for (const [value, numeral] of NUMERALS) {
    while (rest >= value) {
      out += numeral;
      rest -= value;
    }
  }
  return out;
}
