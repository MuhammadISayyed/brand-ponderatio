# Brand Ponderatio

A publication of essays and groundings. Static Astro, no client framework,
deployed as flat files.

The site is **Brand Ponderatio**; the author is **Muhammad Ibrahim**. The two
are kept apart deliberately — the header carries the publication's emblem, the
articles carry the author's byline.

## The two kinds of thing

**Essays** are standalone arguments. One file, one page, newest first.

**Groundings** are long works, published complete and read in order, divided
into numbered parts. A grounding is not a blog series: it goes up finished, and
its contents page is the argument in outline rather than a list of titles —
each part's `deck` says what that part *establishes*, so a reader can see why
Part III has to follow Part II before reading a word.

Parts are numbered in roman numerals on the page and permanently identified by
their integer `part` field. Numbers must run `1..n` with no gaps; the build
fails loudly if they do not (`src/lib/groundings.ts`).

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
  content/           essays (posts/) and groundings, as MDX
  content.config.ts  the schemas — the only definition of what a post or a part is
  layouts/           BaseLayout (the shell), EssayLayout, PartLayout
  pages/             routes; the grounding spine and part routes are dynamic
  components/        Figure, Sidenote, Cite, Byline, Breadcrumb, EntryList
  lib/               groundings (ordering, numerals), listing, counters, format
  styles/            tokens.css → global.css → article.css, in that order
templates/
  essay.mdx          annotated templates — copy, or use `npm run new`
  grounding-part.mdx
  grounding.md       walkthrough for starting a new grounding
scripts/
  new.mjs            `npm run new -- essay "Title"` — copies a template into place
  make-og.mjs        regenerates public/og.png; run by hand, output committed
```

`tokens.css` is the design system: every colour, size, and space is named
there, and the reasoning is written next to the value rather than in a
document beside it. Read it before changing anything visual.

## Writing something new

```sh
npm run new -- essay     "A system is what it refuses"
npm run new -- grounding "The Dispositional Basis of Demand" --slug=demand
npm run new -- part demand "The quantity and the power"
```

Fills in the slug, the date and the next part number; leaves every judgement to
you. Templates live in `templates/` if you would rather copy by hand. Full
walkthrough in **PUBLISHING.md**.

## Drafts

Set `draft: true` in a file's frontmatter. Drafts render in `dev` and are
filtered out of production builds — see the `import.meta.env.PROD` checks in
`src/lib/listing.ts`, `src/lib/groundings.ts`, and
`src/pages/essays/[...slug].astro`.

## Deploying

Static output, no adapter. Cloudflare Pages serves `dist/` directly:

| Setting       | Value             |
| :------------ | :---------------- |
| Build command | `npm run build`   |
| Output dir    | `dist`            |
| Node version  | `22.12` or newer  |

**Not yet done:** `site` is not set in `astro.config.mjs`. Until it is, the
canonical link and the Open Graph URL/image tags are deliberately suppressed
(see the comment in `src/layouts/BaseLayout.astro`) rather than emitted
pointing at localhost, and there is no sitemap or feed. Setting `site` to the
real domain turns those meta tags on with no further edit.
