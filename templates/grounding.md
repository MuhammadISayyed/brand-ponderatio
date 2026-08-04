# New grounding — the work itself

A grounding has no file of its own. Its spine page (`/groundings/<work>/`) is
generated from two things that must agree, and the build checks that they do.

Fastest path:

```sh
npm run new -- grounding "The Dispositional Basis of Demand"
```

That creates the folder and prints the registry entry to paste. The manual
version is below, because you should know what the script is doing.

---

## 1. The registry entry

`src/lib/groundings.ts`. Paste inside `GROUNDINGS`:

```ts
export const GROUNDINGS: Record<string, Grounding> = {
  demand: {
    title: 'The Dispositional Basis of Demand',
    abstract:
      'Demand is treated in economics as a quantity — something read off a schedule, revealed by what was bought. This grounding argues that it is a disposition: a causal power that exists whether or not it is exercised, that composes with other powers rather than summing with them, and that a curve fitted to transactions records only where it has already been manifested.',
  },
};
```

- **The key** (`demand`) is the URL segment *and* must match the folder name
  exactly. Lowercase words, single hyphens.
- **`title`** is the full title. There is deliberately no `short` field: links
  are labelled with the destination's real name, never a truncation.
- **`abstract`** is one paragraph, shown on the spine above the contents. It
  states what the whole work argues.

**Why this lives in code rather than in frontmatter:** the title and abstract
belong to the *work*, and there is no file that is the work. Putting them in
Part I's frontmatter would make Part I structurally special, and deleting Part I
would delete the work's name.

## 2. The folder

```
src/content/groundings/demand/
```

The folder name is the registry key. A folder with no registry entry fails the
build with a message naming the folder and listing the groundings it does know.

(One wrinkle: that check runs while resolving a registered grounding, so while
`GROUNDINGS` is *completely* empty an unregistered folder is simply ignored
rather than reported. It starts failing the moment any grounding exists — which
is the moment it matters.)

## 3. The parts

Copy `templates/grounding-part.mdx` into the folder, once per part:

```
src/content/groundings/demand/
  01-the-quantity-and-the-power.mdx      part: 1
  02-dispositions-are-not-conditionals.mdx   part: 2
  03-powers-compose.mdx                  part: 3
```

Or `npm run new -- part demand "The quantity and the power"`, which works out
the next number and prefix for you.

Rules the build enforces, not advises:

- Part numbers run **1..n, no gaps, no duplicates**.
- Every part's `deck` should say what that part **establishes** — the contents
  page is the argument in outline, and bare titles cannot show the shape of an
  argument.
- A grounding **publishes complete**. Do not ship Part I and write Part II in
  public; that is what essays are for. Publishing complete is what makes the
  part numbers permanent, and permanence is what makes them citable.

## 4. Publish

Every part starts `draft: true`. Flip them **all** together — a single drafted
part is removed from the sequence and breaks the contiguous-numbering check.

## Renumbering, later

Inserting a part into a finished work renumbers every part after it. URLs
survive (they are slugs, not numbers) but the roman numerals in any existing
citation of those parts do not. Think before inserting.
