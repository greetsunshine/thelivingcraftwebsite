// The Resend adapter: what each provider answer becomes, and whether a
// webhook is the provider's.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseResendEvent, resend, signResendWebhook, verifyResendSignature } from './resend.ts';

const SECRET = 'whsec_' + Buffer.from('a-test-signing-key-32-bytes-long!!').toString('base64');
const BODY = JSON.stringify({ type: 'email.delivered', created_at: '2026-10-03T04:31:00.000Z', data: { email_id: 'em_123' } });

const email = {
  messageId: 'msg-1',
  to: 'p1@example.org',
  from: 'The Living Craft <hello@example.invalid>',
  replyTo: null,
  subject: 's',
  text: 't',
  html: '<p>t</p>',
  headers: {},
  tags: {},
};

const withFetch = async (impl: typeof fetch, run: () => Promise<void>) => {
  const real = globalThis.fetch;
  globalThis.fetch = impl;
  try {
    await run();
  } finally {
    globalThis.fetch = real;
  }
};

test('a valid signature passes; a tampered body, an old timestamp and a wrong secret do not', async () => {
  const now = new Date('2026-10-03T04:31:10.000Z');
  const ts = String(Math.floor(now.getTime() / 1000));
  const sig = await signResendWebhook(SECRET, 'msg_1', ts, BODY);
  const headers = { id: 'msg_1', timestamp: ts, signature: sig };
  assert.equal(await verifyResendSignature({ secret: SECRET, headers, rawBody: BODY, now }), true);
  assert.equal(await verifyResendSignature({ secret: SECRET, headers, rawBody: BODY + ' ', now }), false, 'tampered');
  assert.equal(await verifyResendSignature({ secret: SECRET, headers, rawBody: BODY, now: new Date(now.getTime() + 6 * 60_000) }), false, 'too old');
  assert.equal(await verifyResendSignature({ secret: 'whsec_' + Buffer.from('other').toString('base64'), headers, rawBody: BODY, now }), false, 'wrong secret');
  assert.equal(await verifyResendSignature({ secret: SECRET, headers: { ...headers, signature: null }, rawBody: BODY, now }), false, 'no signature');
  assert.equal(await verifyResendSignature({ secret: '', headers, rawBody: BODY, now }), false, 'no secret configured');
});

test('during a secret rotation any one of the listed signatures is enough', async () => {
  const now = new Date('2026-10-03T04:31:10.000Z');
  const ts = String(Math.floor(now.getTime() / 1000));
  const good = await signResendWebhook(SECRET, 'msg_2', ts, BODY);
  const headers = { id: 'msg_2', timestamp: ts, signature: `v1,${'A'.repeat(44)} ${good}` };
  assert.equal(await verifyResendSignature({ secret: SECRET, headers, rawBody: BODY, now }), true);
});

test('provider events map to the outbox\'s vocabulary; a transient bounce is soft; unknown types are ignored', () => {
  const ev = (type: string, extra: Record<string, unknown> = {}) => parseResendEvent({ type, created_at: 'x', data: { email_id: 'em_1', ...extra } }, 'svix_1');
  assert.equal(ev('email.delivered')?.type, 'delivered');
  assert.equal(ev('email.bounced', { bounce: { type: 'Permanent' } })?.type, 'bounce_hard');
  assert.equal(ev('email.bounced', { bounce: { type: 'Transient' } })?.type, 'bounce_soft');
  assert.equal(ev('email.complained')?.type, 'complaint');
  assert.equal(ev('email.opened')?.type, 'opened');
  assert.equal(ev('email.clicked')?.type, 'clicked');
  assert.equal(ev('email.delivery_delayed')?.type, 'deferred');
  assert.equal(ev('contact.created'), null);
  assert.equal(ev('email.delivered')?.providerEventId, 'svix_1', 'the svix id is the dedupe key');
  assert.equal(ev('email.delivered')?.providerMessageId, 'em_1');
});

test('the send outcomes: sent, transient, permanent, unknown, and no key', async () => {
  process.env.RESEND_API_KEY = 're_test';
  await withFetch(async () => new Response(JSON.stringify({ id: 'em_9' }), { status: 200 }), async () => {
    const out = await resend.send(email);
    assert.deepEqual(out, { kind: 'sent', provider: 'resend', providerMessageId: 'em_9' });
  });
  await withFetch(async () => new Response(JSON.stringify({ name: 'rate_limit_exceeded' }), { status: 429 }), async () => {
    const out = await resend.send(email);
    assert.equal(out.kind, 'failed');
    assert.equal(out.kind === 'failed' && out.permanent, false, 'a 429 is worth a retry');
  });
  await withFetch(async () => new Response(JSON.stringify({ name: 'validation_error' }), { status: 422 }), async () => {
    const out = await resend.send(email);
    assert.equal(out.kind === 'failed' && out.permanent, true, 'a 422 is not');
  });
  await withFetch(async () => new Response('', { status: 503 }), async () => {
    const out = await resend.send(email);
    assert.equal(out.kind === 'failed' && out.permanent, false);
  });
  await withFetch(async () => {
    throw Object.assign(new Error('aborted'), { name: 'AbortError' });
  }, async () => {
    const out = await resend.send(email);
    assert.equal(out.kind, 'unknown', 'a timeout may have landed');
  });
  await withFetch(async () => new Response(JSON.stringify({}), { status: 200 }), async () => {
    const out = await resend.send(email);
    assert.equal(out.kind, 'unknown', '2xx without an id is not a confirmed send');
  });
  delete process.env.RESEND_API_KEY;
  const out = await resend.send(email);
  assert.equal(out.kind === 'failed' && out.permanent, true, 'no key: permanent');
});

test('the idempotency key sent to the provider is our message id', async () => {
  process.env.RESEND_API_KEY = 're_test';
  let seen: Record<string, string> = {};
  await withFetch(
    async (_url, init) => {
      seen = Object.fromEntries(Object.entries((init?.headers ?? {}) as Record<string, string>));
      return new Response(JSON.stringify({ id: 'em_1' }), { status: 200 });
    },
    async () => {
      await resend.send({ ...email, headers: { 'List-Unsubscribe': '<https://x>' } });
    },
  );
  assert.equal(seen['Idempotency-Key'], 'msg-1');
  delete process.env.RESEND_API_KEY;
});
