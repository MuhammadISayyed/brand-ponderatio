// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';

// https://astro.build/config
export default defineConfig({
  // Static output. Deploy target is Cloudflare Pages, which serves the
  // built `dist/` directly — no adapter required.
  output: 'static',

  integrations: [mdx()],

  markdown: {
    // Sätteri is Astro 7's default Markdown/MDX processor. We configure it
    // explicitly so the enabled feature set is a recorded decision rather
    // than an inherited default.
    processor: satteri({
      features: {
        // On by default. Gives tables, footnotes, strikethrough, task lists.
        gfm: true,
        frontmatter: true,

        // OFF by default in Sätteri — we turn it on. Curly quotes, em/en
        // dashes and ellipses are not optional on a typography-led site.
        smartPunctuation: true,

        // Deliberately left off. Each is a syntax surface we do not use, and
        // every one enabled is another way a post can render unexpectedly.
        // Turn one on only when a post actually needs it.
        math: false,
        headingAttributes: false,
        directive: false,
        superscript: false,
        subscript: false,
        wikilinks: false,
        definitionList: false,
      },
    }),
  },

  // Self-hosted via Astro's built-in Fonts API. These are the free shipping
  // faces; see the clearly-marked swap block in src/styles/tokens.css for
  // where the paid Klim replacements would be substituted.
  fonts: [
    {
      // The serif. Body AND display — this is a superfamily, so the title is
      // the same face as the prose at 900 rather than a second design.
      // Registered once and pointed at twice; see --font-serif-display in
      // tokens.css.
      //
      // Weights are exactly what the system asks for and no more:
      //   400  running text, decks, the drop cap
      //   600  --weight-semibold: H2, H3, note and index titles
      //   900  the post title
      // 600 in particular is not optional. A weight the CSS asks for but the
      // config does not load does not fail — the browser silently snaps to the
      // nearest one it has. Omitting 600 renders every H2 at 900.
      provider: fontProviders.google(),
      name: 'Alegreya',
      cssVariable: '--font-body',
      weights: [400, 600, 900],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      // Metadata sans — datelines, labels, captions, sidenotes ONLY.
      // Alegreya Sans is the companion drawn for this job by the same
      // designer, which is why it replaced Inter: a neutral interface face
      // was the one thing in the stack that had not been chosen.
      provider: fontProviders.google(),
      name: 'Alegreya Sans',
      cssVariable: '--font-meta',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
