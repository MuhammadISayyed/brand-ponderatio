/**
 * A share card per essay, at /og/essays/<slug>.png.
 *
 * Built as an endpoint rather than by a script because there is one per piece
 * and the set changes whenever the writing does — a hand-run generator would
 * be a step to forget, and the failure is silent: the link still unfurls,
 * just with the wrong card.
 *
 * The site-wide card (public/og.png) stays as the fallback for pages that are
 * not a piece — the listings, the 404.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { renderCard } from '../../../lib/og-card.mjs';
import { postSlug } from '../../../lib/format';
import { essayCard, type Card } from '../../../lib/og-pieces';

export const getStaticPaths = (async () => {
  const posts = await getCollection('posts', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );

  return posts.map((post) => ({
    params: { slug: postSlug(post) },
    /* What goes on the card is not decided here — see lib/og-pieces. The page
       that links to this one stamps its URL with a hash of this same card, and
       the two only stay true to each other by coming from one function. */
    props: { card: essayCard(post.data) },
  }));
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
