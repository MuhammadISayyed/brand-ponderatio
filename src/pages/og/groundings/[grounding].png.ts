/**
 * A share card per grounding, at /og/groundings/<work>.png — the card for the
 * spine, which is the front door of a long work.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderCard } from '../../../lib/og-card.mjs';
import { GROUNDINGS, groundingSlugs } from '../../../lib/groundings';
import { SITE_DESCRIPTION } from '../../../lib/site';

export const getStaticPaths = (async () =>
  groundingSlugs().map((grounding) => ({
    params: { grounding },
    props: { title: GROUNDINGS[grounding].title },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard({
    title: props.title as string,
    kicker: 'Grounding',
    footer: SITE_DESCRIPTION,
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
