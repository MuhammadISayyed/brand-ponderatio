# chapters/

One **folder** per inquiry; one `.mdx` file per chapter inside it.

```
chapters/
  demand/
    01-dispositions-without-laws.mdx   ->  /inquiries/demand/dispositions-without-laws/
    02-...
```

The folder name is what ties a chapter to its inquiry — there is no `inquiry`
field in the frontmatter, so the two cannot disagree. It must match the
filename of a file in `src/content/inquiries/`, or the build fails.

The numeric filename prefix is for ordering the files on disk only. It is
stripped from the URL, and it is **not** what orders the chapters — the
`number` field is.

Schema: `src/content.config.ts` (`chapterSchema`). See PUBLISHING.md.
