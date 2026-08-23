# inquiries/

One `.mdx` file per inquiry. The filename is the URL segment and the folder
name that its chapters must sit in:

```
inquiries/
  demand.mdx        ->  /inquiries/demand/   and  chapters/demand/
  brand.mdx         ->  /inquiries/brand/    and  chapters/brand/
```

The **body of the file is the front matter of the work** — the introduction a
reader meets before Chapter 1. It renders on the contents page, above the
contents themselves.

There is no registry to update. The file is the work.

Schema: `src/content.config.ts` (`inquirySchema`). See PUBLISHING.md.
