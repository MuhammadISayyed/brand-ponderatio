/**
 * Copies a template into place with the mechanical fields already filled.
 *
 *   npm run new -- essay "A system is what it refuses"
 *   npm run new -- grounding "The Dispositional Basis of Demand"
 *   npm run new -- part demand "The quantity and the power"
 *
 * It fills in ONLY what is derivable — the slug, today's date, the next part
 * number, the filename prefix. Everything that is a judgement (the deck, the
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
} else if (kind === 'grounding') {
  const title = rest.join(' ').trim();
  if (!title) die('Usage: npm run new -- grounding "Full title of the work"');

  const slug = slugFlag ?? slugify(title);
  const dir = join(root, 'src/content/groundings', slug);
  if (existsSync(dir)) die(`src/content/groundings/${slug}/ already exists.`);
  mkdirSync(dir, { recursive: true });

  /* The registry entry is PRINTED, not patched in. Editing a TypeScript file
     by regex is how a script eventually corrupts one, and this is a five-second
     paste that also makes you look at the abstract — which is the one field
     nobody should be able to skip. */
  console.log(`
  Created  src/content/groundings/${slug}/

  Now paste this into GROUNDINGS in src/lib/groundings.ts, and write the
  abstract — one paragraph, what the whole work argues:

    ${slug}: {
      title: '${title.replace(/'/g, "\\'")}',
      abstract:
        'One paragraph. What the whole work argues.',
    },

  Then add parts:  npm run new -- part ${slug} "Title of Part I"
`);
} else if (kind === 'part') {
  const [work, ...titleWords] = rest;
  const title = titleWords.join(' ').trim();
  if (!work || !title) die('Usage: npm run new -- part <grounding-folder> "Part title"');

  const dir = join(root, 'src/content/groundings', work);
  if (!existsSync(dir)) {
    die(
      `No grounding folder at src/content/groundings/${work}/.\n  ` +
        `Create the work first:  npm run new -- grounding "Full title"`,
    );
  }

  /* Next part number = one more than the highest `part:` already declared.
     Read from the frontmatter rather than counted from the filenames, because
     the `part` field is what actually orders the argument — a file with a
     misleading NN- prefix must not shift the sequence. */
  const existing = readdirSync(dir).filter((f) => f.endsWith('.mdx'));
  const numbers = existing.map((f) => {
    const m = readFileSync(join(dir, f), 'utf8').match(/^part:\s*(\d+)\s*$/m);
    return m ? Number(m[1]) : 0;
  });
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;

  const slug = slugFlag ?? slugify(title);
  const prefix = String(next).padStart(2, '0');
  const path = join(dir, `${prefix}-${slug}.mdx`);

  const body = template('grounding-part.mdx')
    .replace('title: Replace this part title', `title: ${yamlTitle(title)}`)
    .replace(/^part: 1$/m, `part: ${next}`)
    .replace('date: 2026-01-01', `date: ${today()}`);

  write(path, body);
  console.log(`
  Created  src/content/groundings/${work}/${prefix}-${slug}.mdx
  Part     ${next}
  URL      /groundings/${work}/${slug}/   (once draft: false)

  Next: write the deck — what this part ESTABLISHES. It is what the
        contents page uses to show the shape of the argument.
`);
} else {
  die(
    `Usage:
    npm run new -- essay     "Your title"
    npm run new -- grounding "Full title of the work"
    npm run new -- part <grounding-folder> "Part title"`,
  );
}
