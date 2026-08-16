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
// its own module graph.
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
