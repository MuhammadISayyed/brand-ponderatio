/**
 * Generates public/og.png — the card every link to this site unfurls as.
 *
 * WHY A SCRIPT AND NOT A BUILD STEP. The card is one image that changes when
 * the identity changes, which is to say almost never. Generating it on every
 * build would put a rasteriser and a 50KB path trace on the critical path of
 * a 1.8s build to produce a byte-identical file each time. So: run it by
 * hand, commit the PNG.
 *
 *   node scripts/make-og.mjs
 *
 * WHY THE TYPE IS NOT GOUDY. Rasterising text means resolving a font through
 * fontconfig, and fontconfig reads installed system fonts — not the .woff2
 * files Astro downloads into node_modules for the browser. Goudy Bookletter
 * 1911 is not installed on any machine that has not deliberately installed
 * it, and a card whose face silently changes depending on whose laptop last
 * ran the script is worse than one that never claimed the face at all.
 *
 * Georgia and system-ui are not arbitrary substitutes: they are exactly the
 * fallback stacks declared for --font-document and --font-working in
 * astro.config.mjs. The card is set in the site's own second choice, which is
 * the honest version of this compromise.
 *
 * The emblem carries the identity here regardless — it is the one element
 * that is pixel-for-pixel the real thing, because it is our own SVG.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

/* Straight from tokens.css. Duplicated rather than parsed: this is four
   values that have not changed since the palette was set, and a CSS parser
   here would be more machinery than the thing it feeds. */
const PAPER = '#f7f1e3';
const INK = '#211d17';
const INK_2 = '#4f483f';
const RULE = '#dfd6c2';

const SITE_TITLE = 'Brand Ponderatio';
const SITE_LINE = 'Essays and groundings — long arguments, published complete.';

/* 1200×630 is the size every unfurler crops toward — Slack, iMessage, X,
   LinkedIn. Anything else gets letterboxed or centre-cropped by someone
   else's rules. */
const W = 1200;
const H = 630;
const MARGIN = 96;

/* The emblem, inlined. Its own <svg> element becomes a nested one, which is
   how it gets placed and scaled without touching its 305×367 coordinates. */
const emblem = readFileSync(resolve(root, 'public/emblem.svg'), 'utf8')
  .replace(/^<\?xml[^>]*\?>\s*/, '')
  .replace(
    /^<svg[^>]*>/,
    `<svg x="${MARGIN}" y="${MARGIN}" width="${(305 / 367) * 132}" height="132" viewBox="0 0 305 367">`,
  );

/* The baseline grid, such as it is: emblem, then the name, then a hairline,
   then the line. Each measured down from the one above rather than from the
   top, so moving one moves the rest. */
const NAME_BASELINE = MARGIN + 132 + 128;
const RULE_Y = NAME_BASELINE + 56;
const LINE_BASELINE = RULE_Y + 62;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PAPER}"/>
  ${emblem}
  <text x="${MARGIN}" y="${NAME_BASELINE}" fill="${INK}"
        font-family="Georgia, serif" font-size="84" letter-spacing="-1.3">${SITE_TITLE}</text>
  <rect x="${MARGIN}" y="${RULE_Y}" width="${W - MARGIN * 2}" height="1" fill="${RULE}"/>
  <text x="${MARGIN}" y="${LINE_BASELINE}" fill="${INK_2}"
        font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="34">${SITE_LINE}</text>
</svg>`;

const out = resolve(root, 'public/og.png');
const buf = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
writeFileSync(out, buf);
console.log(`wrote ${out} — ${W}×${H}, ${(buf.length / 1024).toFixed(1)}KB`);
