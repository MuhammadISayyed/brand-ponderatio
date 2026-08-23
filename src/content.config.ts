import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Zod is re-exported by Astro rather than imported from `astro:content`.
// Verified against Astro 7.1.6 — this is Zod 4.
import { z } from 'astro/zod';

const KINDS = ['essay', 'case'] as const;

/**
 * Sources are keyed so the prose can point at them. A `<Cite source="brand">`
 * in the body links the author's name to the entry, and the entry links back
 * to every place it was used.
 *
 * `background` is the deliberate exception: a work that informed the piece
 * without supporting any one sentence. It must be declared, because the
 * alternative — silently tolerating uncited entries — is how a bibliography
 * fills up with works nobody actually read. EssayLayout fails the build on an
 * uncited source that has not claimed this.
 */

/**
 * A hand-written URL segment. Optional everywhere: left off, it is derived
 * from the filename, which is what has been happening implicitly all along.
 * Set it when the filename and the URL should differ — a long title, a
 * renamed file, a URL that has to stay put.
 */
const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'slug must be lowercase words separated by single hyphens (e.g. "powers-compose"), with no leading, trailing or doubled hyphens.',
  )
  .optional();

const KEY_PATTERN = /^[a-z][a-z0-9-]*$/;

const sourceSchema = z.object({
  key: z
    .string()
    .regex(
      KEY_PATTERN,
      'source key must be lowercase letters, digits and hyphens, starting with a letter (e.g. "brand", "alexander-1964").',
    ),
  text: z.string().min(1, 'source text must not be empty'),
  background: z.boolean().default(false),
});

/**
 * Anything malformed fails the build. Nothing renders badly.
 *
 * This used to carry a second register — notes: filed sheets with reference
 * codes, a status, and a superseding chain, constrained by `kind` through a
 * long superRefine. That register is gone, and with it the machinery that
 * existed only to police it. `kind` survives because an essay and a case are
 * still different things to label, but it no longer changes which fields are
 * legal.
 */
const postSchema = z
  .object({
    title: z.string().min(1, 'title must not be empty'),
    slug: slugSchema,

    /** When it went up. */
    date: z.date(),

    /**
     * When it last changed materially. Optional, and it should stay optional:
     * an "updated" date on a piece that has only had its typos fixed tells
     * the reader something false. Set it when the ARGUMENT moved.
     */
    updated: z.date().optional(),

    kind: z.enum(KINDS),

    // OPTIONAL: a standfirst is a judgement about a particular piece, not a
    // slot every piece must fill.
    deck: z.string().min(1).optional(),
    sources: z.array(sourceSchema).optional(),

    draft: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    // Duplicate keys would make `<Cite>` ambiguous and produce two elements
    // with the same id, so they are rejected here rather than left to render
    // into invalid HTML.
    if (data.sources) {
      const seen = new Set<string>();
      data.sources.forEach((source, i) => {
        if (seen.has(source.key)) {
          ctx.addIssue({
            code: 'custom',
            path: ['sources', i, 'key'],
            message: `duplicate source key "${source.key}". Keys are what <Cite> points at, so they must be unique within a post.`,
          });
        }
        seen.add(source.key);
      });
    }

    // An update that predates publication is a typo in one of the two dates,
    // and it renders as a piece revised before it existed.
    if (data.updated && data.updated < data.date) {
      ctx.addIssue({
        code: 'custom',
        path: ['updated'],
        message: `updated (${data.updated.toISOString().slice(0, 10)}) is before date (${data.date.toISOString().slice(0, 10)}).`,
      });
    }
  });

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.mdx' }),
  schema: postSchema,
});

/**
 * An INQUIRY — a single problem worked until it yields, published in sequence
 * over weeks or months. The register above essays: not a piece you enter and
 * leave, but a whole work that accumulates in public.
 *
 * This file IS the work. Its body is the front matter of the argument — the
 * introduction a reader hits before Chapter 1 — and its frontmatter carries
 * the name, the problem, and the shape. That is a change from the grounding
 * this replaced, whose title and abstract lived in a registry in code because
 * "there is no file that is the work". Now there is one, so the registry is
 * gone: a work with no file could not carry an introduction, and an inquiry
 * has to.
 *
 * STATUS EXISTS HERE, and its absence was the whole point of a grounding. A
 * grounding shipped complete, so status had nothing to describe. An inquiry
 * publishes while still moving, so the reader has to be told whether they are
 * reading a finished case or joining one in progress. That single difference
 * is what makes this a different register rather than a renamed one.
 */
