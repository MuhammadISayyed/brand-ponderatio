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
import { SITE_DESCRIPTION } from '../../../lib/site';

export const getStaticPaths = (async () => {
  const posts = await getCollection('posts', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );

  return posts.map((post) => ({
    params: { slug: postSlug(post) },
    props: {
      title: post.data.title,
      kind: post.data.kind,
      /* The piece's own line where it has one. A deck is already the sentence
         the author wrote to introduce this piece; the site line is what to
         say when there is nothing better. */
      deck: post.data.deck,
    },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard({
    title: props.title as string,
    kicker: props.kind === 'case' ? 'Case' : 'Essay',
    footer: (props.deck as string | undefined) ?? SITE_DESCRIPTION,
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
