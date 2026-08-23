/**
 * The feed, at /rss.xml.
 *
 * WHAT COUNTS AS AN ITEM. Essays, one item each — straightforward. And each
 * CHAPTER of an inquiry as its own item, tagged with the work it belongs to.
 *
 * THIS REVERSES THE RULE THIS FILE USED TO STATE, and the reversal is the
 * point of the register that replaced groundings. A grounding published
 * complete, so one item per part would have told a subscriber five times
 * about a thing that happened once; the feed pointed at the spine instead. An
 * inquiry publishes a chapter at a time over months. Pointing at the contents
 * page would mean either one notification at the start, for a work with
 * nothing in it yet, or a silently re-dated item the reader has already seen.
 * Serial publication is what a feed is actually for, and a chapter is the
 * thing that gets published.
 *
 * The inquiry itself is NOT an item. It is not a thing that happens on a day —
 * it is the container, and the tag on each chapter is what names it.
 *
 * Drafts are excluded exactly as they are everywhere else: `liveChapters` and
 * `getInquiries` already apply the rule, so this file inherits it rather than
 * restating it and risking a third version.
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { postHref } from '../lib/format';
import {
  getInquiries,
  getChapters,
  liveChapters,
  inquirySlug,
  chapterHref,
} from '../lib/inquiries';
import { SITE_TITLE, SITE_DESCRIPTION } from '../lib/site';

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

  const chapterItems = (
    await Promise.all(
      (await getInquiries()).map(async (inquiry) => {
        const slug = inquirySlug(inquiry);
        return liveChapters(await getChapters(slug)).map((chapter) => ({
          // The work's name travels with the title. A feed reader shows a
          // flat list from many sources, and "Dispositions Without Laws"
          // arriving on its own gives a subscriber no way to tell it is the
          // fifth move in an argument they have been following.
          title: `${inquiry.data.title} · Chapter ${chapter.data.number}: ${chapter.data.title}`,
          pubDate: chapter.data.date,
          description: chapter.data.deck,
          link: chapterHref(slug, chapter),
          categories: [inquiry.data.title],
        }));
      }),
    )
  ).flat();

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // Supplied by Astro from `site` in astro.config.mjs. The build fails
    // loudly if it is missing, which is the correct outcome — a feed of
    // relative links is not a feed.
    site: context.site!,
    items: [...essayItems, ...chapterItems].sort(
      (a, b) => b.pubDate.getTime() - a.pubDate.getTime(),
    ),
    customData: '<language>en</language>',
  });
}
