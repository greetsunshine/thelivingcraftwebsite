// The unsubscribe token: signed, opaque, expiring, and worthless once
// tampered with. The apply path's idempotency is covered by the memory store
// test in drip.test.ts (an unsubscribe twice changes nothing the second time).

import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.COMMS_LINK_SECRET = 'a-test-link-secret-that-is-long-enough';
const { signToken, verifyToken, unsubscribeUrl } = await import('./unsubscribe.ts');

test('a minted token verifies to its person, and carries nothing else', async () => {
  const token = (await signToken('person-uuid-1'))!;
  assert.ok(token);
  assert.equal(await verifyToken(token), 'person-uuid-1');
  assert.ok(!token.includes('@'), 'no address in the token');
  const payload = Buffer.from(token.split('.')[1], 'base64url').toString();
  assert.deepEqual(JSON.parse(payload), { p: 'person-uuid-1', v: 1 });
});

test('verifying twice is the same answer: a link is not consumed by being used', async () => {
  const token = (await signToken('person-uuid-2'))!;
  assert.equal(await verifyToken(token), 'person-uuid-2');
  assert.equal(await verifyToken(token), 'person-uuid-2');
});

test('a tampered, truncated, forged or missing token is null, and says nothing about why', async () => {
  const token = (await signToken('person-uuid-3'))!;
  const [expires, payload, mac] = token.split('.');
  assert.equal(await verifyToken(`${expires}.${payload}.${mac.slice(0, -1)}x`), null, 'wrong mac');
  const other = Buffer.from(JSON.stringify({ p: 'somebody-else', v: 1 })).toString('base64url');
  assert.equal(await verifyToken(`${expires}.${other}.${mac}`), null, 'payload swapped');
  assert.equal(await verifyToken(`${Number(expires) + 1000}.${payload}.${mac}`), null, 'expiry moved');
  assert.equal(await verifyToken(`${expires}.${payload}`), null, 'truncated');
  assert.equal(await verifyToken(''), null);
  assert.equal(await verifyToken(undefined), null);
  assert.equal(await verifyToken('not.a.token.at.all'), null);
});

test('an expired token is null', async () => {
  const realNow = Date.now;
  Date.now = () => realNow() - 401 * 24 * 60 * 60 * 1000;
  const old = (await signToken('person-uuid-4'))!;
  Date.now = realNow;
  assert.equal(await verifyToken(old), null);
});

test('a token minted under one secret does not verify under another', async () => {
  const token = (await signToken('person-uuid-5'))!;
  process.env.COMMS_LINK_SECRET = 'a-different-secret-that-is-also-long';
  assert.equal(await verifyToken(token), null);
  process.env.COMMS_LINK_SECRET = 'a-test-link-secret-that-is-long-enough';
});

test('the link carries only the token, on the public endpoint', async () => {
  const url = unsubscribeUrl('https://learning.thelivingcraft.ai/', 'a.b.c');
  assert.equal(url, 'https://learning.thelivingcraft.ai/api/unsubscribe?u=a.b.c');
});
