/**
 * Generates the favicons from public/emblem.svg — one mark, everywhere it
 * appears, including the 16px square in a browser tab.
 *
 *   npm run icons
 *
 * Outputs, all committed:
 *   public/favicon.ico          16 + 32 + 48, for the path browsers probe
 *   public/favicon-32.png       the modern PNG declaration
 *   public/apple-touch-icon.png 180×180, for an iOS home screen
 *
 * The SVG itself is declared first in BaseLayout and is what any current
 * browser actually renders. These exist for everything that does not read it:
 * the bare /favicon.ico request browsers and feed readers make on their own,
 * and iOS, which has never supported SVG icons.
 *
 * WHY A PAPER BACKGROUND RATHER THAN TRANSPARENCY. The emblem is cinnabar on
 * nothing. Left transparent it sits directly on whatever the browser chrome
 * is, which in a dark theme is dark red on near-black — the mark disappears at
 * exactly the size where it has the least to work with. Paper is also what the
 * mark sits on everywhere else on the site, so this is consistency rather than
 * a compromise.
 *
 * WHY THE EMBLEM IS INSET. It is a portrait mark (305×367) going into a square
 * frame. Fitted edge to edge it would distort or crowd; centred with a margin
 * it keeps its proportions and reads as a stamp rather than a sticker cropped
 * to the tab. How much margin depends on the size — see `inset` below.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const PAPER = '#f7f1e3';
const EMBLEM_W = 305;
const EMBLEM_H = 367;
/**
 * Fraction of the square the emblem's HEIGHT occupies, by target size.
 *
 * The margin is not a constant, because it does not cost the same at every
 * size. At 180px an inset reads as a stamp with air around it. At 16px there
 * are no pixels to spare: the emblem's strokes are fine and speckled, and
 * every one of them the resampler averages against paper comes back paler, so
 * the mark fades to a pink smudge exactly where it needs to be a decisive
 * shape. Small sizes give the margin back to the drawing.
 */
const inset = (size) => (size <= 32 ? 0.95 : 0.82);

const emblem = readFileSync(resolve(root, 'public/emblem.svg'), 'utf8');

/** One square PNG of the emblem on paper, at the given edge length. */
async function square(size) {
  const h = Math.round(size * inset(size));
  const w = Math.round(h * (EMBLEM_W / EMBLEM_H));

  /* Rasterised from the SVG at the exact pixel size rather than scaled down
     from one large render: a 16px icon resampled from 180px turns 1px strokes
     into grey mush, while librsvg hinting at the target size keeps them. */
  const mark = await sharp(Buffer.from(emblem))
    .resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: PAPER,
    },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * An .ico is a tiny container: a 6-byte header, a 16-byte directory entry per
 * image, then the images themselves. Modern .ico files may hold PNGs verbatim,
 * which is what this does — no BMP encoding, no palette.
 *
 * Written by hand because sharp cannot emit .ico and the alternative is a
 * dependency whose entire job is these 40 lines.
 */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + pngs.length * 16;
  const entries = [];
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    // 0 means 256 in this field; nothing here is that large, but the encoding
    // is worth respecting rather than assuming.
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette size — 0 for PNG
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const icoSizes = [16, 32, 48];
const pngs = await Promise.all(
  icoSizes.map(async (size) => ({ size, data: await square(size) })),
);

writeFileSync(resolve(root, 'public/favicon.ico'), ico(pngs));
writeFileSync(resolve(root, 'public/favicon-32.png'), pngs[1].data);
writeFileSync(resolve(root, 'public/apple-touch-icon.png'), await square(180));

console.log(`  favicon.ico          ${icoSizes.join(' + ')}px
  favicon-32.png       32px
  apple-touch-icon.png 180px`);
