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
    date: z.date(),
    kind: z.enum(KINDS),

    // OPTIONAL: a standfirst is a judgement about a particular piece, not a
    // slot every piece must fill.
    deck: z.string().min(1).optional(),
    sources: z.array(sourceSchema).optional(),

    tags: z.array(z.string().min(1)).default([]),
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
  });

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.mdx' }),
  schema: postSchema,
});

/**
 * Parts of a GROUNDING — a long work, published complete, read in order.
 * Separate from `posts` because the two are different objects, not two
 * flavours of one: a post is entered directly and stands alone, a part is a
 * move in an argument and means less out of sequence.
 *
 * Which grounding a part belongs to is NOT declared here. It is derived from
 * the folder the file sits in, so the two cannot disagree — see
 * lib/groundings.ts.
 *
 * There is no `status` and there should never be one. Status existed to
 * describe work published while still moving; a grounding ships finished,
 * which is also what makes its part numbers permanent and therefore citable.
 */
const groundingSchema = z.object({
  title: z.string().min(1, 'title must not be empty'),
  slug: slugSchema,

  /** Position in the argument. 1-based, contiguous, unique — checked below. */
  part: z.number().int().positive(),

  /**
   * One line of SUBSTANCE for the contents — what this part establishes, not
   * what it is about. A contents page of bare titles cannot show the shape of
   * an argument; one with these lines can.
   *
   * Optional, so it stays a judgement rather than a slot to fill. Worth
   * knowing what is lost when it is left off: the contents falls back to the
   * title alone for that part, and the reader can no longer see why it has to
   * come where it does.
   */
  deck: z.string().min(1).optional(),

  sources: z.array(sourceSchema).optional(),
  draft: z.boolean().default(false),
});

const groundings = defineCollection({
  loader: glob({ base: './src/content/groundings', pattern: '**/*.mdx' }),
  schema: groundingSchema,
});

export const collections = { posts, groundings };
