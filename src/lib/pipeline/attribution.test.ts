// Where a visit began, and when the site may remember it.
//
// The rules under test are at the head of attribution.ts. The three that
// matter most, because each one failing is silent:
//
//   * A page reached from another page of ours is not an arrival. If it were,
//     the worksheet a LinkedIn visitor read first would be replaced by our own
//     cohort page as "where they came from" (V4-E01).
//   * Nothing stored is read without permission. A cookie that is present but
//     not allowed must change nothing in the row (E07).
//   * With permission, the application's row carries the ARRIVAL's tags, not
//     the tags of the page the form happens to sit on.
//
// Run with `npm test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrivalTouch, buildAttribution, readTouch, serialiseTouch, type Touch } from './attribution.ts';

const HOST = 'learning.thelivingcraft.ai';
const AT = '2026-09-29T10:00:00.000Z';

const linkedInArrival = (): Touch =>
  arrivalTouch({
    search: '?utm_source=linkedin&utm_medium=organic_social&utm_campaign=lc_v4_cohort&utm_content=LC-V4-D07',
    referrer: 'https://www.linkedin.com/feed/',
    path: '/resources/agent-failure-triage-quiz',
    selfHost: HOST,
    at: AT,
  })!;

test('an arrival from a campaign link keeps its tags, its page and the sending host', () => {
  const t = linkedInArrival();
  assert.equal(t.source, 'linkedin');
  assert.equal(t.medium, 'organic_social');
  assert.equal(t.campaign, 'lc_v4_cohort');
  assert.equal(t.content, 'lc-v4-d07', 'our own post id is lower-cased');
  assert.equal(t.path, '/resources/agent-failure-triage-quiz');
  assert.equal(t.referrer, 'linkedin.com');
});

test('a page reached from another page of ours is not an arrival', () => {
  const t = arrivalTouch({
    search: '',
    referrer: `https://${HOST}/resources/agent-failure-triage-quiz`,
    path: '/',
    selfHost: HOST,
    at: AT,
  });
  assert.equal(t, null);
});

test('no referrer and no tags is a direct arrival, never a guess', () => {
  const t = arrivalTouch({ search: '', referrer: '', path: '/', selfHost: HOST, at: AT });
  assert.ok(t);
  assert.equal(t.source, 'direct');
  assert.equal(t.medium, 'none');
  assert.equal(t.referrer, null);
});

test('the landing path never keeps a query or a fragment', () => {
  const t = arrivalTouch({ search: '', referrer: '', path: '/resources/poc-screen?email=a@b.c#x', selfHost: HOST, at: AT });
  assert.equal(t?.path, '/resources/poc-screen');
});

test('without permission, stored cookies change nothing in the row', () => {
  const cookie = serialiseTouch(linkedInArrival());
  const { row } = buildAttribution({
    search: '',
    referrer: `https://${HOST}/resources/agent-failure-triage-quiz`,
    path: '/',
    selfHost: HOST,
    permitted: false,
    storedFirstTouch: cookie,
    storedSessionTouch: cookie,
  });
  assert.equal(row.first_source, null);
  assert.equal(row.first_landing_path, null);
  assert.equal(row.session_source, 'direct', 'the form page alone, as before the banner');
  assert.equal(row.entry_path, '/');
  assert.equal(row.tracking_permission, false);
});

test('with permission, the application carries the arrival, not the form page', () => {
  const cookie = serialiseTouch(linkedInArrival());
  const { row } = buildAttribution({
    search: '',
    referrer: `https://${HOST}/resources/agent-failure-triage-quiz`,
    path: '/',
    selfHost: HOST,
    permitted: true,
    storedFirstTouch: cookie,
    storedSessionTouch: cookie,
  });
  assert.equal(row.session_source, 'linkedin');
  assert.equal(row.session_content, 'lc-v4-d07');
  assert.equal(row.entry_path, '/resources/agent-failure-triage-quiz');
  assert.equal(row.referrer_host, 'linkedin.com');
  assert.equal(row.first_source, 'linkedin');
  assert.equal(row.first_landing_path, '/resources/agent-failure-triage-quiz');
  assert.equal(row.first_referrer_host, 'linkedin.com');
  assert.equal(row.first_captured_at, AT);
  assert.equal(row.tracking_permission, true);
});

test('with permission but no cookie, the form page is the fallback and first touch stays unknown', () => {
  const { row } = buildAttribution({
    search: '?utm_source=newsletter',
    referrer: '',
    path: '/',
    selfHost: HOST,
    permitted: true,
  });
  assert.equal(row.session_source, 'newsletter');
  assert.equal(row.first_source, null, 'a submission never invents a first touch');
});

test('the self-reported answer and its detail are kept apart from the tags', () => {
  const { row } = buildAttribution({
    search: '',
    referrer: '',
    path: '/',
    selfHost: HOST,
    permitted: false,
    selfReported: 'sunil-linkedin',
    selfReportedDetail: 'The post about refunds',
  });
  assert.equal(row.self_reported, 'sunil-linkedin');
  assert.equal(row.self_reported_detail, 'The post about refunds');
  assert.equal(row.session_source, 'direct');
});

test('a hand-edited cookie is refused or cleaned, never trusted', () => {
  assert.equal(readTouch('not json'), null);
  assert.equal(readTouch(encodeURIComponent(JSON.stringify({ source: 'x' }))), null, 'no date, no touch');
  const edited = readTouch(
    encodeURIComponent(
      JSON.stringify({ source: 'x', at: AT, path: '/a?email=a@b.c', referrer: 'evil.com/path?q=1' }),
    ),
  );
  assert.ok(edited);
  assert.equal(edited.path, '/a');
  assert.equal(edited.referrer, null, 'a referrer that is not a bare host is dropped');
});
