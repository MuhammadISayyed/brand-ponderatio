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
    // ---- SPECIMEN ONLY -----------------------------------------------------
    // Candidates under evaluation on /specimen. Delete these entries along
    // with that page once the decision is made, or promote the winners.
    {
      // Title candidate. ONE weight, no bold, no italic — verified against
      // the Google API, which 400s on any other request. Fine for a title;
      // see the specimen page for what it costs a note.
      provider: fontProviders.google(),
      name: 'Goudy Bookletter 1911',
      cssVariable: '--font-goudy',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      // Body candidate — geometric, Futura lineage.
      provider: fontProviders.google(),
      name: 'Jost',
      cssVariable: '--font-jost',
      weights: [400, 500, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      // Body candidate — humanist, drawn for extended text.
      provider: fontProviders.google(),
      name: 'Source Sans 3',
      cssVariable: '--font-source-sans',
      weights: [400, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      // Body candidate — geometric, Metropolis lineage. Not on Google Fonts
      // or Fontsource, so the files are vendored in src/assets/fonts under
      // OFL, with the licence alongside them as that licence requires. The
      // upstream repo is archived; the licence is what makes that survivable.
      provider: fontProviders.local(),
      name: 'Clarity City',
      cssVariable: '--font-clarity',
      // Local families declare their files under `options.variants`, not as
      // weights/styles like a remote provider.
      options: {
        variants: [
          {
            weight: 400,
            style: 'normal',
            src: ['./src/assets/fonts/clarity-city/ClarityCity-Regular.woff2'],
          },
          {
            weight: 400,
            style: 'italic',
            src: [
              './src/assets/fonts/clarity-city/ClarityCity-RegularItalic.woff2',
            ],
          },
          {
            weight: 600,
            style: 'normal',
            src: ['./src/assets/fonts/clarity-city/ClarityCity-SemiBold.woff2'],
          },
        ],
      },
      fallbacks: ['system-ui', 'sans-serif'],
    },
    // ---- END SPECIMEN ONLY -------------------------------------------------
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
