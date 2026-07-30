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
      // Body serif — running text, decks. Drawn by TypeTogether for extended
      // reading: generous x-height, warm, and it holds authority at 20px
      // without turning stern.
      provider: fontProviders.google(),
      name: 'Literata',
      cssVariable: '--font-body',
      weights: [400, 600],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      // Display serif — titles only. High contrast and tight; it carries a
      // 64px title and is deliberately NOT used at H2 size, where its single
      // 400 weight goes thin. See the note on --font-serif-display.
      provider: fontProviders.google(),
      name: 'Instrument Serif',
      cssVariable: '--font-display',
      weights: [400],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      // Metadata sans — datelines, labels, captions, sidenotes ONLY.
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-meta',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
