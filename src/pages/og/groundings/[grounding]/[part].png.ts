/**
 * A share card per part, at /og/groundings/<work>/<part>.png.
 *
 * The kicker carries the roman numeral and the work it belongs to, because a
 * part shared on its own is the one page on this site whose title means least
 * without its context — "Powers compose" says nothing until you know it is
 * Part III of something.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderCard } from '../../../../lib/og-card.mjs';
import {
  GROUNDINGS,
  groundingSlugs,
  getParts,
  partSlug,
  roman,
} from '../../../../lib/groundings';
import { SITE_DESCRIPTION } from '../../../../lib/site';

export const getStaticPaths = (async () => {
  const paths = [];

  for (const grounding of groundingSlugs()) {
    const parts = await getParts(grounding);
    for (const part of parts) {
      paths.push({
        params: { grounding, part: partSlug(part) },
        props: {
          title: part.data.title,
          kicker: `Part ${roman(part.data.part)} · ${GROUNDINGS[grounding].title}`,
          deck: part.data.deck,
        },
      });
    }
  }

  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard({
    title: props.title as string,
    kicker: props.kicker as string,
    footer: (props.deck as string | undefined) ?? SITE_DESCRIPTION,
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
