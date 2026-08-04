# groundings/

One **folder** per grounding; one `.mdx` file per part inside it.

```
groundings/
  demand/                          ← folder name IS the URL slug
    01-the-quantity-and-the-power.mdx
    02-dispositions-are-not-conditionals.mdx
```

The folder name is not enough on its own. Every grounding must also be
registered in `GROUNDINGS` in `src/lib/groundings.ts`, which is where its title
and abstract live — a folder with no registry entry fails the build with a
message telling you exactly that.

Part numbers must run `1..n` with no gaps and no duplicates; the build enforces
it. The `NN-` filename prefix is for sorting in your editor only — it is
stripped from the URL, and the `part` field in frontmatter is what actually
orders the argument.

Schema: `src/content.config.ts` (`groundingSchema`). See PUBLISHING.md.

Only `.mdx` is loaded. This README is ignored by the collection glob.
