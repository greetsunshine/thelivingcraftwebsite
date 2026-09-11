// Server-side environment access.
//
// Two lookups, not one — the same trap /api/ask documents. On Vercel these are
// real environment variables and land in process.env; under `astro dev` they
// come from .env.local, which Vite exposes on import.meta.env and does NOT copy
// into process.env. Reading only one works in exactly one of the two places,
// and the failure is a silent "not configured" on whichever you test in.

// Three runtimes now, not two. The retriever scripts import this (via the
// budget guard) and run under plain `node`, where `import.meta.env` is
// UNDEFINED — indexing it throws rather than returning undefined, which took
// out the whole sweep before it reached the model. Vite only defines it inside
// its own module graph. Those scripts are started with
// `node --env-file-if-exists=.env.local` (see package.json), which puts the
// same values on process.env, so the pair of lookups below covers all three.
//
// ───────────────────────────────────────────────────────────────────────────
// THERE WAS A THIRD LOOKUP HERE AND IT HAD TO GO
// ───────────────────────────────────────────────────────────────────────────
//
// A miss used to fall through to `fs.readFileSync('d:\\…\\.env.local')` — one
// developer's absolute path, compiled into shipped code. Three things wrong
// with it, and the first alone is enough:
//
//   * It reads a SECRETS FILE OFF DISK on every miss, inside a request. A miss
//     is the ordinary case for an unset variable, so the hot path for "is
//     GitHub configured?" was a filesystem read of every credential we hold,
//     with the answer parsed out by a regex built from the caller's string.
//   * On Vercel that path does not exist, so it silently did nothing there —
//     meaning it was never the thing making production work, and could not be.
//   * It made local behaviour differ from deployed behaviour in exactly the
//     place you least want a difference: a variable could resolve locally and
//     be absent in production, and nothing would say so until a user hit it.
//
// Its stated purpose was picking up an edited .env.local without restarting
// `astro dev`. That is a convenience, not a requirement, and the correct
// version of it is restarting the dev server — which Astro needs anyway, since
// Vite loads .env files once at startup. LOCAL DEVELOPMENT IS NOT BROKEN BY
// THIS REMOVAL: `astro dev` loads .env.local into import.meta.env, and the
// scripts load it into process.env.

export const env = (key: string): string => {
  const viteEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
  return viteEnv?.[key] ?? process.env[key] ?? '';
};

/**
 * What the console can and cannot do right now.
 *
 * Read at request time rather than at module load: a missing var should make
 * one panel say "connect Supabase" while the rest of the console still works,
 * not take the whole page down. Every consumer degrades on its own.
 */
export const capabilities = () => ({
  auth: Boolean(env('ADMIN_PASSWORD') && env('ADMIN_SESSION_SECRET')),
  data: Boolean(env('SUPABASE_URL') && env('SUPABASE_SERVICE_ROLE_KEY')),
  github: Boolean(env('GITHUB_TOKEN') && env('GITHUB_REPO')),
});
