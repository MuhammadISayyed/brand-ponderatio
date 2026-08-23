import { getCollection, type CollectionEntry } from 'astro:content';
import { formatDateline, kindLabel, machineDate, postHref } from './format';
import {
  getInquiries, getChapters, liveChapters, inquiryHref, inquirySlug,
} from './inquiries';

/**
 * One row in a listing, whatever it is a row of.
 *
 * Posts and inquiries are different objects with different metadata — a post
 * has a date, an inquiry has a length and a state — so they are normalised to
 * this shape before they reach the markup. That is what lets one component
 * render the index, the essays page and the inquiries page identically instead
 * of three templates that agree today.
 */
export interface ListItem {
  href: string;
  /** The uppercase label in the margin: "Essay", "Inquiry". */
  label: string;
  /** The line under it: a date, a chapter count. */
  meta: string;
  /** `datetime` for a real date; omitted when meta is not one. */
  datetime?: string;
  title: string;
  deck?: string;
  /**
   * Set only for inquiries. Present because an unfinished work has to declare
   * itself in a listing — see components/StatusBadge.
   */
  status?: 'in-progress' | 'complete';
  /** Newest first for posts; inquiries sort before them. */
  sortKey: number;
}

export async function postItems(): Promise<ListItem[]> {
  const posts = await getCollection('posts', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );

  return posts
    .map((post): ListItem => {
      const { title, deck, date, kind } = post.data;
      return {
        href: postHref(post),
        label: kindLabel(kind),
        meta: formatDateline(date),
        datetime: machineDate(date),
        title,
        deck,
        sortKey: date.getTime(),
      };
    })
    .sort((a, b) => b.sortKey - a.sortKey);
}

/**
 * The shelf. Ordered by when each work was opened — see getInquiries. An
 * inquiry spends months being "recently updated", so the date it BEGAN is the
 * stable fact to sort on.
 *
 * The count is of LIVE chapters, not of everything filed. A reader told an
 * inquiry has nine chapters and finding three is being sold the outline as if
 * it were the work.
 */
export async function inquiryItems(): Promise<ListItem[]> {
  const inquiries = await getInquiries();

  return Promise.all(
    inquiries.map(async (inquiry): Promise<ListItem> => {
      const slug = inquirySlug(inquiry);
      const published = liveChapters(await getChapters(slug));
      return {
        href: inquiryHref(slug),
        // Just the kind, the same way an essay's row says "Essay". The work
        // is named by the title beside it, which is the only name it has.
        label: 'Inquiry',
        meta:
          published.length === 1 ? '1 chapter' : `${published.length} chapters`,
        title: inquiry.data.title,
        deck: inquiry.data.standfirst,
        status: inquiry.data.status,
        sortKey: inquiry.data.started.getTime(),
      };
    }),
  );
}

export type Post = CollectionEntry<'posts'>;
