// The confirmation token: signed, short-lived, names one sequence, and is
// never interchangeable with an unsubscribe token.

import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.COMMS_LINK_SECRET = 'a-test-link-secret-that-is-long-enough';
const { CONFIRM_TTL_MS, confirmUrl, signConfirmToken, verifyConfirmToken } = await import('./confirm.ts');
const { signToken, verifyToken } = await import('./unsubscribe.ts');

test('a minted token verifies to its sequence and person, and carries no address', async () => {
  const token = (await signConfirmToken('seq-1', 'person-1'))!;
  assert.deepEqual(await verifyConfirmToken(token), { sequenceId: 'seq-1', personId: 'person-1' });
  assert.ok(!token.includes('@'));
});

test('it expires after seven days', async () => {
  const now = Date.now();
  const token = (await signConfirmToken('seq-1', 'person-1', now))!;
  assert.ok(await verifyConfirmToken(token, now + CONFIRM_TTL_MS - 1000));
  assert.equal(await verifyConfirmToken(token, now + CONFIRM_TTL_MS + 1000), null);
});

test('a tampered, truncated or empty token is null', async () => {
  const token = (await signConfirmToken('seq-1', 'person-1'))!;
  const [expires, payload, mac] = token.split('.');
  assert.equal(await verifyConfirmToken(`${expires}.${payload}.${mac.slice(0, -1)}x`), null);
  const other = Buffer.from(JSON.stringify({ s: 'seq-2', p: 'person-1', v: 1 })).toString('base64url');
  assert.equal(await verifyConfirmToken(`${expires}.${other}.${mac}`), null, 'cannot be re-aimed at another sequence');
  assert.equal(await verifyConfirmToken(`${expires}.${payload}`), null);
  assert.equal(await verifyConfirmToken(''), null);
  assert.equal(await verifyConfirmToken(null), null);
});

test('a confirmation token is not an unsubscribe token, and the other way round', async () => {
  const confirm = (await signConfirmToken('seq-1', 'person-1'))!;
  const unsub = (await signToken('person-1'))!;
  assert.equal(await verifyToken(confirm), null);
  assert.equal(await verifyConfirmToken(unsub), null);
});

test('the link carries only the token, on the confirmation page', () => {
  assert.equal(confirmUrl('https://learning.thelivingcraft.ai/', 'a.b.c'), 'https://learning.thelivingcraft.ai/confirm-resource-emails?c=a.b.c');
});
