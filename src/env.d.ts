/// <reference types="astro/client" />

// Server-side only. None of these carry a PUBLIC_ prefix, so Astro never ships
// them to the browser — which is the point. Every one is a credential: a
// billable API key, a database key that bypasses row-level security, or the
// password to the admin console.
interface ImportMetaEnv {
  readonly ANTHROPIC_API_KEY?: string;
  readonly ADMIN_PASSWORD?: string;
  readonly ADMIN_SESSION_SECRET?: string;
  readonly ANALYTICS_SALT?: string;
  readonly SUPABASE_URL?: string;
  readonly SUPABASE_SERVICE_ROLE_KEY?: string;
  readonly GITHUB_TOKEN?: string;
  readonly GITHUB_REPO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Installed by src/components/Track.astro, which is an inline script and so has
// already run by the time any bundled module script executes. Declared optional
// anyway: every call site guards, because a page that renders without analytics
// is fine and a page that throws because analytics is missing is not.
interface Window {
  lcTrack?: (type: string, meta?: Record<string, unknown> | null) => void;
  lcLead?: (payload: Record<string, unknown>) => void;
}
