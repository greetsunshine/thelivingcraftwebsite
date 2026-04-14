/**
 * Slack + Resend notification helpers used by Orchestrator.notifyOwner.
 * Missing env vars are logged and skipped — agents keep running.
 */

export async function slackNotify(text: string, priority: 1 | 2 | 3 | 4 | 5 = 3): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) {
    console.log('[slackNotify] SLACK_WEBHOOK_URL not set — skipped:', text.slice(0, 80));
    return;
  }
  const emoji = priority === 1 ? '🔥' : priority === 2 ? '⚡' : priority === 3 ? '📌' : '·';
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `${emoji} *P${priority}* — ${text}` }),
    });
    if (!res.ok) {
      console.warn('[slackNotify] Non-OK response:', res.status, await res.text());
    }
  } catch (err) {
    console.warn('[slackNotify] Error:', err instanceof Error ? err.message : String(err));
  }
}

export async function emailNotify(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[emailNotify] RESEND_API_KEY not set — skipped:', opts.subject);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'The Living Craft Crew <crew@thelivingcraft.ai>',
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      console.warn('[emailNotify] Non-OK response:', res.status, await res.text());
    }
  } catch (err) {
    console.warn('[emailNotify] Error:', err instanceof Error ? err.message : String(err));
  }
}
