# posts/

One `.mdx` file per essay. Flat — no subfolders.

The filename becomes the URL unless the frontmatter sets `slug`:
`a-system-is-what-it-refuses.mdx` → `/essays/a-system-is-what-it-refuses/`

Schema: `src/content.config.ts` (`postSchema`). Required: `title`, `date`,
`kind`. See PUBLISHING.md for the full walkthrough and a frontmatter template.

Only `.mdx` is loaded. This README is ignored by the collection glob, which is
the only reason it can sit here.
