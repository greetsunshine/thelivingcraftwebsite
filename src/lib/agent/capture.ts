// Visitor capture — validation and payload construction.
//
// DELIVERY HAPPENS IN THE BROWSER, NOT HERE. Web3Forms' free plan rejects
// server-side submissions outright:
//
//   403 {"success":false,"message":"This method is not allowed. Use our API in
//        client side or contact support with server IP address (Pro plan is
//        required)"}
//
// The site's application forms work because they post from the page. So this
// module validates the model's output and hands a ready payload back through
// /api/ask; the widget posts it to the same endpoint the forms use. The access
// key is already public by design — it is in the client bundle for the forms.
//
// The alternative was a server-side mailer (Resend/Postmark), which means
// another account, another key, and another thing to rotate. Not worth it for
// a lead handoff that already has a working browser path.
//
// Validation matters here: the email arrives as a string the model produced
// from something a stranger typed, so it is untrusted twice over.

import { APPLY_ACCESS_KEY, isApplyConfigured } from '../../data/site';

export interface VisitorCapture {
  name?: string;
  email: string;
  role?: string;
  company?: string;
  region?: string;
  interest: 'cohort' | 'caio' | 'assessment' | 'unclear';
  context?: string;
  question?: string;
}

/** What the browser posts to Web3Forms. Flat string map — no nesting. */
export type CapturePayload = Record<string, string>;

const SUBJECTS: Record<VisitorCapture['interest'], string> = {
  cohort: 'Agent lead — The Living Craft cohort',
  caio: 'Agent lead — Fractional CAIO',
  assessment: 'Agent lead — AI Readiness Assessment',
  unclear: 'Agent lead — general enquiry',
};

const EMAIL = /^[^\s@,;]+@[^\s@,;.]+\.[^\s@,;]{2,}$/;

/** Trim, collapse whitespace, cap — so a field can't forge structure in the email. */
const field = (v: unknown, max = 600): string =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';

export interface CaptureResult {
  ok: boolean;
  /** Returned to the model as the tool result. */
  message: string;
  /** Present only when ok — the widget posts this. */
  payload?: CapturePayload;
}

export function buildCapture(input: VisitorCapture, surface: string): CaptureResult {
  const email = field(input.email, 200).toLowerCase();

  if (!EMAIL.test(email)) {
    return {
      ok: false,
      message:
        'That email does not look valid. Ask the visitor to confirm it, then call this tool again.',
    };
  }

  if (!isApplyConfigured) {
    return {
      ok: false,
      message:
        'Delivery is not configured. Tell the visitor to email apply@thelivingcraft.ai directly.',
    };
  }

  const interest = (['cohort', 'caio', 'assessment', 'unclear'] as const).includes(input.interest)
    ? input.interest
    : 'unclear';

  return {
    ok: true,
    // Deliberately "being sent" rather than "sent" — the browser still has to
    // complete the post, and the widget surfaces a fallback line if it fails.
    // Overstating here would have the agent confirm delivery that didn't happen.
    message: `Details validated and being sent to Sunil. Confirm to the visitor that he has their details and will reply to ${email} himself.`,
    payload: {
      access_key: APPLY_ACCESS_KEY,
      subject: SUBJECTS[interest],
      from_name: 'Site assistant',
      name: field(input.name, 200) || '(not given)',
      email,
      role: field(input.role, 200) || '(not given)',
      company: field(input.company, 200) || '(not given)',
      region: field(input.region, 120) || '(not given)',
      interest,
      page: surface,
      context: field(input.context, 1500) || '(none)',
      question: field(input.question, 1500) || '(none)',
      captured_by: 'site assistant (/api/ask)',
    },
  };
}
