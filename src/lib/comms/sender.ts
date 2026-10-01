// Who the mail is from, and the footer every message carries. Read from the
// environment at dispatch, in one place.
//
// Every value here is an OWNER'S FACT, not ours: the from-address, the reply
// mailbox and the postal address are things the practice states about
// itself. None is invented; each is a placeholder in .env.example until the
// owner supplies it, and `senderFromEnv()` says which ones are missing so the
// console can print that rather than the adapter discovering it mid-send.

import { env } from '../admin/env';
import { SITE_ORIGIN } from '../../data/facts';
import type { Footer } from './html';

export interface Sender {
  /** "The Living Craft <hello@example.org>" or a bare address. */
  from: string;
  replyTo: string | null;
  /** Where signed links point. The production origin unless overridden for staging. */
  origin: string;
  footer: Footer;
  /** Human-readable list of what is not configured. Empty when ready. */
  missing: string[];
}

const looksLikeAddress = (v: string): boolean => /<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>$/.test(v) || /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);

export function senderFromEnv(): Sender {
  const from = env('COMMS_FROM_ADDRESS').trim();
  const replyTo = env('COMMS_REPLY_MAILBOX').trim() || null;
  const postal = env('COMMS_SENDER_POSTAL_ADDRESS').trim() || null;
  const origin = (env('COMMS_LINK_ORIGIN').trim() || SITE_ORIGIN).replace(/\/+$/, '');

  const missing: string[] = [];
  if (!from) missing.push('COMMS_FROM_ADDRESS is not set.');
  else if (!looksLikeAddress(from)) missing.push('COMMS_FROM_ADDRESS is not an address.');
  if (!postal) missing.push('COMMS_SENDER_POSTAL_ADDRESS is not set (the footer needs a postal address).');

  return {
    from,
    replyTo,
    origin,
    footer: {
      identity: 'Sunil Mathew · The Living Craft',
      contact: replyTo ?? 'apply@thelivingcraft.ai',
      postal,
      preferences: `${origin}/communication-preferences`,
    },
    missing,
  };
}
