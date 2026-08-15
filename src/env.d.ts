/// <reference types="astro/client" />

// Server-side only. No PUBLIC_ prefix means Astro never ships it to the browser
// — which is the point, this is a billable credential.
interface ImportMetaEnv {
  readonly ANTHROPIC_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
