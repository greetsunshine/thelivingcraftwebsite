// Whether this deployment is Vercel's Production environment.
//
// VERCEL_ENV ('production' | 'preview' | 'development') is Vercel's own
// runtime signal, not a file this repo commits. Two lookups for the same
// reason src/lib/admin/env.ts checks both: under `astro dev` Vite puts
// .env.local values on import.meta.env only; on Vercel they land on
// process.env.
//
// This app never prerenders (output: 'server'), so this reads fresh on every
// request. That is what makes "push auto-deploys to staging, click Promote
// for production" safe: promoting a deployment does not rebuild it, so
// nothing here is baked in at build time. The exact same running code sees
// VERCEL_ENV flip to 'production' on promotion and starts indexing itself —
// there is no separate staging build or staging robots.txt that could be
// promoted by mistake.
export const isProduction = (): boolean => {
  const viteEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
  const value = viteEnv?.VERCEL_ENV ?? process.env.VERCEL_ENV;
  return value === 'production';
};
