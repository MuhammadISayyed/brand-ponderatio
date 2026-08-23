/**
 * Generates public/og.png — the FALLBACK card, used by every page that is not
 * a piece: the home page, the two listings, the 404.
 *
 * Pieces do not use this. Each essay, inquiry and chapter gets its own card
 * carrying its own title, built at build time by the endpoints under
 * src/pages/og/. This one is the site introducing itself.
 *
 * WHY A SCRIPT AND NOT A BUILD STEP. It changes when the identity changes,
 * which is to say almost never, so there is no reason to put a rasteriser on
 * the critical path of every build to produce a byte-identical file. The
 * per-piece cards are endpoints precisely because the opposite is true of
 * them: the set changes whenever the writing does.
 *
 *   npm run og
 *
 * The drawing itself lives in src/lib/og-card.mjs, shared with those
 * endpoints so every card on the site is the same card.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderCard } from '../src/lib/og-card.mjs';
import { SITE_CARD } from '../src/lib/og-cards.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

/* SITE_CARD, not the two strings written out again. BaseLayout hashes that
   same object into this file's `?v=` stamp, so a copy here that drifted would
   produce a card nobody's cache had any reason to re-fetch — the exact failure
   the stamp exists to prevent. */
const png = await renderCard(SITE_CARD);

const out = resolve(root, 'public/og.png');
writeFileSync(out, png);
console.log(`wrote ${out} — 1200x630, ${(png.length / 1024).toFixed(1)}KB`);
