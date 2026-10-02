// The email as it is sent: the approved text, the signed links, the footer,
// and a responsive HTML rendering of the same words.
//
// ───────────────────────────────────────────────────────────────────────────
// THE TEXT IS THE MESSAGE. THE HTML IS A RENDERING OF IT.
// ───────────────────────────────────────────────────────────────────────────
//
// What was approved is the text body on the outbox row. This file never adds
// a sentence the text does not carry, so a reader of the plain-text part and a
// reader of the HTML part receive the same words. What it does add, at the
// moment of dispatch and never earlier, is the FOOTER: who we are, how to
// reach us, the postal address, the preferences link and the signed one-click
// unsubscribe link. The package: "Ein must append the existing verified footer
// at send time and suppress dispatch if links are missing." `materialise()`
// therefore returns null for a marketing message with no unsubscribe link,
// and the adapter refuses to send it.
//
// No image, no web font, no script. The wordmark is text. A mail client that
// blocks everything remote still shows the whole message.

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => ESC[c]);

/** The action placeholder the twelve, the delivery wordings and the follow-ups carry. */
export const UNSUBSCRIBE_ACTION = '{{action:unsubscribe}}';

export interface Footer {
  /** "Sunil Mathew · The Living Craft". */
  identity: string;
  /** The reply address, shown as text. */
  contact: string;
  /** The sender's postal address, or null while nobody has supplied one. */
  postal: string | null;
  /** The preferences page. Absolute. */
  preferences: string;
}

export interface Links {
  /** The signed one-click link, or null when none could be minted. */
  unsubscribe: string | null;
}

export interface Materialised {
  text: string;
  html: string;
}

const OPT_IN_LINE = 'You opted in to practical resources and occasional cohort updates.';

/**
 * The plain-text part: the body with the action placeholder replaced by the
 * footer lines. Null when a marketing body has an action and no link exists
 * for it.
 */
export function materialiseText(body: string, purpose: 'transactional' | 'marketing', links: Links, footer: Footer): string | null {
  const hasAction = body.includes(UNSUBSCRIBE_ACTION);
  if (hasAction && !links.unsubscribe) return null;

  const lines: string[] = [];
  if (purpose === 'marketing') lines.push(OPT_IN_LINE);
  if (links.unsubscribe) lines.push(`Unsubscribe: ${links.unsubscribe}`);
  lines.push(`Email preferences: ${footer.preferences}`);
  lines.push(`${footer.identity} · ${footer.contact}`);
  if (footer.postal) lines.push(footer.postal);
  const foot = lines.join('\n');

  const text = hasAction ? body.replace(UNSUBSCRIBE_ACTION, foot) : `${body}\n\n${foot}`;
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

const URL_RE = /https?:\/\/[^\s<>"')\]]+/g;

/** A line of the form "Label: https://…" becomes a button. */
const CTA_RE = /^([^:\n]{3,80}): (https?:\/\/\S+)$/;

const linkify = (text: string): string =>
  escapeHtml(text).replace(URL_RE, (u) => `<a href="${u}" style="color:#765523;text-decoration:underline;">${u}</a>`);

/**
 * The HTML part, built from the same text. Each blank-line-separated block is
 * a paragraph; the first "Label: URL" block is a button; later ones are links.
 */
export function renderHtml(subject: string, text: string, opts: { preheader?: string } = {}): string {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  let buttonUsed = false;
  const parts = blocks.map((block) => {
    const cta = CTA_RE.exec(block);
    if (cta && !buttonUsed) {
      buttonUsed = true;
      return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;"><tr><td style="border-radius:6px;background:#183D32;"><a href="${escapeHtml(cta[2])}" style="display:inline-block;padding:14px 22px;font-family:Figtree,'Avenir Next','Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#F5F0E6;text-decoration:none;">${escapeHtml(cta[1])} &rarr;</a></td></tr></table>`;
    }
    const lines = block.split('\n').map(linkify).join('<br>');
    return `<p style="margin:0 0 18px;font-family:Figtree,'Avenir Next','Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#172E26;">${lines}</p>`;
  });

  // The footer is the last block: smaller and quieter, the same words.
  const body = parts.slice(0, -1).join('\n');
  const foot = parts.at(-1)?.replace('font-size:16px;line-height:1.6;color:#172E26;', 'font-size:13px;line-height:1.6;color:#526259;') ?? '';
  const pre = opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(opts.preheader)}</div>` : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F5F0E6;">
${pre}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F5F0E6;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
<tr><td style="padding:8px 4px 20px;font-family:'Source Serif 4',Georgia,'Times New Roman',serif;font-size:22px;color:#183D32;">The Living Craft</td></tr>
<tr><td style="background:#FBF8F2;border:1px solid #CBD1C8;border-radius:12px;padding:28px 24px;">
${body}
</td></tr>
<tr><td style="padding:20px 8px 8px;">
${foot}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/** Both parts, or null when the message cannot be sent honestly. */
export function materialise(
  args: { subject: string; body: string; purpose: 'transactional' | 'marketing' },
  links: Links,
  footer: Footer,
): Materialised | null {
  const text = materialiseText(args.body, args.purpose, links, footer);
  if (text === null) return null;
  return { text, html: renderHtml(args.subject, text) };
}
