// Whether this deployment is Vercel's Production environment.
//
// VERCEL_ENV is Vercel's own signal, and its value is 'production', 'preview'
// or 'development'. It is a SYSTEM environment variable, so it only exists when
// "Enable access to System Environment Variables" is ticked in the project's
// Environment Variables settings. It is ticked on this project, checked on
// 15 September 2026. If somebody unticks it, this returns false on the live
// site, and the live site then serves `Disallow: /` and `noindex` on every
// page. That is the failure mode to remember here, and it is silent.
//
// The lookup is env() from ./admin/env. That file is named for the console, but
// the function is not admin-specific: it is the one place that documents the
// three runtimes this repo has — `astro dev`, Vercel, and plain node for the
// retriever scripts — and copying its two lines here would mean two copies of
// that rule to keep in step.
//
// WHEN THIS IS READ, and it is not the same everywhere.
//   * On a route rendered on demand it runs per request. A deployment that
//     becomes production starts indexing itself with no code change.
//   * On a PRERENDERED route it runs once, at build time, and the answer is
//     baked into the static HTML. NO ROUTE IS PRERENDERED TODAY. Thirteen were
//     until 15 September 2026 — /llms.txt, /sitemap.xml, /toolkit and
//     everything under /resources and /tools — and the whole public site went
//     back to request-time rendering at Sunil's instruction. Check with
//     `grep -rl 'prerender = true' src/pages`, which returns nothing today.
//     If a route grows the flag back, this paragraph applies to it again, and
//     so does the gap two paragraphs down: the middleware's X-Robots-Tag
//     header never runs for a prerendered route.
//
// WHAT PROMOTING ACTUALLY DOES. Promoting a preview deployment to production
// triggers a complete rebuild with production variables. So the baked pages are
// rebuilt too and the flip is safe. Two other paths do not rebuild: Instant
// Rollback, and promoting a staged production build. Both of those were built
// with VERCEL_ENV already set to 'production', so neither can strand a noindex
// on the live domain.
//
// THE GAP, if a stage environment is introduced. A staged production build is a
// production build with no domain assigned yet. VERCEL_ENV is 'production' for
// it, so this function says production and the stage URL is fully indexable.
// A build-time signal cannot tell the two apart, because they are the same
// build and only the later domain assignment differs. Gate on the request host
// instead if that workflow is adopted.
import { env } from './admin/env';

export const isProduction = (): boolean => env('VERCEL_ENV') === 'production';
