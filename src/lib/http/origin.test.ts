// The cross-site form check: Astro's rule, with the one exemption a mail
// client's one-click unsubscribe needs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crossSiteFormRefusal } from './origin.ts';

const URL_ = new URL('https://learning.thelivingcraft.ai/api/pipeline/resource');
const req = (method: string, headers: Record<string, string>) => new Request(URL_, { method, headers, body: method === 'GET' ? undefined : 'x' });
const refused = (method: string, headers: Record<string, string>, path = '/api/pipeline/resource') =>
  crossSiteFormRefusal(req(method, headers), URL_, path)?.status ?? 200;

test('a cross-site form post is refused, as Astro refused it', () => {
  assert.equal(refused('POST', { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://evil.example' }), 403);
  assert.equal(refused('POST', { 'content-type': 'multipart/form-data; boundary=x' }), 403, 'no Origin header');
  assert.equal(refused('POST', { 'content-type': 'text/plain', origin: 'https://evil.example' }), 403);
  assert.equal(refused('DELETE', { 'content-type': 'text/plain', origin: 'https://evil.example' }), 403);
});

test('a same-origin form, a JSON post and a GET pass, as before', () => {
  assert.equal(refused('POST', { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://learning.thelivingcraft.ai' }), 200);
  assert.equal(refused('POST', { 'content-type': 'application/json' }), 200, 'JSON is not form-like');
  assert.equal(refused('GET', { origin: 'https://evil.example' }), 200);
});

test('a post with no content type and no Origin is refused, as Astro refused it', () => {
  const r = new Request(URL_, { method: 'POST' });
  assert.equal(crossSiteFormRefusal(r, URL_, '/api/pipeline/resource')?.status, 403);
});

test('only /api/unsubscribe takes a form post with no Origin: RFC 8058 one-click', () => {
  assert.equal(refused('POST', { 'content-type': 'application/x-www-form-urlencoded' }, '/api/unsubscribe'), 200);
  assert.equal(refused('POST', { 'content-type': 'application/x-www-form-urlencoded' }, '/api/unsubscribe-other'), 403);
  assert.equal(refused('POST', { 'content-type': 'application/x-www-form-urlencoded' }, '/confirm-resource-emails'), 403);
});