const inquirySchema = z
  .object({
    title: z.string().min(1, 'title must not be empty'),
    slug: slugSchema,

    /*
     * THERE IS NO `number`, AND THERE SHOULD NOT BE ONE. An inquiry was
     * briefly numbered — "Inquiry II" — on the theory that a numeral marks the
     * top of the hierarchy. It marked nothing. A work's title is what a reader
     * calls it and what anyone citing it writes down; the numeral was a second
     * name for the same thing, and the only question it answered ("which came
     * first?") is answered by `started` without asking anyone to maintain a
     * sequence by hand.
     *
     * Chapters keep their numbers, because a chapter really is cited by
     * position within a work. A work is cited by name.
     */

    /**
     * One paragraph stating the PROBLEM — not a summary of the findings. It
     * sits on the index and again at the head of the contents page, and it is
     * the only thing a reader has to go on before committing to a long work.
     */
    standfirst: z.string().min(1, 'standfirst must not be empty'),

    /** Meta/SEO. The standfirst is a paragraph; this is a sentence. */
    description: z.string().min(1).optional(),

    status: z.enum(['in-progress', 'complete']),

    /** When the first chapter went up, or when the work was opened. */
    started: z.date(),

    /**
     * The optional grouping layer. Parts have NO ROUTE — they are a heading
     * on the contents page and a segment in the chapter's position line, and
     * nothing else. Omit the field entirely for a flat inquiry.
     *
     * Part numbers are declared here rather than inferred from the chapters
     * that claim them, so a part can be titled. A part nobody has written a
     * chapter for yet is legal and renders as an empty heading: that is the
     * shape of the work stated in advance, which is most of what a contents
     * page is for while the work is still in progress.
     */
    parts: z
      .array(
        z.object({
          number: z.number().int().positive(),
          title: z.string().min(1, 'part title must not be empty'),
        }),
      )
      .optional(),

    draft: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.parts) return;

    // Part numbers are how a chapter names its part, so a duplicate makes the
    // reference ambiguous and a gap leaves "Part Three" pointing at nothing.
    const seen = new Set<number>();
    data.parts.forEach((part, i) => {
      if (seen.has(part.number)) {
        ctx.addIssue({
          code: 'custom',
          path: ['parts', i, 'number'],
          message: `duplicate part number ${part.number}. Chapters name their part by this number, so it must be unique.`,
        });
      }
      seen.add(part.number);
    });

    [...data.parts]
      .sort((a, b) => a.number - b.number)
      .forEach((part, i) => {
        if (part.number !== i + 1) {
          ctx.addIssue({
            code: 'custom',
            path: ['parts'],
            message: `parts must run 1..n with no gaps. Expected ${i + 1} but found ${part.number}.`,
          });
        }
      });
  });

const inquiries = defineCollection({
  loader: glob({ base: './src/content/inquiries', pattern: '**/*.mdx' }),
  schema: inquirySchema,
});

/**
 * Chapters of an inquiry — the atomic unit. One MDX file, one page, one thing
 * published.
 *
 * Which inquiry a chapter belongs to is NOT declared here. It is derived from
 * the folder the file sits in, so the two cannot disagree — see
 * lib/inquiries.ts. The brief for this register specified a `reference()`
 * field instead; folder-derivation is kept because a declared parent is a
 * second source of truth that can drift from the first, and the failure is
 * silent (a chapter filed under `demand/` that claims `brand` renders in the
 * wrong work rather than erroring).
 *
 * Field names follow the rest of the site — `date`, `deck` — rather than the
 * brief's `pubDate` and `description`, so that one vocabulary covers essays
 * and chapters alike. `sources`, `updated` and `slug` are carried over for the
 * same reason: a chapter is long-form prose with citations, and it should not
 * need a second, parallel set of names to say so.
 */
const chapterSchema = z
  .object({
    title: z.string().min(1, 'title must not be empty'),
    slug: slugSchema,

    /**
     * Position in the whole inquiry. CONTINUOUS ACROSS PARTS — chapter
     * numbers do not restart at each part, because a chapter is cited by its
     * number and "Chapter 2" must mean one thing in the work.
     */
    number: z.number().int().positive(),

    /**
     * Which part this chapter sits under. Optional, and all-or-nothing within
     * an inquiry — checked in lib/inquiries.ts, which is the only place that
     * can see every chapter at once.
     */
    part: z.number().int().positive().optional(),

    /** When it went up. */
    date: z.date(),

    /** When the argument in this chapter last moved. See the note on posts. */
    updated: z.date().optional(),

    /**
     * One line of SUBSTANCE for the contents — what this chapter establishes,
     * not what it is about. Optional, so it stays a judgement rather than a
     * slot to fill.
     */
    deck: z.string().min(1).optional(),

    sources: z.array(sourceSchema).optional(),
    draft: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.updated && data.updated < data.date) {
      ctx.addIssue({
        code: 'custom',
        path: ['updated'],
        message: `updated (${data.updated.toISOString().slice(0, 10)}) is before date (${data.date.toISOString().slice(0, 10)}).`,
      });
    }
  });

const chapters = defineCollection({
  loader: glob({ base: './src/content/chapters', pattern: '**/*.mdx' }),
  schema: chapterSchema,
});

export const collections = { posts, inquiries, chapters };
