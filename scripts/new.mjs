/**
 * Copies a template into place with the mechanical fields already filled.
 *
 *   npm run new -- essay   "A System Is What It Refuses"
 *   npm run new -- inquiry "Demand"
 *   npm run new -- chapter demand "The Quantity and the Power"
 *
 * It fills in ONLY what is derivable — the slug, today's date, the next
 * chapter number, the filename prefix. Everything that is a judgement (the deck, the
 * sources, whether the piece is an essay at all) is left as template prose for
 * you to answer, because a field silently filled with a plausible default is
 * worse than an empty one you have to look at.
 *
 * Nothing here publishes anything: every template carries `draft: true`.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const die = (msg) => {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
};

/** The same shape the schema's slug field accepts, so a generated name never
 *  fails validation: lowercase words, single hyphens, nothing else. */
const slugify = (s) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const today = () => new Date().toISOString().slice(0, 10);

/** YAML is whitespace-sensitive and a title may contain a colon, which would
 *  break the document. Quote when it could. */
const yamlTitle = (s) => (/[:#"'{}[\]|>]/.test(s) ? JSON.stringify(s) : s);

const template = (name) => readFileSync(join(root, 'templates', name), 'utf8');

const write = (path, body) => {
  if (existsSync(path)) die(`${path} already exists. Pick another title, or delete that file first.`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
};

const argv = process.argv.slice(2);

/**
 * `--slug=demand` overrides the name derived from the title, everywhere.
 *
 * Worth having rather than deriving always: a work called "The Dispositional
 * Basis of Demand" derives a 33-character URL segment, and the one you want is
 * `demand`. The derived name is a sensible default, not a good one.
 */
const slugFlag = argv.find((a) => a.startsWith('--slug='))?.slice('--slug='.length);
if (slugFlag !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugFlag)) {
  die(`--slug=${slugFlag} is not a legal slug: lowercase words, single hyphens, nothing else.`);
}

const [kind, ...rest] = argv.filter((a) => !a.startsWith('--slug='));

if (kind === 'essay') {
  const title = rest.join(' ').trim();
  if (!title) die('Usage: npm run new -- essay "Your title"');

  const slug = slugFlag ?? slugify(title);
  const path = join(root, 'src/content/posts', `${slug}.mdx`);

  const body = template('essay.mdx')
    .replace('title: Replace this title', `title: ${yamlTitle(title)}`)
    .replace('date: 2026-01-01', `date: ${today()}`);

  write(path, body);
  console.log(`
  Created  src/content/posts/${slug}.mdx
  URL      /essays/${slug}/   (once draft: false)

  Next: write the deck, delete the fields and imports you do not use,
        then set draft: false when it is ready.
`);
} else if (kind === 'inquiry') {
  const title = rest.join(' ').trim();
  if (!title) die('Usage: npm run new -- inquiry "Title of the work"');

  const slug = slugFlag ?? slugify(title);
  const path = join(root, 'src/content/inquiries', `${slug}.mdx`);
  const dir = join(root, 'src/content/chapters', slug);

  /* NOTHING TO NUMBER. An inquiry has no position field — the shelf orders
     itself by `started`, which this fills with today. */
  const body = template('inquiry.mdx')
    .replace('title: Replace this inquiry title', `title: ${yamlTitle(title)}`)
    .replace('started: 2026-01-01', `started: ${today()}`);

  write(path, body);
  /* The chapters folder is created empty and on purpose. An inquiry whose
     folder does not exist yet is a work you have to remember the layout of;
     one that exists and is empty is a work waiting for Chapter 1. */
  mkdirSync(dir, { recursive: true });

  console.log(`
  Created  src/content/inquiries/${slug}.mdx
  Created  src/content/chapters/${slug}/
  URL      /inquiries/${slug}/   (once draft: false)

  Next: write the standfirst — one paragraph stating the PROBLEM — and the
        body, which is the work's front matter and the last thing a reader
        sees before Chapter 1.

  Then:   npm run new -- chapter ${slug} "Title of Chapter 1"
`);
} else if (kind === 'chapter') {
  const [work, ...titleWords] = rest;
  const title = titleWords.join(' ').trim();
  if (!work || !title) die('Usage: npm run new -- chapter <inquiry> "Chapter title"');

  if (!existsSync(join(root, 'src/content/inquiries', `${work}.mdx`))) {
    die(
      `No inquiry at src/content/inquiries/${work}.mdx.\n  ` +
        `Create the work first:  npm run new -- inquiry "Title of the work"`,
    );
  }

  const dir = join(root, 'src/content/chapters', work);
  mkdirSync(dir, { recursive: true });

  /* Next chapter number = one more than the highest `number:` already
     declared. Read from the frontmatter rather than counted from the
     filenames, because the `number` field is what actually orders the work — a
     file with a misleading NN- prefix must not shift the sequence.

     DRAFTS ARE COUNTED. They keep their place in the sequence, so the next
     chapter follows the last one written, not the last one published. */
  const existing = readdirSync(dir).filter((f) => f.endsWith('.mdx'));
  const numbers = existing.map((f) => {
    const m = readFileSync(join(dir, f), 'utf8').match(/^number:\s*(\d+)\s*$/m);
    return m ? Number(m[1]) : 0;
  });
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;

  const slug = slugFlag ?? slugify(title);
  const prefix = String(next).padStart(2, '0');
  const path = join(dir, `${prefix}-${slug}.mdx`);

  const body = template('chapter.mdx')
    .replace('title: Replace this chapter title', `title: ${yamlTitle(title)}`)
    .replace(/^number: 1$/m, `number: ${next}`)
    .replace('date: 2026-01-01', `date: ${today()}`);

  write(path, body);
  console.log(`
  Created  src/content/chapters/${work}/${prefix}-${slug}.mdx
  Chapter  ${next}
  URL      /inquiries/${work}/${slug}/   (once draft: false)

  Next: write the deck — what this chapter ESTABLISHES. It is what the
        contents page uses to show the shape of the argument.

        If ${work} declares \`parts\`, set \`part:\` on this chapter too —
        it is all-or-nothing across the work and the build will say so.
`);
} else {
  die(
    `Usage:
    npm run new -- essay   "Your Title"
    npm run new -- inquiry "Title of the Work"
    npm run new -- chapter <inquiry> "Chapter Title"`,
  );
}
