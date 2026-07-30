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

  // Self-hosted via Astro's built-in Fonts API. Two faces, two voices — see
  // the swap block in src/styles/tokens.css, which is the only other place a
  // typeface is named.
  fonts: [
    {
      // The document face. Post titles and the whole body of a note — the
      // printed voice.
      //
      // ONE WEIGHT, NO ITALIC, NO BOLD. That is the face, not an oversight:
      // the Google API 400s on any other request. It costs the note register
      // its italic, which global.css answers with letterspaced roman rather
      // than a synthesised slant. See the DOCUMENT REGISTER block there.
      provider: fontProviders.google(),
      name: 'Goudy Bookletter 1911',
      cssVariable: '--font-document',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      // The working face. Essay body, decks, and every piece of metadata on
      // the site.
      //
      // Ysabeau is a sans cut from French Renaissance letterforms rather than
      // from geometry, which is why it sits under a Goudy title without
      // arguing with it — the two disagree about serifs and agree about
      // everything else.
      //
      // Weights are exactly what the system asks for:
      //   400  running text and decks (plus italic, for the deck and emphasis)
      //   500  --weight-medium: labels, datelines, table headings
      //   600  --weight-semibold: <strong>
      provider: fontProviders.google(),
      name: 'Ysabeau',
      cssVariable: '--font-working',
      weights: [400, 500, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
