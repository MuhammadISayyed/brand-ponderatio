/**
 * What a card is made of, and the fingerprint that puts it in the card's URL.
 *
 * WHY THIS EXISTS. The cards themselves were never the problem: change an
 * essay's title, the build redraws /og/essays/<slug>.png, the new bytes ship.
 * What did not change was the URL — and an unfurler (iMessage, Slack, X,
 * LinkedIn, WhatsApp) caches the image it fetched against exactly that string,
 * for days at best and permanently at worst. So a corrected card sat on the
 * origin, unfetched, while every chat window that had ever seen the link kept
 * showing the old one. The title of the last essay was capitalised and the
 * previews stayed lower case for precisely this reason.
 *
 * The fix is to make the address move when the drawing moves: `?v=<stamp>`,
 * the stamp being a hash of the very fields renderCard() draws. An edit mints
 * an address nothing has cached, so the next scrape is obliged to fetch it.
 * It re-keys Cloudflare's edge cache in the same stroke, which is the second
 * stale copy that would otherwise need purging by hand.
 *
 * THE RULE THAT KEEPS IT HONEST. A stamp means something only if it is
 * computed from the same object that is rendered. So the card for a piece is
 * built ONCE, by a function in lib/og-pieces, and that one object is used both
 * by the page linking to the card and by the endpoint drawing it — never
 * assembled twice from the same source data, which is how the two would
 * quietly drift apart. Anything you teach renderCard to draw must arrive
 * through the card object, or the URL will stop moving when that thing does.
 *
 * WHAT IT CANNOT DO. A stamp only helps a link that has not been shared yet,
 * or one whose page gets re-scraped. Links already sitting in someone's
 * message history are fixed by scripts/unfurl.mjs — see there.
 */
/* The `.ts` extension is not a slip. Inside the Astro build Vite resolves it
   like anything else, but this module is also imported by scripts/make-og.mjs,
   which bare node runs — and node reads TypeScript directly only from 22.18.
   Hence the engines floor in package.json. The alternative was writing the two
   site strings out a second time in the script, which is the class of
   duplication this whole file exists to argue against. */
import { createHash } from 'node:crypto';
import { SITE_TITLE, SITE_DESCRIPTION } from './site.ts';

/**
 * The fallback card: the site introducing itself, used by every page that is
 * not a piece — the home page, the two listings, the 404. Lives here rather
 * than in the script that draws it because scripts/make-og.mjs and the layout
 * that stamps the URL must agree on the strings down to the character.
 */
export const SITE_CARD = { title: SITE_TITLE, footer: SITE_DESCRIPTION };

/**
 * Eight hex characters. This is a cache key, not a signature: it only has to
 * change when the card changes, and there is no adversary to collide with it.
 *
 * The fields are hashed as a fixed-order array rather than as the object, so
 * that an absent kicker and an undefined one give the same answer and the
 * stamp cannot move because a key was declared in a different order.
 */
export const stamp = (card) =>
  createHash('sha256')
    .update(JSON.stringify([card.title, card.kicker ?? '', card.footer ?? '']))
    .digest('hex')
    .slice(0, 8);

/** The path a card is served from, plus the stamp of what is drawn on it. */
export const stamped = (path, card) => `${path}?v=${stamp(card)}`;
