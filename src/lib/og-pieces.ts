/**
 * The card belonging to each kind of piece — one function per kind, and the
 * only place any of them is worked out.
 *
 * This module exists to keep a promise made in lib/og-cards: the stamp in a
 * card's URL is a hash of what the card says, so the thing hashed and the
 * thing drawn have to be the same object. Two callers need each card — the
 * page, which links to it, and the endpoint under src/pages/og/, which renders
 * it — and if each derived "kicker" and "footer" for itself, the day someone
 * changed one and not the other the URL would go on claiming a card that is no
 * longer what gets drawn. So neither derives anything. Both call these.
 *
 * Split from og-cards.mjs, which is plain JS, because this reaches into
 * astro:content through lib/inquiries and so cannot be imported by
 * scripts/make-og.mjs, which is run by bare node.
 */
import type { CollectionEntry } from 'astro:content';
import {
  chapterSlug, inquirySlug, type Chapter, type Inquiry,
} from './inquiries';
import { postSlug } from './format';
import { SITE_DESCRIPTION } from './site';
import { stamped } from './og-cards.mjs';

/** Everything renderCard() draws. Anything it grows must be added here. */
export interface Card {
  title: string;
  kicker?: string;
  /* Never optional in practice: the site line is what a piece with nothing of
     its own to say falls back to, so the rule is a line, not a gap. */
  footer: string;
}

/* ---- essays ------------------------------------------------------------ */

/**
 * Takes the frontmatter rather than the entry because the endpoint has to hand
 * this across getStaticPaths as a prop, and props want plain data.
 */
export const essayCard = (data: CollectionEntry<'posts'>['data']): Card => ({
  title: data.title,
  kicker: data.kind === 'case' ? 'Case' : 'Essay',
  /* The piece's own line where it has one. A deck is already the sentence the
     author wrote to introduce this piece; the site line is what to say when
     there is nothing better. */
  footer: data.deck ?? SITE_DESCRIPTION,
});

export const essayCardUrl = (post: CollectionEntry<'posts'>): string =>
  stamped(`/og/essays/${postSlug(post)}.png`, essayCard(post.data));

/* ---- inquiries --------------------------------------------------------- */

/**
 * An inquiry has no deck. What it has is a STANDFIRST — a paragraph, which is
 * three times what fits under the rule. Its first sentence usually stands on
 * its own, so that is used where it is short enough to set at this size, and
 * the site line where it is not. A standfirst chopped mid-clause with an
 * ellipsis reads as a card that ran out of room, which is worse than a card
 * that says something general and finishes.
 */
const opening = (standfirst: string): string | undefined => {
  const first = standfirst.split(/(?<=\.)\s/)[0];
  return first && first.length <= 130 ? first : undefined;
};

/**
 * The kicker names the register and, while the work is unfinished, says so. A
 * card for a work in progress that looks identical to a card for a finished
 * one sets the reader up to arrive at Chapter 3 of 9 expecting an ending —
 * and a card is the one place the pulsing dot cannot travel, so the state has
 * to be carried in words.
 */
export const inquiryCard = (inquiry: Inquiry): Card => ({
  title: inquiry.data.title,
  kicker:
    inquiry.data.status === 'in-progress' ? 'Inquiry · In progress' : 'Inquiry',
  footer: opening(inquiry.data.standfirst) ?? SITE_DESCRIPTION,
});

export const inquiryCardUrl = (inquiry: Inquiry): string =>
  stamped(`/og/inquiries/${inquirySlug(inquiry)}.png`, inquiryCard(inquiry));

/* ---- chapters ---------------------------------------------------------- */

/**
 * The kicker carries the chapter number and the work it belongs to, because a
 * chapter shared on its own is the one page on this site whose title means
 * least without its context — "Dispositions without laws" says nothing until
 * you know it is Chapter 5 of something.
 *
 * The PART IS OMITTED here, though the page itself shows it. A card has one
 * line for context and the reader needs the work's name in it far more than
 * they need the grouping inside that work.
 */
export const chapterCard = (inquiry: Inquiry, chapter: Chapter): Card => ({
  title: chapter.data.title,
  kicker: `Chapter ${chapter.data.number} · ${inquiry.data.title}`,
  footer: chapter.data.deck ?? SITE_DESCRIPTION,
});

export const chapterCardUrl = (inquiry: Inquiry, chapter: Chapter): string =>
  stamped(
    `/og/inquiries/${inquirySlug(inquiry)}/${chapterSlug(chapter)}.png`,
    chapterCard(inquiry, chapter),
  );
