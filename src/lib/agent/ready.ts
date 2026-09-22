/**
 * Whether the visitor Q&A agent can answer at all.
 *
 * AskWidget renders nothing without the key, and a chat button that opens
 * onto "not configured" reads as a broken site. The cohort page's header
 * carries its own button that opens the same panel, so both places read this
 * one check rather than two copies of it.
 */
export const agentReady = Boolean(
  import.meta.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY,
);
