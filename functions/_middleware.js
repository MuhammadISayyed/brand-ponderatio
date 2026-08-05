/**
 * The only server-side code on this site.
 *
 * Cloudflare Pages serves every project from `<project>.pages.dev` and gives
 * no way to switch that off — the custom domain is a layer on top of it, not a
 * replacement for it. So the site has a second working public address, and a
 * link to it is a link that outlives the mistake.
 *
 * That cannot be fixed from the dashboard. Redirect Rules and Bulk Redirects
 * only match hostnames in zones you control, and `pages.dev` is Cloudflare's
 * zone, not ours — which is exactly why the www redirect could be a dashboard
 * rule and this one cannot. A Pages Function is the supported mechanism for
 * host-level logic on a Pages project; it runs on the same edge as those
 * rules, and it is configured here because this is where Pages looks for it.
 *
 * PREVIEW DEPLOYMENTS ARE DELIBERATELY LEFT ALONE. Every push to a non-main
 * branch gets its own `<hash>.brand-ponderatio.pages.dev`, and that is the way
 * to check a draft on a real device before it is public. Redirecting those to
 * production would send you to the very page you were trying not to look at.
 * Hence an EXACT host match rather than a suffix test: only the bare
 * production hostname is redirected, and anything with a label in front of it
 * is a preview and passes through.
 *
 * Everything reaching the custom domain — which is to say, essentially all
 * real traffic — falls through after one string comparison.
 */

/** The production Pages hostname. Exact match; see the note above. */
const PAGES_HOST = 'brand-ponderatio.pages.dev';

/** Canonical origin. Must agree with `site` in astro.config.mjs. */
const CANONICAL_ORIGIN = 'https://brandponderatio.com';

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.hostname === PAGES_HOST) {
    /* Path and query carried across, so a deep link survives the hop —
       /essays/some-piece/ must not land anyone on the home page. The fragment
       is not here to preserve: browsers never send it, and they reapply it to
       the redirect target themselves.

       301 rather than 302. This is permanent, and a permanent redirect is what
       consolidates any accumulated links onto the real domain rather than
       asking every client to re-check forever. */
    return Response.redirect(
      `${CANONICAL_ORIGIN}${url.pathname}${url.search}`,
      301,
    );
  }

  return context.next();
}
