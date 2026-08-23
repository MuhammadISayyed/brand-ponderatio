/**
 * A share card per inquiry, at /og/inquiries/<work>.png — the card for the
 * contents page, which is the front door of a long work.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { renderCard } from '../../../lib/og-card.mjs';
import { getInquiries, inquirySlug } from '../../../lib/inquiries';
import { inquiryCard, type Card } from '../../../lib/og-pieces';

export const getStaticPaths = (async () => {
  const inquiries = await getInquiries();
  return inquiries.map((inquiry) => ({
    params: { inquiry: inquirySlug(inquiry) },
    /* The card is built in lib/og-pieces, where the contents page also gets it
       to stamp this URL. One function, so the stamp cannot come to describe a
       card different from the one drawn here. */
    props: { card: inquiryCard(inquiry) },
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
