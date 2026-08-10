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
    props: {
      title: GROUNDINGS[grounding].title,
      abstract: GROUNDINGS[grounding].abstract,
    },
  }))) satisfies GetStaticPaths;

/**
 * A grounding has no deck. What it has is an ABSTRACT — a paragraph, which is
 * three times what fits under the rule. Its first sentence usually stands on
 * its own, so that is used where it is short enough to set at this size, and
 * the site line where it is not. An abstract chopped mid-clause with an
 * ellipsis reads as a card that ran out of room, which is worse than a card
 * that says something general and finishes.
 */
const opening = (abstract: string): string | undefined => {
  const first = abstract.split(/(?<=\.)\s/)[0];
  return first && first.length <= 130 ? first : undefined;
};

export const GET: APIRoute = async ({ props }) => {
  const png = await renderCard({
    title: props.title as string,
    kicker: 'Grounding',
    footer: opening(props.abstract as string) ?? SITE_DESCRIPTION,
  });

  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
