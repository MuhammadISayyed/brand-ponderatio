# Brand Ponderatio

A publication of essays and inquiries. Static Astro, no client framework,
deployed as flat files.

The site is **Brand Ponderatio**; the author is **Muhammad Ibrahim**. The two
are kept apart deliberately — the header carries the publication's emblem, the
articles carry the author's byline.

## The two kinds of thing

**Essays** are standalone arguments. One file, one page, newest first.

**Inquiries** are long works — one problem worked until it yields, published a
chapter at a time over weeks or months. An inquiry is not a finished book
dropped in one piece, and it is not a blog series either: it has a fixed shape
declared up front, and it fills in. Its contents page is the argument in outline
rather than a list of titles — each chapter's `deck` says what that chapter
*establishes*, so a reader can see why Chapter 6 has to follow Chapter 5 before
reading a word, including for chapters not yet written.

Three levels; only the two inner ones are numbered, so the hierarchy reads
without any of them competing with the work's name:

| Level | Numeral | Renders as | Has a page? |
| :--- | :--- | :--- | :--- |
| Inquiry | none — the title | `Demand` | yes |
| Part | Spelled out | `Part Two` | no — display only |
| Chapter | Arabic | `Chapter 5` | yes |

An inquiry is cited by name; a chapter is cited by position within one. The
shelf orders itself by `started`, so there is no sequence to keep by hand.

Parts are an optional grouping layer; omit them and the contents degrades to a
flat run of chapters with no trace of where the headings would have gone.
Chapter numbers are continuous across parts and must run `1..n` with no gaps —
the build fails loudly if they do not (`src/lib/inquiries.ts`).

The inquiry's own file is its **introduction** — there is no separate route for
one. It renders on the contents page under the title, folded, with the opening
visible and the rest behind a control. The fold is applied by script to a page
that ships open, so a failed script leaves the whole introduction rather than a
dead button.

An inquiry carries a `status`. While it is `in-progress` a quietly pulsing mark
sits beside it wherever it is listed — the only autonomous motion on the site,
admitted under a written amendment in `tokens.css` §8.

## Running it

Requires Node ≥ 22.12.

```sh
npm install
npm run dev      # localhost:4321
npm run build    # → dist/
npm run preview  # serve the build
```

The dev server also runs detached, which is how it is usually driven here:

```sh
astro dev --background
astro dev status | astro dev logs | astro dev stop
```

## Layout

```
src/
  content/           essays (posts/), inquiries/ and chapters/, as MDX
  content.config.ts  the schemas — the only definition of what a post or a chapter is
  layouts/           BaseLayout (the shell), EssayLayout, ChapterLayout
  pages/             routes; the inquiry contents and chapter routes are dynamic
  components/        Figure, Sidenote, Cite, Byline, Breadcrumb, EntryList, StatusBadge
  lib/               inquiries (ordering, numerals, validation), listing, counters, format
  styles/            tokens.css → global.css → article.css, in that order
templates/
  essay.mdx          annotated templates — copy, or use `npm run new`
  inquiry.mdx        the work itself, and the body that becomes its front matter
  chapter.mdx        one chapter of an inquiry
scripts/
  new.mjs            `npm run new -- essay "Title"` — copies a template into place
  make-og.mjs        `npm run og` — regenerates public/og.png, output committed
  make-icons.mjs     `npm run icons` — favicons from the emblem, output committed
functions/
  _middleware.js     the only server-side code: redirects the pages.dev host
```

`tokens.css` is the design system: every colour, size, and space is named
there, and the reasoning is written next to the value rather than in a
document beside it. Read it before changing anything visual.

## Writing something new

```sh
npm run new -- essay   "A System Is What It Refuses"
npm run new -- inquiry "Demand"
npm run new -- chapter demand "The Quantity and the Power"
```

Fills in the slug, the date and the next inquiry or chapter number; leaves every
judgement to you. Templates live in `templates/` if you would rather copy by hand. Full
walkthrough in **PUBLISHING.md**.

## Drafts

Set `draft: true` in a file's frontmatter. Drafts render in `dev` and are
filtered out of production builds — see the `import.meta.env.PROD` checks in
`src/lib/listing.ts`, `src/lib/inquiries.ts` (`isLive`), and
`src/pages/essays/[...slug].astro`.

A drafted **chapter** is the deliberate exception: it keeps its number so the
sequence never breaks, and shows on the contents page greyed and unlinked. It
gets no page, no card and no feed entry until published. That is what lets a
long work go up one chapter at a time.

## Deploying

Static output, no adapter. Cloudflare Pages serves `dist/` directly:

| Setting       | Value             |
| :------------ | :---------------- |
| Build command | `npm run build`   |
| Output dir    | `dist`            |
| Node version  | `22.12` or newer  |

Live at **https://brandponderatio.com**, set as `site` in `astro.config.mjs`.
That one line is what makes the canonical link, the Open Graph URL and image,
the sitemap and the feed possible — all four need an absolute origin. If the
domain ever moves, it is the only line that has to change.

Generated automatically on every build:

| Path | What |
| :--- | :--- |
| `/sitemap-index.xml` | Built from the routes; referenced by `robots.txt` |
| `/rss.xml` | Essays, plus one item per published chapter, tagged with its inquiry |
| `/inquiries/<work>/rss.xml` | One feed per inquiry |
