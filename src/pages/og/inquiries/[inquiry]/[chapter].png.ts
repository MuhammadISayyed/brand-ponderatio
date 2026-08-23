/**
 * A share card per chapter, at /og/inquiries/<work>/<chapter>.png.
 *
 * The kicker carries the chapter number and the work it belongs to, because a
 * chapter shared on its own is the one page on this site whose title means
 * least without its context — "Dispositions without laws" says nothing until
 * you know it is Chapter 5 of something.
 *
 * Drafts get no card, for the same reason they get no page.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderCard } from '../../../../lib/og-card.mjs';
import {
  getInquiries,
  getChapters,
  liveChapters,
  inquirySlug,
  chapterSlug,
} from '../../../../lib/inquiries';
import { chapterCard, type Card } from '../../../../lib/og-pieces';

export const getStaticPaths = (async () => {
  const paths = [];

  for (const inquiry of await getInquiries()) {
    const slug = inquirySlug(inquiry);
    for (const chapter of liveChapters(await getChapters(slug))) {
      paths.push({
        params: { inquiry: slug, chapter: chapterSlug(chapter) },
        /* Built in lib/og-pieces, which is also where ChapterLayout gets it to
           stamp this URL — the stamp is only true while both come from the
           one function. */
        props: { card: chapterCard(inquiry, chapter) },
      });
    }
  }

  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard(props.card as Card);

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
