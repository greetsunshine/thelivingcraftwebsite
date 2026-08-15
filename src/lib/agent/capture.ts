// Visitor capture — the agent's handoff into Sunil's inbox.
//
// Reuses the Web3Forms delivery the application forms already use, so leads
// from the agent land in the same place as form submissions and there is still
// no backend and no database. Nothing about a visitor is stored anywhere else:
// the conversation lives in the browser tab and is gone when it closes.
//
// Validation is real work here, not ceremony. The email arrives as a string the
// model produced from something a stranger typed, so it is untrusted twice
// over.

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

const SUBJECTS: Record<VisitorCapture['interest'], string> = {
  cohort: 'Agent lead — The Living Craft cohort',
  caio: 'Agent lead — Fractional CAIO',
  assessment: 'Agent lead — AI Readiness Assessment',
  unclear: 'Agent lead — general enquiry',
};

const EMAIL = /^[^\s@,;]+@[^\s@,;.]+\.[^\s@,;]{2,}$/;

/** Trim, cap, and strip newlines so a field can't forge structure in the email. */
const field = (v: unknown, max = 600): string =>
  typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';

export async function captureVisitor(
  input: VisitorCapture,
  surface: string,
): Promise<{ ok: boolean; message: string }> {
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

  const payload = {
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
  };

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    const json = (await res.json()) as { success?: boolean };
    if (!json.success) {
      return {
        ok: false,
        message:
          'Delivery failed. Tell the visitor to email apply@thelivingcraft.ai so their question is not lost.',
      };
    }

    return {
      ok: true,
      message: `Sent to Sunil. Confirm to the visitor that he has their details and will reply to ${email} himself.`,
    };
  } catch {
    return {
      ok: false,
      message:
        'Delivery failed. Tell the visitor to email apply@thelivingcraft.ai so their question is not lost.',
    };
  }
}
