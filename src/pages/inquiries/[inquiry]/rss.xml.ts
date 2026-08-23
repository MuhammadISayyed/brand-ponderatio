/**
 * A feed per inquiry, at /inquiries/<work>/rss.xml.
 *
 * Worth having because an inquiry is the one thing on this site somebody
 * might want to follow WITHOUT following everything else: it runs for months,
 * and a reader who came for the work on demand should not have to take the
 * essays to get it. The main feed still carries every chapter, so this adds a
 * narrower subscription rather than a second place to look.
 *
 * The description is the standfirst — the problem, not a summary of findings,
 * which is the right thing to put in front of someone deciding whether to
 * follow along.
 */
import rss from '@astrojs/rss';
import type { APIContext, GetStaticPaths } from 'astro';
import {
  getInquiries,
  getChapters,
  liveChapters,
  inquirySlug,
  chapterHref,
} from '../../../lib/inquiries';
import { SITE_TITLE } from '../../../lib/site';

export const getStaticPaths = (async () => {
  const inquiries = await getInquiries();
  return inquiries.map((inquiry) => ({
    params: { inquiry: inquirySlug(inquiry) },
    props: { inquiry },
  }));
}) satisfies GetStaticPaths;

export async function GET(context: APIContext) {
  const { inquiry } = context.props;
  const slug = inquirySlug(inquiry);
  const chapters = liveChapters(await getChapters(slug));

  return rss({
    // Titled with the work rather than the site, because that is what the
    // subscriber chose. The site's name follows it so the source is still
    // identifiable in a reader listing many feeds.
    title: `${inquiry.data.title} — ${SITE_TITLE}`,
    description: inquiry.data.standfirst,
    site: context.site!,
    // No work prefix on the title here: every item in this feed is from the
    // same work, so repeating its name on each one is noise the main feed
    // needs and this one does not.
    items: chapters
      .map((chapter) => ({
        title: `Chapter ${chapter.data.number}: ${chapter.data.title}`,
        pubDate: chapter.data.date,
        description: chapter.data.deck,
        link: chapterHref(slug, chapter),
      }))
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime()),
    customData: '<language>en</language>',
  });
}
