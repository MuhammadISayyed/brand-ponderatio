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
      // The working face. Essay body, decks, section headings, and every
      // piece of metadata on the site.
      //
      // Vendored, because Clarity City is on neither Google Fonts nor
      // Fontsource. Four woff2 files come from the archived VMware repo under
      // the SIL Open Font License, with that licence stored beside them as it
      // requires. The repo being archived is why the licence matters: nothing
      // upstream is coming, and OFL is what makes that survivable.
      //
      // Weights are exactly what the system asks for:
      //   400  running text and decks (plus italic, for emphasis)
      //   500  --weight-medium: labels, datelines, table headings
      //   600  --weight-semibold: H2, H3, note and index titles, <strong>
      provider: fontProviders.local(),
      name: 'Clarity City',
      cssVariable: '--font-working',
      // Local families declare their files under `options.variants`, not as
      // the weights/styles a remote provider takes.
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
            weight: 500,
            style: 'normal',
            src: ['./src/assets/fonts/clarity-city/ClarityCity-Medium.woff2'],
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
  ],
});
