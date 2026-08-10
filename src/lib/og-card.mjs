/**
 * Draws the cards that links to this site unfurl as.
 *
 * ONE IMPLEMENTATION, TWO CALLERS: the endpoints under src/pages/og/ build a
 * card per piece at build time, and scripts/make-og.mjs builds the site-wide
 * fallback. Written as .mjs rather than .ts precisely so the plain Node script
 * and the Astro build can share it without a compile step between them.
 *
 * WHY NOT GOUDY. Rasterising text resolves fonts through fontconfig, which
 * reads installed system fonts and cannot see the .woff2 files Astro
 * downloads for the browser. Georgia and Helvetica are the fallback stacks
 * this project already declares for --font-document and --font-working, so
 * the card is set in the site's own second choice rather than in a face that
 * changes depending on whose machine ran the build.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

/**
 * FOUND FROM THE WORKING DIRECTORY, NOT FROM THIS FILE.
 *
 * Resolving relative to import.meta.url works when Node runs this module from
 * src/lib, and breaks the moment Vite bundles it for the build — the bundled
 * copy lives in dist/.prerender/, so "../../public" points at a directory
 * that does not exist and the build fails on the first card.
 *
 * Both callers run from the project root: `npm run og` and `astro build`.
 * The module-relative path is kept as a fallback for anything that does not.
 */
const EMBLEM = [
  resolve(process.cwd(), 'public/emblem.svg'),
  resolve(dirname(fileURLToPath(import.meta.url)), '../../public/emblem.svg'),
].find((candidate) => existsSync(candidate));

if (!EMBLEM) {
  throw new Error(
    'og-card: cannot find public/emblem.svg. Run from the project root.',
  );
}

/* Straight from tokens.css. */
const PAPER = '#f7f1e3';
const INK = '#211d17';
const INK_2 = '#4f483f';
const RULE = '#dfd6c2';

/* 1200×630 is the size every unfurler crops toward. */
const W = 1200;
const H = 630;
const MARGIN = 96;
const MEASURE = W - MARGIN * 2;

const EMBLEM_TOP = 80;
const EMBLEM_H = 84;

const emblemSvg = (y) =>
  readFileSync(EMBLEM, 'utf8')
    .replace(/^<\?xml[^>]*\?>\s*/, '')
    .replace(
      /^<svg[^>]*>/,
      `<svg x="${MARGIN}" y="${y}" width="${(305 / 367) * EMBLEM_H}" height="${EMBLEM_H}" viewBox="0 0 305 367">`,
    );

const escape = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * SVG does not wrap text, so lines are broken here.
 *
 * The width test is a heuristic — average glyph width as a fraction of the em
 * — because measuring properly would mean parsing font metrics for a face
 * chosen at render time by fontconfig. Georgia at these sizes averages a
 * little under half an em across mixed-case English. The factor is
 * deliberately generous: a line breaking one word early is invisible, a line
 * running past the margin is not.
 */
function wrap(text, fontSize, maxWidth, maxLines) {
  const perChar = fontSize * 0.48;
  const maxChars = Math.floor(maxWidth / perChar);
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxChars) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[.,;:]$/, '')}…`;
    return kept;
  }
  return lines;
}

/**
 * @param {object} card
 * @param {string} card.title    The headline. A piece's title, or the site's.
 * @param {string} [card.kicker] Small line above the title — what kind of
 *                               thing this is. Omitted on the site card.
 * @param {string} card.footer   The line under the rule.
 * @returns {Promise<Buffer>} PNG
 */
export async function renderCard({ title, kicker, footer }) {
  /* Type size steps down as the title gets longer, so a long title fills the
     card rather than overflowing it and a short one still lands with weight.
     Three sizes, not a continuous scale: the point is legibility at thumbnail
     size, and eight arbitrary sizes would be eight decisions to defend. */
  const fontSize = title.length > 64 ? 60 : title.length > 34 ? 72 : 84;
  const leading = Math.round(fontSize * 1.15);
  const lines = wrap(title, fontSize, MEASURE, 3);

  /* THE BLOCK IS MEASURED UP FROM THE FOOTER, not down from the emblem.
     Built downward, a three-line title pushed the rule and the footer off the
     bottom of the card — and the card is a fixed 1200x630, so anything that
     overflows is simply not there. Anchoring the footer and stacking upward
     means the title grows into the space it has. */
  const footerY = H - 110;
  const ruleY = footerY - 62;
  const lastLineY = ruleY - 56;
  const firstLineY = lastLineY - (lines.length - 1) * leading;

  /* Clear of the title's ascenders rather than a fixed distance from the
     kicker's own baseline: at 84px the two collided, because the gap has to
     be measured from the top of the letters, not from where they sit. */
  const kickerY = firstLineY - fontSize * 0.78 - 34;

  const titleTspans = lines
    .map(
      (line, i) =>
        `<tspan x="${MARGIN}" y="${firstLineY + i * leading}">${escape(line)}</tspan>`,
    )
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  ${emblemSvg(EMBLEM_TOP)}
  ${
    kicker
      ? `<text x="${MARGIN}" y="${kickerY}" fill="${INK_2}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="28" letter-spacing="2.4">${escape(kicker.toUpperCase())}</text>`
      : ''
  }
  <text fill="${INK}" font-family="Georgia, serif" font-size="${fontSize}" letter-spacing="-1">${titleTspans}</text>
  <rect x="${MARGIN}" y="${ruleY}" width="${MEASURE}" height="1" fill="${RULE}"/>
  <text x="${MARGIN}" y="${footerY}" fill="${INK_2}" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30">${escape(footer)}</text>
</svg>`;

  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
