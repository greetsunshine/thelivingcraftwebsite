// The provider seam: one interface, one registry, one place for credentials.
//
// `deliver()` in outbox.ts asks this module for the adapter named by
// COMMS_PROVIDER and hands it a fully materialised message. Nothing outside
// this folder knows a provider's request shape or holds its key.
//
// THE OUTCOME TYPE LIVES HERE so that outbox.ts can import it and an adapter
// can return it without the two files importing each other.

import { resend } from './resend';

export type DeliveryOutcome =
  | { kind: 'sent'; provider: string; providerMessageId: string }
  | { kind: 'failed'; reason: string; permanent: boolean }
  | { kind: 'unknown'; provider: string; providerMessageId: string | null; reason: string }
  | { kind: 'disabled'; reason: string };

export interface OutgoingEmail {
  /** Our message id. The adapter passes it as the provider's idempotency key. */
  messageId: string;
  to: string;
  from: string;
  replyTo: string | null;
  subject: string;
  text: string;
  html: string;
  /** RFC 8058 and friends. Set by outbox.ts; the adapter passes them through. */
  headers: Record<string, string>;
  /** Opaque labels for the provider's dashboard. Never personal data. */
  tags: Record<string, string>;
}

export interface ProviderAdapter {
  name: string;
  send(email: OutgoingEmail): Promise<DeliveryOutcome>;
}

const REGISTRY: Record<string, ProviderAdapter> = {
  resend,
};

/** The adapter for a COMMS_PROVIDER value, or null for an unknown or blank one. */
export const providerFor = (name: string | null | undefined): ProviderAdapter | null => {
  const key = (name ?? '').trim().toLowerCase();
  return key ? (REGISTRY[key] ?? null) : null;
};

export const PROVIDER_NAMES = Object.keys(REGISTRY);
