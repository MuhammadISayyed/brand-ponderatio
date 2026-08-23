/**
 * Checks what the world will see when it unfurls a link to this site, and
 * tells you which pages need a scrape forced by hand.
 *
 *   npm run unfurl              # check every page
 *   npm run unfurl -- --open    # and open the debuggers for the stale ones
 *
 * WHY IT EXISTS. The `?v=` stamp on every card URL (see src/lib/og-cards.mjs)
 * fixes the future: edit a title and the card moves to an address nothing has
 * cached, so the next scrape must fetch it. It does nothing for the past. A
 * link already sitting in a Slack channel or a message thread was scraped
 * once, and what that platform stored — the description, the image, the image
 * BYTES — is keyed on the page URL, which never changes. Some platforms
 * re-scrape eventually. iMessage does not; it caches per device, with no
 * public way to invalidate.
 *
 * So the only remedy for a link already shared is to ask each platform to
 * scrape again, at a page each of them puts behind a login. This script does
 * the part that can be automated: work out which pages are actually stale on
 * the live origin, and hand you the exact debugger URLs for those, rather than
 * a checklist to work through page by page.
 *
 * WHAT IT COMPARES. `dist/` is the truth — what the build says the card should
 * be. Production is fetched and its `og:image` read back. They disagree in two
 * ways worth telling apart:
 *
 *   NOT DEPLOYED   the live page still advertises the old stamp. Nothing to
 *                  re-scrape yet; deploy first, or you will make every
 *                  platform cache the OLD card afresh.
 *   NEEDS RESCRAPE the live page advertises the new stamp and the card behind
 *                  it resolves. The origin is correct and only the platforms
 *                  are behind.
 */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { execFile } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '../dist');
const open = process.argv.includes('--open');

/** Every built page, so a new section never has to be added to a list here. */
async function pages(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await pages(path)));
    else if (entry.name.endsWith('.html')) out.push(path);
  }
  return out;
}

const meta = (html, property) =>
  html.match(
    new RegExp(`<meta property="${property}" content="([^"]*)"`),
  )?.[1];

/**
 * The debuggers. Each is a page you have to be logged into, which is why this
 * script prints links rather than calling anything: the one programmatic route
 * (Facebook's Graph API scrape endpoint) wants an app token, and standing up
 * an app to re-scrape a personal site is a worse trade than three clicks.
 *
 * Slack has no debugger. It re-unfurls a URL after roughly half an hour, and
 * the reliable manual fix is to post the link with a `?` on the end once —
 * which Slack treats as a different URL — or to delete and repost.
 *
 * iMessage has neither, and no fix. Its cache is per device and permanent.
 * A link shared there before the correction keeps the old card forever; the
 * only way to show someone the new one is to send a fresh URL.
 */
const debuggers = (url) => [
  ['Facebook / WhatsApp', `https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(url)}`],
  ['LinkedIn', `https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(url)}`],
  ['X', `https://cards-dev.twitter.com/validator`],
];

const built = await pages(dist);
const stale = [];
let undeployed = 0;
let ok = 0;

for (const file of built.sort()) {
  const html = await readFile(file, 'utf8');
  const url = meta(html, 'og:url');
  const card = meta(html, 'og:image');

  /* The 404 is a real built page with real tags, and nobody has ever shared
     one on purpose. Skipped so the re-scrape list stays a list of things
     actually worth clicking through. */
  if (!url || !card || file.endsWith('404.html')) continue;

  let live;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    live = meta(await res.text(), 'og:image');
  } catch (error) {
    console.log(`  ?  ${url}\n     could not be fetched: ${error.message}`);
    continue;
  }

  if (live !== card) {
    undeployed += 1;
    console.log(`  ✗  ${url}\n     live card is ${live}\n     built card is ${card}  — NOT DEPLOYED`);
    continue;
  }

  /* The page is right; make sure the card it points at actually resolves.
     A stamped URL is a query string on a static file, which Cloudflare serves
     happily — but a 404 here would mean every forced re-scrape stores a
     broken image, which is worse than the stale one it replaces. */
  const res = await fetch(card, { method: 'HEAD', cache: 'no-store' });
  if (!res.ok) {
    console.log(`  ✗  ${url}\n     card 404s at ${card}`);
    continue;
  }

  ok += 1;
  stale.push(url);
  console.log(`  ✓  ${url}`);
}

console.log(
  `\n${ok} page(s) serving the current card` +
    (undeployed ? `, ${undeployed} not deployed yet` : ''),
);

if (undeployed) {
  console.log(
    '\nDeploy before forcing any re-scrape. Re-scraping a page that still\n' +
      'advertises the old card only refreshes the platforms’ hold on the old card.',
  );
}

if (!stale.length) process.exit(0);

console.log(
  '\nThe origin is correct. What is left is the platforms’ own caches —\n' +
    'open these while logged in and hit Scrape Again / Inspect:\n',
);

const links = [];
for (const url of stale) {
  console.log(`  ${url}`);
  for (const [name, link] of debuggers(url)) {
    console.log(`    ${name.padEnd(20)} ${link}`);
    links.push(link);
  }
  console.log();
}

console.log(
  'Slack: no debugger. Post the link once with a trailing ? to force a fresh\n' +
    'unfurl, or wait about thirty minutes.\n' +
    'iMessage: no debugger and no cache expiry. Links already sent keep the\n' +
    'old card permanently.',
);

if (open) {
  for (const link of links) execFile('open', [link]);
}
