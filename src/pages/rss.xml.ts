/**
 * The feed, at /rss.xml.
 *
 * WHAT COUNTS AS AN ITEM. Essays, one item each — straightforward. And each
 * GROUNDING as ONE item pointing at its spine, not one item per part.
 *
 * That is the whole argument for a feed on this site. A grounding publishes
 * complete, so a subscriber who got five items in a row for one work would be
 * told five times about a thing that happened once, and would arrive at Part I
 * with no way to see the shape of what follows. The spine page is the argument
 * in outline; it is the right front door, and it is what the feed points at.
 *
 * A grounding has no date of its own — dates live on parts — so it is dated by
 * its most recently dated part. That is the day the work last changed, which
 * is what a reader sorting a feed by date actually wants to know.
 *
 * Drafts are excluded exactly as they are everywhere else: the two helpers
 * below already filter on import.meta.env.PROD, so this file inherits the rule
 * rather than restating it and risking a third version of it.
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { postHref } from '../lib/format';
import {
  GROUNDINGS,
  groundingSlugs,
  getParts,
  groundingHref,
} from '../lib/groundings';

const SITE_TITLE = 'Brand Ponderatio';
const SITE_DESCRIPTION =
  'Essays and groundings — long arguments, published complete.';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );

  const essayItems = posts.map((post) => ({
    title: post.data.title,
    pubDate: post.data.date,
    description: post.data.deck,
    link: postHref(post),
  }));

  const groundingItems = (
    await Promise.all(
      groundingSlugs().map(async (slug) => {
        const parts = await getParts(slug);
        // A registered grounding with no published parts is a work in
        // progress, not an announcement. Nothing to point a subscriber at.
        if (parts.length === 0) return null;

        const latest = parts.reduce(
          (newest, part) =>
            part.data.date > newest ? part.data.date : newest,
          parts[0].data.date,
        );

        return {
          title: GROUNDINGS[slug].title,
          pubDate: latest,
          description: GROUNDINGS[slug].abstract,
          link: groundingHref(slug),
        };
      }),
    )
  ).filter((item) => item !== null);

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // Supplied by Astro from `site` in astro.config.mjs. The build fails
    // loudly if it is missing, which is the correct outcome — a feed of
    // relative links is not a feed.
    site: context.site!,
    items: [...essayItems, ...groundingItems].sort(
      (a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
    ),
    customData: '<language>en</language>',
  });
}
