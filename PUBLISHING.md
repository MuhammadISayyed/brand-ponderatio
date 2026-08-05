# Publishing

Everything you need to go from a blank file to a page on the live site. Written
to be read once end to end, then used as a reference.

**Contents**

1. [The two kinds of thing you can publish](#1-the-two-kinds-of-thing-you-can-publish)
2. [The daily loop](#2-the-daily-loop)
   - [Templates — the fast path](#2a-templates--the-fast-path)
3. [Publishing an essay](#3-publishing-an-essay)
4. [Publishing a grounding](#4-publishing-a-grounding)
5. [Writing: what the Markdown does and does not do](#5-writing-what-the-markdown-does-and-does-not-do)
6. [The three components](#6-the-three-components)
7. [Visualizations and animation](#7-visualizations-and-animation)
8. [Drafts](#8-drafts)
9. [Shipping to the web](#9-shipping-to-the-web)
10. [Checklists](#10-checklists)
11. [When something breaks](#11-when-something-breaks)
12. [Deliberately not automated](#12-deliberately-not-automated)

---

## 1. The two kinds of thing you can publish

The site holds exactly two, and the difference is not length.

**An essay** is a standalone argument. It is entered directly, it stands alone,
and it is complete on its own page. One `.mdx` file in `src/content/posts/`.
Lives at `/essays/<slug>/`.

**A grounding** is a long work, published *complete*, read *in order*, divided
into numbered parts. A grounding is **not** a blog series — you do not publish
Part I and then write Part II in public. It goes up finished. That is what makes
its part numbers permanent, and therefore citable. One folder in
`src/content/groundings/`, one `.mdx` file per part. Lives at
`/groundings/<work>/` with parts at `/groundings/<work>/<part-slug>/`.

If you are unsure which you are writing: if a reader could start at section 3
and lose nothing, it is an essay.

There is no third register. There used to be one ("notes" — filed sheets with
reference codes and a superseding chain) and it was removed along with all the
machinery that policed it. Do not add one back without deciding what it is *for*
first.

---

## 2. The daily loop

### Start the server

Always in background mode:

```sh
astro dev --background
```

It runs at **http://localhost:4321** and stays up across terminal sessions.

```sh
astro dev status    # is it running, and on what pid
astro dev logs      # what it has said — including build errors
astro dev stop      # shut it down
```

### Then

1. Create or edit a `.mdx` file under `src/content/`.
2. The browser reloads on save. You do not need to restart anything.
3. When the page looks right, commit and push (§9).

### What to do when the browser shows an error overlay

Read it — the schema errors on this site are written to tell you what to do, not
just what is wrong. `astro dev logs` has the same message with more stack.

If the page is wrong in a way the overlay does not explain, and *especially* if
you deleted or renamed a content file, jump to §11 — there is a stale-cache
failure mode that looks like a code bug and is not.

---

## 2a. Templates — the fast path

Three annotated templates live in `templates/`, outside `src/content/` so the
collections never try to load them:

| File | What it is |
| :--- | :--- |
| `templates/essay.mdx` | A complete essay: every frontmatter field with its rules, and demo prose exercising all three components |
| `templates/grounding-part.mdx` | One part of a grounding |
| `templates/grounding.md` | The walkthrough for a **new work** — registry entry, folder, first parts |

Copy them by hand, or let the script do the mechanical parts:

```sh
npm run new -- essay     "A system is what it refuses"
npm run new -- grounding "The Dispositional Basis of Demand" --slug=demand
npm run new -- part demand "The quantity and the power"
```

What the script fills in: the slug, today's date, the next part number, the
`NN-` filename prefix. What it does **not** fill in: anything that is a
judgement — the deck, the sources, the argument. A field silently filled with a
plausible default is worse than an empty one you have to look at.

Two things worth knowing:

- **Every template ships `draft: true`.** A duplicated template cannot publish
  itself by accident. Set it false when the piece is ready.
- **`--slug=` overrides the derived name.** "The Dispositional Basis of Demand"
  derives a 33-character URL segment; the one you want is `demand`.
- The generated files **render immediately** — the demo prose and the demo
  `sources` entry are a matched pair, because the build fails on a citation
  with no source and on a source with no citation. Delete them together.

`npm run new -- grounding` creates the folder and *prints* the registry entry
for you to paste into `src/lib/groundings.ts`. It does not patch the file:
editing TypeScript by regex is how a script eventually corrupts one, and the
paste makes you look at the abstract, which is the one field nobody should be
able to skip.

The rest of this section explains what the templates contain, which is what you
need when editing rather than creating.

---

## 3. Publishing an essay

### Step 1 — make the file

```
src/content/posts/a-system-is-what-it-refuses.mdx
```

The filename becomes the URL: `/essays/a-system-is-what-it-refuses/`. Lowercase
words, single hyphens. Flat — no subfolders in `posts/`.

### Step 2 — the frontmatter

Everything between the opening and closing `---`. This is a template with every
field; the required ones are marked.

```mdx
---
title: A system is what it refuses          # REQUIRED. Sentence case, no full stop.
slug: what-a-system-refuses                 # optional — see below
date: 2026-07-30                            # REQUIRED. YYYY-MM-DD, unquoted.
updated: 2026-07-31                         # optional
kind: essay                                 # REQUIRED. `essay` or `case`.
deck: >                                     # optional standfirst
  Design systems ship as catalogues of what you may do. The ones that survive
  are catalogues of what you may not — and the difference is not a matter of
  tone.
tags:                                       # optional
  - design systems
  - constraint
sources:                                    # optional — see §6
  - key: alexander
    text: 'Alexander, C. (1964). Notes on the Synthesis of Form. Harvard University Press.'
  - key: brand
    text: 'Brand, S. (1994). How Buildings Learn. Viking.'
    background: true
draft: false                                # optional, defaults false
---
```

Field by field:

- **`title`** — required, must not be empty.
- **`slug`** — optional. Leave it off and the URL comes from the filename. Set
  it when the filename and the URL should differ: a long title, a renamed file,
  or a URL that has to stay put after you rename the file. Must be lowercase
  words separated by single hyphens, no leading/trailing/doubled hyphens.
- **`date`** — required. Write it bare (`2026-07-30`), not in quotes; quoting it
  makes it a string and the schema will reject it. This is when it went up.
- **`updated`** — optional, and **keep it optional**. An "updated" date on a
  piece that only had typos fixed tells the reader something false. Set it when
  the *argument* moved. It must not be earlier than `date` — the build fails
  with both dates printed if it is.
- **`kind`** — required, `essay` or `case`. It sets the label in the margin of
  the listing. It no longer changes which fields are legal.
- **`deck`** — optional standfirst, rendered large and italic under the title,
  and used as the meta description and the OG description for that page. A
  judgement about a particular piece, not a slot every piece must fill. Use the
  `>` block form above for anything over a line.
- **`tags`** — optional, defaults to `[]`. Currently they are stored but there
  are no tag pages; adding them is a real feature, not a config flag.
- **`sources`** — optional. See §6, and note the build *fails* on an uncited
  source or a citation with no source.
- **`draft`** — see §8.

### Step 3 — imports

If you use any component, import it at the top of the body — after the closing
`---`, before the prose. Paths are relative to the file:

```mdx
import Sidenote from '../../components/Sidenote.astro';
import Cite from '../../components/Cite.astro';
import Figure from '../../components/Figure.astro';
```

(From a **grounding part**, one level deeper: `'../../../components/…'`.)

Import only what you use.

### Step 4 — write

Prose is ordinary Markdown. `##` for section headings — **not `#`**, the page
title is already the `<h1>`.

### Step 5 — check it

Open `http://localhost:4321/essays/<slug>/`. Check the byline band, the
dateline, the sources list at the foot, and that every sidenote sits beside the
paragraph that introduces it.

---

## 4. Publishing a grounding

Three things must agree, and the build checks all three.

### Step 1 — register the work

`src/lib/groundings.ts`. The title and abstract of a grounding live **in code**,
not in frontmatter, because they belong to the whole work and there is no file
that *is* the work:

```ts
export const GROUNDINGS: Record<string, Grounding> = {
  demand: {
    title: 'The Dispositional Basis of Demand',
    abstract:
      'Demand is treated in economics as a quantity — something read off a schedule, revealed by what was bought. This grounding argues that it is a disposition: a causal power that exists whether or not it is exercised…',
  },
};
```

The **key** (`demand`) is the URL segment and must match the folder name exactly.
The `abstract` is one paragraph, shown on the spine page above the contents.

### Step 2 — make the folder and the parts

```
src/content/groundings/demand/
  01-the-quantity-and-the-power.mdx
  02-dispositions-are-not-conditionals.mdx
  03-powers-compose.mdx
```

The `01-` prefix is **only** so the files sort in your editor. It is stripped
from the URL (`/groundings/demand/the-quantity-and-the-power/`) and it is *not*
what orders the argument — the `part` field is.

### Step 3 — part frontmatter

```mdx
---
title: The quantity and the power           # REQUIRED
part: 1                                     # REQUIRED. 1-based, contiguous, unique.
date: 2026-07-31                            # REQUIRED
slug: the-quantity-and-the-power            # optional
updated: 2026-08-02                         # optional
deck: >                                     # optional but strongly wanted
  Establishes the target — that demand as economics uses it names an observed
  quantity, while the concept doing the explanatory work underneath it is not a
  quantity at all.
sources:                                    # optional
  - key: cartwright
    text: "Cartwright, N. (1989). Nature's Capacities and Their Measurement. Oxford University Press."
draft: false
---
```

Note there is **no `kind`** on a part, and **no `tags`**.

**The `deck` matters more here than anywhere else.** The contents page is the
argument in outline: each part's deck says what that part *establishes*, so a
reader can see why Part III has to follow Part II before reading a word. Leave
it off and the contents falls back to a bare title, and the page stops doing its
job. Write what the part establishes, not what it is about.

### Step 4 — the numbering rules the build enforces

- Parts must run **1..n with no gaps**. Expected 3 and found 4? Build fails. A
  gap means a reader hits a dead end and a citation points at nothing.
- **No two parts may share a number.** Part VII must mean one thing forever.
- A folder that is not in `GROUNDINGS` fails with a message naming the folder
  and listing the known groundings.

To insert a new part into a finished work you must renumber every part after it.
The URLs survive this — they are slugs, not numbers — but the roman numerals in
every existing citation of those parts do not. Think before inserting.

Roman numerals are rendered from the `part` integer. You never type "IV".

---

## 5. Writing: what the Markdown does and does not do

Configured explicitly in `astro.config.mjs` so the feature set is a recorded
decision rather than an inherited default.

**On:**

- **GFM** — tables, footnotes, strikethrough, task lists.
- **Frontmatter**.
- **Smart punctuation** — you type `"quotes"`, `--`, `---` and `...`, and you get
  curly quotes, en dashes, em dashes and ellipses. Not optional on a
  typography-led site. You can also just type the real characters.

**Off, deliberately** — each is a syntax surface that is another way a post can
render unexpectedly. Turn one on only when a post actually needs it, and turn it
on in the config with a note saying why:

`math`, `headingAttributes`, `directive`, `superscript`, `subscript`,
`wikilinks`, `definitionList`.

**Conventions:**

- Headings: `##` and `###`. Never `#`.
- Tables: GFM pipe tables work and are styled. Keep them small — a table with
  more than about five columns wants to be a figure.
- Blockquotes: `>`. Styled as a pull quote.
- Links: ordinary `[text](url)`. External links get no special treatment.
- Emphasis: `*italic*` and `**bold**`. Both exist in the working face. The
  document face (titles) has *no italic and no bold* — which is why no running
  text is ever set in it.

---

## 6. The three components

### `<Sidenote>` — a margin note

Authored inline, at the point it annotates, with **no space** before it:

```mdx
…there is a useful distinction to borrow here.<Sidenote>Juarrero's terms are
*context-free* and *context-sensitive* constraint. I use "governing" and
"enabling" because they are easier to say in a code review.</Sidenote> Some
constraints reduce…
```

- Numbered automatically, restarting at 1 on each page.
- The marker and the note are a linked pair — click either to reach the other.
- On a wide screen it sits in the margin; on a phone it drops inline.
- Attach it to the *end* of the sentence it qualifies, after the full stop.

### `<Cite>` — a citation on a name already in the sentence

```mdx
<Cite source="alexander">Alexander</Cite> made the general version of this
point sixty years ago…
```

There is no superscript number and no marker. Essays here cite by **naming the
author in the prose** — `<Cite>` just connects that name to its entry at the
foot, and the entry links back to every place it was used.

`source` must match a `key` in that file's `sources` frontmatter. Two rules are
enforced at build time and both stop the build:

- **A `<Cite>` whose key matches nothing** — a dangling citation renders a dead
  link.
- **A declared source that is never cited** — "an uncited source looks like
  evidence and is not." If a work genuinely informed the piece without
  supporting a particular sentence, mark it `background: true` and it is exempt.
  Otherwise cite it or delete it.

Source keys must be lowercase letters, digits and hyphens, starting with a
letter: `brand`, `alexander-1964`. Duplicate keys inside one file are rejected.

### `<Figure>` — a numbered figure with a caption

```mdx
<Figure>
  <svg viewBox="0 0 512 190" role="img" aria-labelledby="fig-1-title">
    <title id="fig-1-title">Plain-language description of what is drawn.</title>
    …
  </svg>
  <Fragment slot="caption">
    A catalogue enumerates; a constraint composes.
  </Fragment>
</Figure>
```

- Numbered automatically, restarting at 1 per page. **Never type "Fig. 1" into
  the caption** — the component writes it, and it renumbers itself when you
  insert a figure above.
- The caption goes in `<Fragment slot="caption">`. Anything else inside
  `<Figure>` is the artwork.
- The caption should say **what the diagram argues**, not what it depicts.
- Optional `id` prop if you need to link to a specific figure.

---

## 7. Visualizations and animation

This is the part with the most rules, because a diagram is where a
typography-led site is easiest to wreck.

### 7.1 How to ask me for one

You do not need to write SVG. Ask in prose, and include these six things — the
first is the one that actually determines whether the diagram is any good:

1. **The claim it must make.** Not the subject — the claim. "Twelve options that
   compose into five" is a claim. "A diagram about constraints" is not, and I
   will come back and ask.
2. **The elements and their relations.** What are the nodes, what connects to
   what, what is nested in what, what precedes what.
3. **How many categories, and what each is called.** Hard ceiling of **three**
   (§7.3). If you need four, that is information: the diagram is carrying two
   arguments and wants to be two diagrams. Give me the *name* of each category
   as well as the count — every category is labelled in the drawing, never
   distinguished by colour alone (§7.3a), so an unnamed category is a diagram
   I cannot draw.
4. **The one load-bearing element**, if there is one — it gets the accent colour
   and nothing else does.
5. **What should move, and what the movement means.** "The links draw in one at
   a time, so you see the structure assemble rather than arrive" is a reason.
   "Make it animated" is not, and motion without a reason is the thing this
   site's rules exist to prevent.
6. **The caption**, or a rough version of it. If you cannot write the caption,
   the diagram is not ready to be drawn.

Say where it goes in the prose, and whether the text refers to it ("as Fig. 2
shows") or stands beside it.

A good request looks like:

> Between "The failure modes matter" and the next heading, a figure: on the left
> twelve unconnected nodes, on the right five nodes joined into a structure with
> the centre one load-bearing. Claim: a catalogue enumerates, a constraint
> composes. Two labels, "Twelve options" and "Five options that compose". On
> scroll-in, the left grid fades up first, then the links draw, then the centre
> node takes the accent — so the composing happens in front of the reader.
> Caption: "The left side has more available to it and can say less with any of
> it."

### 7.2 Geometry — the one number that matters

Draw at **`viewBox="0 0 512 …"`**. 512 is the width of `--grid-main-col`, the
prose column, so the diagram renders **1:1**: a 1.25px stroke is 1.25px on
screen and a 13px label is 13px.

Get this wrong and everything degrades quietly. A viewBox 640 wide scales those
same strokes to sub-pixel and the labels to about 9px, and the diagram looks
thin and unreadable without anything obviously being broken.

Height is whatever the drawing needs. Diagrams are flush with the prose column,
not wider than it: a diagram wider than the column it argues inside asks the
reader to leave the argument to look at it.

**`--grid-main-col` has moved three times.** A diagram drawn 1:1 is only 1:1
until the column moves, so if the grid ever changes, the viewBox widths in
existing figures have to be revisited.

### 7.3 Colour — the rule that is enforced rather than advised

Use the CSS custom properties. **Never literal hex values in a diagram**:

| Token | Use |
| :--- | :--- |
| `--diagram-node-fill` | node interiors (paper) |
| `--diagram-node-stroke` | node outlines and links |
| `--diagram-stroke-weight` | every stroke, `1.25px` |
| `--diagram-node-radius` | `4px` |
| `--diagram-label-size` | label type, the apparatus size |
| `--diagram-label-color` | label ink |
| `--diagram-accent` | **the single load-bearing element, and nothing else** |
| `--diagram-2`, `--diagram-3` | the other two categories, inside diagrams only |

Three accents exist. **There is no fourth, and adding one is not the fix** — if
a diagram needs a fourth category, the diagram is wrong; split it into two.

The house style also forbids stroke weight, dashes and fill patterns as
distinguishing channels. Applied via shared CSS to all diagrams, never per
diagram.

### 7.3a Colour is never the only channel — label directly

The three diagram colours separate by hue and almost nothing else: measured
against each other, cinnabar-to-olive is **1.07:1**, and under simulated
deuteranopia it stays 1.07:1. A reader with red-green colour blindness sees one
colour where the diagram means two.

The resolution, recorded in `tokens.css`:

> **Any distinction a colour makes must also be made by a label in the drawing,
> next to the thing it names.**

Not a legend keyed by swatch — a reader must never have to hold a
colour-to-meaning mapping in their head and carry it back into the figure. Name
the group, the axis, the load-bearing node, in the drawing, where it sits.

Re-tinting the palette was the obvious alternative and it cannot carry the
weight: the paper is light, so every diagram colour must stay dark enough to
clear 3:1 against it, which caps the achievable value steps at about 1.9:1 —
visible, but not decisive, and it would leave the appearance of a fix.

This is also why the three-colour ceiling is not merely a palette limit. Three
categories is about the most a diagram can name directly before the labels
become the clutter; the ceiling and the labelling rule are one constraint seen
from two sides.

**The test at review:** cover the diagram's colour and ask whether it still
argues what the caption says it argues. If it does not, what is missing is the
labelling, not the contrast.

Nothing in the build can check that a label names the right node, so unlike the
citation and part-numbering rules, this one is held by review rather than by a
thrown error. Worth knowing which kind of rule you are holding.

### 7.4 Accessibility

Every diagram is `role="img"` with a `<title>` referenced by `aria-labelledby`,
and the title is a plain-language description of what is drawn — a reader who
cannot see it should get the same claim.

### 7.5 Animation — how it actually works here

GSAP is the animation library, with ScrollTrigger, DrawSVG and MorphSVG.
Everything goes through **one entry point**, `src/lib/gsap.ts`, so plugin
registration happens exactly once and no diagram can forget it.

Two hard rules, both already written into that file:

**It is client-only.** DrawSVGPlugin and MorphSVGPlugin touch the DOM at import
time, so `lib/gsap.ts` may only be pulled in from a `<script>` tag inside an
`.astro` component — **never** from component frontmatter, which runs during the
static build and will crash it.

**Reduced motion is not "skip the animation".** The contract is: *render the
finished end state immediately*. A reader who has asked for reduced motion still
sees the fully built diagram — they just do not see it build. `lib/gsap.ts`
exports `prefersReducedMotion()` and every timeline is wrapped in a check
against it.

On licensing: as of GSAP 3.13 every plugin ships in the public `gsap` package,
including the formerly Club-only ones used here. There is no `.npmrc`, no auth
token and no `npm.greensock.com` registry in this project, and none should be
added.

### 7.6 On the `client:visible` advice you were given

Your friend's instinct is right and the mechanism does not apply to this site.
I checked before acting.

`client:load` and `client:visible` are **hydration directives for UI framework
components** — React, Vue, Svelte, Preact, Solid. This project has none of them:
`astro.config.mjs` has a single integration, `mdx()`, and there is not one
`client:` directive anywhere in `src/`. Astro components cannot be islands, so
there is no `client:load` here to downgrade.

What the build actually ships today is **16KB of JavaScript, total** — the
view-transition ClientRouter, and nothing else.

The real mechanism, and the thing to hold onto:

- A `<script>` inside an `.astro` component is bundled by Astro as a deferred
  module and is included **only on pages that use that component**. Per-page
  code splitting is the default; a diagram's JS never lands on a post without a
  diagram.
- So GSAP will not be "shipped on every post". It will be shipped on posts with
  diagrams — which is the right answer to your friend's actual worry.
- The remaining lever, and the one worth using, is **`import()` inside a
  ScrollTrigger or IntersectionObserver callback**, so GSAP downloads when a
  diagram approaches the viewport rather than at page load. That is the true
  equivalent of `client:visible` for this architecture, and it is what I will
  use when the first animated diagram lands.

Net: keep the advice's *goal* (nothing heavy on first paint), discard its
*mechanism* (there are no islands to configure).

---

## 8. Drafts

```yaml
draft: true
```

- **In `dev`:** drafts render normally, in listings and at their own URL. This is
  how you preview.
- **In a production build:** they are filtered out entirely — no page, no listing
  row, no URL.

Enforced in three places, all keyed on `import.meta.env.PROD`:
`src/lib/listing.ts`, `src/lib/groundings.ts`, `src/pages/essays/[...slug].astro`.

Two things to know:

- A draft **part** is removed from its grounding, which can break the
  contiguous-numbering rule and fail the production build. Drafting Part II of
  three means parts 1 and 3 remain, and the build correctly refuses. Draft the
  whole work, or none of it — which is what "published complete" means anyway.
- To see the site exactly as the public will, run a production build (§9.1).
  `npm run dev` will never show you the drafts-removed state.

---

## 9. Shipping to the web

### 9.1 Check the build first

```sh
npm run build      # → dist/
npm run preview    # serve dist/ exactly as it will be served
```

`npm run build` is the same command Cloudflare will run. If it fails locally it
will fail there — but it is much quicker to read the error here.

### 9.2 Commit and push

```sh
git status
git add -A
git commit -m "Add: <title of the piece>"
git push
```

Every push to the default branch triggers a deploy. Pushes to any other branch
produce a **preview deployment** at its own URL — this is the good way to look
at something on a real device before it is public.

### 9.3 First-time Cloudflare Pages setup

Once, and it takes about five minutes.

1. Push this repository to GitHub.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**, and authorise the repo.
3. Build settings:

   | Setting | Value |
   | :--- | :--- |
   | Framework preset | Astro (or None) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | *(leave blank)* |

4. Add an environment variable **`NODE_VERSION` = `22.12.0`**. `package.json`
   requires Node ≥ 22.12; Cloudflare's default is older and the build will fail
   in a way that does not obviously say "Node version".
5. Deploy. You get `<project>.pages.dev` immediately.
6. Custom domain: project → **Custom domains** → add it. If the domain is
   already on Cloudflare DNS this is two clicks; if not, you will be given
   nameservers to point at.

### 9.4 `site`, and everything that hangs off it

Set, as of 5 August 2026:

```js
export default defineConfig({
  site: 'https://brandponderatio.com',   // no trailing slash, no www
  output: 'static',
  …
});
```

**If the domain ever moves, this is the only line that has to change** — plus
the `Sitemap:` line in `public/robots.txt`, which cannot be relative.

It is load-bearing. `BaseLayout.astro` gates the canonical link and the
`og:url` / `og:image` tags on it, and emits nothing rather than emit them
pointing at `localhost` — a canonical naming localhost is not a shrug, it is an
instruction to de-index.

It is also what makes the sitemap and the feed possible — both are generated
on every build and both need absolute URLs:

- **`/sitemap-index.xml`** — from `@astrojs/sitemap`, built from the routes, no
  maintenance. `public/robots.txt` points at it.
- **`/rss.xml`** — `src/pages/rss.xml.ts`. Essays are one item each; each
  **grounding is one item pointing at its spine**, not one per part. A work
  that publishes complete should reach a subscriber once, at the front door
  where the argument's shape is visible — five items for one work would
  announce it five times and land the reader in Part I with no outline. A
  grounding has no date of its own, so it is dated by its most recently dated
  part. Drafts are excluded by the same `PROD` filter as everywhere else.

### 9.5 The share card

`public/og.png` is what every link to the site unfurls as — 1200×630, committed
to the repo. Regenerate it only when the identity changes:

```sh
node scripts/make-og.mjs
```

The favicons come from the same mark, via `npm run icons`
(`scripts/make-icons.mjs`) — `favicon.ico` at 16/32/48, `favicon-32.png`, and
`apple-touch-icon.png` at 180. Run it if the emblem ever changes.

Both are hand-run scripts rather than build steps on purpose: they would
otherwise put a rasteriser on the critical path of a 2-second build to produce
byte-identical files every time. The script's header explains why the card is set
in Georgia rather than Goudy (fontconfig cannot see Astro's `.woff2` files) and
what to change if you ever install the real face.

### 9.6 Rolling back

Cloudflare keeps every deployment. Project → **Deployments** → find the good one
→ **Rollback**. That is faster and safer than a revert commit when something is
wrong on the live site; do the git revert afterwards, calmly.

---

## 10. Checklists

### Before you publish a piece

- [ ] `npm run build` passes
- [ ] Every `<Cite source="…">` has a matching `sources` entry, and every source
      is cited or marked `background: true`
- [ ] No hand-typed "Fig. 1" anywhere in a caption
- [ ] Every diagram is `viewBox="0 0 512 …"`, uses only `--diagram-*` colours,
      and has a `<title>`
- [ ] Cover the colour in every diagram — does it still argue what the caption
      says? Every category is labelled in the drawing (§7.3a)
- [ ] `deck` present (essay: if it earns it; grounding part: yes)
- [ ] `updated` set only if the *argument* moved
- [ ] `draft: false` (or the field removed)
- [ ] Read it once on a phone-width window — sidenotes drop inline, the margin
      column collapses at 56.25em

### Before the first deploy

- [ ] Repo pushed to GitHub
- [ ] Cloudflare Pages project created, `NODE_VERSION` set
- [ ] `site` set in `astro.config.mjs`
- [ ] Custom domain added and resolving
- [ ] `/sitemap-index.xml` and `/rss.xml` load on the deployed site
- [ ] Paste a link into a chat app and confirm the card renders

---

## 11. When something breaks

### "Unexpected error while rendering → \<some-file-you-deleted\>"

**This is the one that will waste your afternoon.** Astro caches the content
collection in two places, and deleting or renaming an `.mdx` file leaves both
stale. The build then tries to render a file that no longer exists and throws a
`UnknownContentCollectionError` with a stack trace pointing into
`dist/.prerender/…`, which looks like a bug in the site and is not.

```sh
rm -f .astro/data-store.json node_modules/.astro/data-store.json
npm run build
```

Note it is **both** paths — clearing only `.astro/` is not enough, which is the
part that makes this confusing. Restart the dev server afterwards.

### "The collection 'posts' does not exist or is empty"

Printed during the build while the site has no content. Harmless, and it
disappears with the first published file.

### A schema error naming a field

Read it. They are written to say what to do. The common ones:

- `date` quoted as a string → unquote it.
- `updated` before `date` → one of the two is a typo; both are printed.
- `slug must be lowercase words separated by single hyphens` → no capitals, no
  underscores, no doubled hyphens.
- `duplicate source key "x"` → two entries claim one key; `<Cite>` would be
  ambiguous.

### "…sits in a folder named 'x', which is not a grounding"

You made a folder under `groundings/` without registering it. Add it to
`GROUNDINGS` in `src/lib/groundings.ts`, or move the file. The message lists the
groundings it does know about.

### "parts must run 1..n with no gaps"

A missing or duplicated `part` number — or a part you set `draft: true` on,
which removes it from the sequence in a production build. §4, §8.

### The dev server will not start / port is taken

```sh
astro dev status
astro dev stop
astro dev --background
```

### A font looks wrong, or the title flashes

Both faces are preloaded and self-hosted through Astro's Fonts API. If you
changed anything in the `fonts` block of `astro.config.mjs`, delete
`node_modules/.astro/fonts` and rebuild.

---

## 12. Deliberately not automated

Things that look like gaps and are choices. Each can be changed — but change it
knowingly.

- **No tag pages**, though posts carry `tags`.
- **No comments, no analytics, no cookie banner.** Nothing on the site collects
  anything, which is why there is nothing to consent to.
- **The OG card is generated by hand** (§9.5).
- **`tokens.css` is the design system** — every colour, size and space is named
  there with the reasoning next to the value. Read it before changing anything
  visual. Rules in it that say "enforced, not advisory" are enforced by the
  build, not by good intentions.
