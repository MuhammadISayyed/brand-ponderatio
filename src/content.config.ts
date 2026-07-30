import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
// Zod is re-exported by Astro rather than imported from `astro:content`.
// Verified against Astro 7.1.6 — this is Zod 4.
import { z } from 'astro/zod';

/**
 * Reference codes are a real filing system, not decoration: the two-letter
 * prefix denotes a body of work and the number is sequential within it.
 * The prefixes are deliberately NOT enumerated here — the regex is the only
 * validation, so a new body of work needs no code change.
 */
const REF_PATTERN = /^[A-Z]{2}-\d{3}$/;

const KINDS = ['note', 'essay', 'case'] as const;
const STATUSES = ['working', 'revised', 'superseded'] as const;

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
 * Fields are declared permissively here and then constrained by `kind` in the
 * superRefine below. That is the only way to express "required for one kind,
 * forbidden for another" while keeping a single flat frontmatter shape.
 *
 * Anything malformed fails the build. Nothing renders badly.
 */
const postSchema = z
  .object({
    title: z.string().min(1, 'title must not be empty'),
    date: z.date(),
    kind: z.enum(KINDS),

    // Editorial register only (essay, case).
    deck: z.string().min(1).optional(),
    sources: z.array(sourceSchema).optional(),

    // Document register only (note).
    ref: z.string().optional(),
    status: z.enum(STATUSES).optional(),
    supersededBy: z.string().optional(),

    tags: z.array(z.string().min(1)).default([]),
    draft: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const isNote = data.kind === 'note';

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

    if (isNote) {
      // --- Required on notes ---
      if (data.ref === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['ref'],
          message: 'ref is required when kind is "note" (e.g. "CN-014").',
        });
      } else if (!REF_PATTERN.test(data.ref)) {
        ctx.addIssue({
          code: 'custom',
          path: ['ref'],
          message: `ref "${data.ref}" must match ${REF_PATTERN.source} — two uppercase letters, a hyphen, three digits (e.g. "CN-014").`,
        });
      }

      if (data.status === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['status'],
          message: `status is required when kind is "note" (one of: ${STATUSES.join(', ')}).`,
        });
      }

      // --- Rejected on notes ---
      if (data.deck !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['deck'],
          message:
            'deck is not permitted on a note. Notes are filed sheets, not published arguments — they carry a document header instead of a standfirst.',
        });
      }

      if (data.sources !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['sources'],
          message:
            'sources is not permitted on a note. The sources block lives in the margin column, and notes have no margin column.',
        });
      }
    } else {
      // --- Required on essay / case ---
      if (data.deck === undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['deck'],
          message: `deck is required when kind is "${data.kind}".`,
        });
      }

      // --- Rejected on essay / case ---
      if (data.ref !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['ref'],
          message: `ref is only permitted when kind is "note", not "${data.kind}".`,
        });
      }

      if (data.status !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['status'],
          message: `status is only permitted when kind is "note", not "${data.kind}".`,
        });
      }

      if (data.supersededBy !== undefined) {
        ctx.addIssue({
          code: 'custom',
          path: ['supersededBy'],
          message: `supersededBy is only permitted when kind is "note", not "${data.kind}".`,
        });
      }
    }

    // supersededBy is coupled to status, in both directions: a superseded note
    // must say what replaced it (NoteLayout renders a link to it), and a note
    // that is not superseded must not claim a successor.
    if (data.supersededBy !== undefined) {
      if (!REF_PATTERN.test(data.supersededBy)) {
        ctx.addIssue({
          code: 'custom',
          path: ['supersededBy'],
          message: `supersededBy "${data.supersededBy}" must be a reference code matching ${REF_PATTERN.source}.`,
        });
      }
      if (data.supersededBy === data.ref) {
        ctx.addIssue({
          code: 'custom',
          path: ['supersededBy'],
          message: 'supersededBy must not point at the note itself.',
        });
      }
      if (isNote && data.status !== 'superseded') {
        ctx.addIssue({
          code: 'custom',
          path: ['supersededBy'],
          message: `supersededBy is set but status is "${data.status}". Set status to "superseded".`,
        });
      }
    } else if (isNote && data.status === 'superseded') {
      ctx.addIssue({
        code: 'custom',
        path: ['supersededBy'],
        message:
          'status is "superseded" but supersededBy is missing. A superseded note must name the note that replaced it.',
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

  /** Position in the argument. 1-based, contiguous, unique — checked below. */
  part: z.number().int().positive(),

  /**
   * One line of SUBSTANCE for the spine — what this part establishes, not
   * what it is about. The spine is meant to read as the argument in outline,
   * and a contents page of titles cannot do that.
   */
  deck: z.string().min(1, 'deck must not be empty'),

  sources: z.array(sourceSchema).optional(),
  draft: z.boolean().default(false),
});

const groundings = defineCollection({
  loader: glob({ base: './src/content/groundings', pattern: '**/*.mdx' }),
  schema: groundingSchema,
});

export const collections = { posts, groundings };
