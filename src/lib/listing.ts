import { getCollection, type CollectionEntry } from 'astro:content';
import { formatDateline, kindLabel, machineDate, postHref } from './format';
import { GROUNDINGS, groundingSlugs, getParts, groundingHref } from './groundings';

/**
 * One row in a listing, whatever it is a row of.
 *
 * Posts and groundings are different objects with different metadata — a post
 * has a date, a grounding has a length — so they are normalised to this shape
 * before they reach the markup. That is what lets one component render the
 * index, the essays page and the groundings page identically instead of three
 * templates that agree today.
 */
export interface ListItem {
  href: string;
  /** The uppercase label in the margin: "Essay", "Grounding", a note's ref. */
  label: string;
  /** The line under it: a date, a part count. */
  meta: string;
  /** `datetime` for a real date; omitted when meta is not one. */
  datetime?: string;
  title: string;
  deck?: string;
  /** Newest first for posts; groundings sort after them. */
  sortKey: number;
}

export async function postItems(): Promise<ListItem[]> {
  const posts = await getCollection('posts', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );

  return posts
    .map((post): ListItem => {
      const { title, deck, date, kind, ref } = post.data;
      return {
        href: postHref(post),
        // A note carries its reference code, which identifies it better than
        // its kind does. Everything else carries its kind.
        label: kind === 'note' && ref ? ref : kindLabel(kind),
        meta: formatDateline(date),
        datetime: machineDate(date),
        title,
        deck,
        sortKey: date.getTime(),
      };
    })
    .sort((a, b) => b.sortKey - a.sortKey);
}

export async function groundingItems(): Promise<ListItem[]> {
  return Promise.all(
    groundingSlugs().map(async (slug): Promise<ListItem> => {
      const work = GROUNDINGS[slug];
      const parts = await getParts(slug);
      return {
        href: groundingHref(slug),
        label: 'Grounding',
        meta: `${parts.length} parts`,
        title: work.title,
        deck: work.abstract,
        sortKey: 0,
      };
    }),
  );
}

export type Post = CollectionEntry<'posts'>;
