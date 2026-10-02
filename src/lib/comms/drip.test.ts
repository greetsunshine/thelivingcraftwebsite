// The resource follow-ups, end to end against the in-memory store, with the
// clock in the test's hand.
//
// The rules under test are at the head of drip.ts. The ones that matter most,
// because each one failing is silent:
//   * never the resource they asked for, never one already sent;
//   * a step is planned once, whatever runs the planner and however often;
//   * nothing is planned without a recorded permission, and a withdrawal stops
//     the sequence rather than one message;
//   * "day 2" is the reader's calendar day, in the reader's zone.
//
// Run with `npm test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_DRIP_CONFIG, dripConfig, dripView, openResourceDrip, recommend, runDripPlanner, sendSlot } from './drip.ts';
import { MemoryDripStore } from './drip-memory.ts';
import { DRIP_MODULES, moduleForRequestId, type DripModule } from '../../data/resource-routing.ts';
import { DRIP_TEMPLATES, dripTemplateFor } from './drip-templates.ts';

const IST = 'Asia/Kolkata';
const COHORT = 'Explore the cohort: https://learning.thelivingcraft.ai/#apply';
const T0 = new Date('2026-10-01T05:00:00.000Z'); // 10:30 IST, 1 October
const DAY2 = new Date(sendSlot(T0.toISOString(), 2, IST, 10)); // 10:00 IST, 3 October

const person = (store: MemoryDripStore, id = 'p1', role = 'Founder / Business Owner') => {
  store.addPerson(id, { firstName: 'Asha', recipient: `${id}@example.org`, role, roleCode: null });
  return id;
};

const opened = async (store: MemoryDripStore, personId = 'p1', requestResourceId = 'lc-r01') => {
  store.addRequest(personId, requestResourceId);
  const out = await openResourceDrip(store, { personId, requestId: `req-${personId}`, requestResourceId, consented: true, now: T0 });
  assert.equal(out.opened, true);
  return out.opened ? out.sequenceId : '';
};

const plan = (store: MemoryDripStore, now: Date, catalogue?: readonly DripModule[]) =>
  runDripPlanner(store, { now, cohortInvitation: COHORT, catalogue });

// ── the catalogue and the wordings ─────────────────────────────────────────

test('the catalogue is closed: every follow-up id exists, every module has a wording, ids are unique', () => {
  const ids = new Set(DRIP_MODULES.map((m) => m.id));
  assert.equal(ids.size, DRIP_MODULES.length);
  for (const m of DRIP_MODULES) {
    for (const f of m.preferredFollowUps) assert.ok(ids.has(f), `${m.id} points at ${f}, which is not in the catalogue`);
    assert.ok(!m.preferredFollowUps.includes(m.id), `${m.id} recommends itself`);
    assert.ok(dripTemplateFor(m.templateKey), `${m.id} has no wording`);
  }
  assert.equal(DRIP_TEMPLATES.length, DRIP_MODULES.length);
  assert.equal(DRIP_MODULES.find((m) => m.id === 'LC-T10')?.active, false, 'the register says LC-T10 is not enabled');
  assert.equal(DRIP_MODULES.find((m) => m.id === 'LC-T11')?.active, false, 'the register says LC-T11 is not enabled');
});

test('a request id maps to its module, and a guide has no request id', () => {
  assert.equal(moduleForRequestId('lc-r01')?.id, 'LC-R01');
  assert.equal(moduleForRequestId('poc-screen')?.id, 'LC-T01');
  assert.equal(moduleForRequestId('template-decision-record')?.id, 'LC-TPL03');
  assert.equal(moduleForRequestId('no-such-thing'), undefined);
  assert.deepEqual(DRIP_MODULES.find((m) => m.id === 'LC-G01')?.requestIds, []);
});

// ── selection ──────────────────────────────────────────────────────────────

test('the initial resource is never recommended, and its preferred list comes first, in order', () => {
  const first = recommend({ initial: 'LC-T01', excluded: [], roleCode: null });
  assert.equal(first?.id, 'LC-G01');
  const second = recommend({ initial: 'LC-T01', excluded: ['LC-G01'], roleCode: null });
  assert.equal(second?.id, 'LC-TPL01');
  for (let i = 0; i < 30; i++) {
    const pick = recommend({ initial: 'LC-T01', excluded: DRIP_MODULES.slice(0, i).map((m) => m.id), roleCode: null });
    assert.notEqual(pick?.id, 'LC-T01');
  }
});

test('once the preferred list is used up, the role decides, then catalogue order', () => {
  const exhausted = ['LC-G03', 'LC-T03', 'LC-T04', 'LC-TPL02']; // LC-R02's list
  assert.equal(recommend({ initial: 'LC-R02', excluded: exhausted, roleCode: 'founder' })?.id, 'LC-T01');
  assert.equal(recommend({ initial: 'LC-R02', excluded: exhausted, roleCode: 'engineer' })?.id, 'LC-T02');
  assert.equal(recommend({ initial: 'LC-R02', excluded: exhausted, roleCode: null })?.id, 'LC-T01', 'no role: catalogue order');
  assert.equal(recommend({ initial: 'LC-R02', excluded: exhausted, roleCode: 'student' })?.id, 'LC-TPL04', 'a student: the one module that names students');
});

test('an inactive module is skipped even when the matrix prefers it, and nothing left is null', () => {
  const cat: DripModule[] = [
    { ...DRIP_MODULES[0], id: 'A', preferredFollowUps: ['B', 'C'], active: true, priority: 1 },
    { ...DRIP_MODULES[0], id: 'B', preferredFollowUps: [], active: false, priority: 2 },
    { ...DRIP_MODULES[0], id: 'C', preferredFollowUps: [], active: true, priority: 3 },
  ];
  assert.equal(recommend({ initial: 'A', excluded: [], roleCode: null, catalogue: cat })?.id, 'C');
  assert.equal(recommend({ initial: 'A', excluded: ['C'], roleCode: null, catalogue: cat }), null);
});

// ── the calendar clock ─────────────────────────────────────────────────────

test('day 2 is 10:00 on the reader\'s second calendar day, not 48 hours later', () => {
  // 01:30 IST on 2 October is already "day 0 = 2 October" in India.
  assert.equal(sendSlot('2026-10-01T20:00:00.000Z', 2, IST, 10), '2026-10-04T04:30:00.000Z');
  // 23:30 IST and 00:30 IST, an hour apart, land a day apart.
  const late = sendSlot('2026-10-01T18:00:00.000Z', 2, IST, 10); // 23:30 IST 1 Oct
  const early = sendSlot('2026-10-01T19:00:00.000Z', 2, IST, 10); // 00:30 IST 2 Oct
  assert.equal(late, '2026-10-03T04:30:00.000Z');
  assert.equal(early, '2026-10-04T04:30:00.000Z');
  // Month rollover.
  assert.equal(sendSlot('2026-09-30T06:00:00.000Z', 2, IST, 10), '2026-10-02T04:30:00.000Z');
});

test('the slot is right on both sides of a daylight-saving change', () => {
  // Europe/London: BST begins 29 March 2026 at 01:00 UTC.
  assert.equal(sendSlot('2026-03-27T12:00:00.000Z', 2, 'Europe/London', 10), '2026-03-29T09:00:00.000Z');
  assert.equal(sendSlot('2026-03-27T12:00:00.000Z', 1, 'Europe/London', 10), '2026-03-28T10:00:00.000Z');
  // BST ends 25 October 2026 at 01:00 UTC.
  assert.equal(sendSlot('2026-10-24T12:00:00.000Z', 1, 'Europe/London', 10), '2026-10-25T10:00:00.000Z');
  assert.equal(sendSlot('2026-10-24T12:00:00.000Z', 0, 'Europe/London', 10), '2026-10-24T09:00:00.000Z');
  // America/New_York: EDT begins 8 March 2026 at 07:00 UTC.
  assert.equal(sendSlot('2026-03-07T12:00:00.000Z', 1, 'America/New_York', 10), '2026-03-08T14:00:00.000Z');
  assert.equal(sendSlot('2026-03-07T12:00:00.000Z', 0, 'America/New_York', 10), '2026-03-07T15:00:00.000Z');
});

test('the config falls back on nonsense and never throws', () => {
  const read = (k: string) => ({ COMMS_DRIP_INTERVAL_DAYS: '400', COMMS_DRIP_SEND_HOUR: 'noon', COMMS_DRIP_TIMEZONE: 'Mars/Olympus' })[k] ?? '';
  const cfg = dripConfig(read);
  assert.equal(cfg.intervalDays, DEFAULT_DRIP_CONFIG.intervalDays);
  assert.equal(cfg.hour, 10);
  assert.equal(cfg.zone, IST);
  assert.equal(dripConfig((k) => ({ COMMS_DRIP_INTERVAL_DAYS: '7', COMMS_DRIP_TIMEZONE: 'Europe/London' })[k] ?? '').intervalDays, 7);
});

// ── opening ────────────────────────────────────────────────────────────────

test('without the box ticked, nothing opens and no consent is written', async () => {
  const store = new MemoryDripStore();
  person(store);
  const out = await openResourceDrip(store, { personId: 'p1', requestId: 'r1', requestResourceId: 'lc-r01', consented: false, now: T0 });
  assert.equal(out.opened, false);
  assert.equal(store.sequences.length, 0);
  assert.equal(store.consents.length, 0);
});

test('with the box ticked, a consent row is written and the sequence is due on day 2', async () => {
  const store = new MemoryDripStore();
  person(store);
  const out = await openResourceDrip(store, { personId: 'p1', requestId: 'r1', requestResourceId: 'lc-r01', consented: true, now: T0 });
  assert.equal(out.opened, true);
  assert.deepEqual(store.consents.map((c) => [c.state, c.source]), [['granted', 'resource-gate']]);
  const seq = store.sequences[0];
  assert.equal(seq.route, 'resource');
  assert.equal(seq.resourceId, 'LC-R01');
  assert.equal(seq.nextSendAt, DAY2.toISOString());
});

test('a person already in the application sequence keeps that one; the permission is still recorded', async () => {
  const store = new MemoryDripStore();
  person(store);
  store.addLiveSequence('p1', 'application');
  const out = await openResourceDrip(store, { personId: 'p1', requestId: 'r1', requestResourceId: 'lc-r01', consented: true, now: T0 });
  assert.equal(out.opened, false);
  assert.match(out.opened ? '' : out.why, /already has a active application sequence/);
  assert.equal(store.consents.length, 1);
  assert.equal(store.sequences.length, 1);
});

test('a store that cannot write the consent opens nothing', async () => {
  const store = new MemoryDripStore();
  person(store);
  store.broken = true;
  const out = await openResourceDrip(store, { personId: 'p1', requestId: 'r1', requestResourceId: 'lc-r01', consented: true, now: T0 });
  assert.equal(out.opened, false);
  assert.equal(store.sequences.length, 0);
});

// ── the planner ────────────────────────────────────────────────────────────

test('nothing is planned before day 2; on day 2 one message goes with the name, the request and the cohort block', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await opened(store);

  const early = await plan(store, new Date(DAY2.getTime() - 60_000));
  assert.equal(early.considered, 0);
  assert.equal(store.messages.length, 0);

  const r = await plan(store, DAY2);
  assert.equal(r.planned, 1);
  assert.equal(r.lines[0].moduleId, 'LC-T07', 'LC-R01 prefers LC-T07 first');
  assert.equal(store.messages.length, 1);
  const m = store.messages[0];
  assert.equal(m.idempotencyKey, `drip:${seqId}:1`);
  assert.equal(m.purpose, 'marketing');
  assert.equal(m.recipient, 'p1@example.org');
  assert.equal(m.subject, 'What does an acceptable outcome cost?');
  assert.match(m.body, /^Hi Asha,/);
  assert.match(m.body, /You asked for The Cost-Ceiling Worksheet\./);
  assert.match(m.body, /Use the Run-Cost Model: https:\/\/learning\.thelivingcraft\.ai\/resources\/run-cost-model/);
  assert.ok(m.body.includes(COHORT));
  assert.ok(m.body.endsWith('{{action:unsubscribe}}'), 'the action placeholder is the last line, for the adapter to sign');
  assert.ok(!m.body.includes('{{first_name}}') && !m.body.includes('{{requested_title}}') && !m.body.includes('{{cohort_invitation}}'));

  const seq = store.find(seqId)!;
  assert.equal(seq.stepsSent, 1);
  assert.equal(seq.nextSendAt, sendSlot(DAY2.toISOString(), DEFAULT_DRIP_CONFIG.intervalDays, IST, 10));
  assert.deepEqual(store.sends.map((s) => [s.step, s.moduleId]), [[1, 'LC-T07']]);

  const again = await plan(store, DAY2);
  assert.equal(again.considered, 0, 'the same instant plans nothing twice');
});

test('a person with no name is greeted without one', async () => {
  const store = new MemoryDripStore();
  store.addPerson('p9', { firstName: null, recipient: 'p9@example.org', role: null, roleCode: null });
  await opened(store, 'p9');
  await plan(store, DAY2);
  assert.match(store.messages[0].body, /^Hi,\n/);
});

test('the sequence never repeats a resource, never sends the requested ones, and completes when the catalogue is used up', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await opened(store);
  let now = DAY2;
  const sent: string[] = [];
  for (let i = 0; i < 40; i++) {
    const r = await plan(store, now);
    const seq = store.find(seqId)!;
    if (seq.state === 'completed') break;
    assert.equal(r.planned, 1, `step ${i + 1} should plan exactly one`);
    sent.push(r.lines[0].moduleId!);
    // A second request mid-sequence is excluded from then on.
    if (i === 0) store.addRequest('p1', 'poc-screen');
    now = new Date(seq.nextSendAt!);
  }
  const seq = store.find(seqId)!;
  assert.equal(seq.state, 'completed');
  assert.equal(new Set(sent).size, sent.length, 'no resource twice');
  assert.ok(!sent.includes('LC-R01'), 'never the one they asked for');
  assert.ok(!sent.includes('LC-T01'), 'never one they asked for later');
  assert.ok(!sent.includes('LC-T10') && !sent.includes('LC-T11'), 'never an inactive module');
  const active = DRIP_MODULES.filter((m) => m.active).length;
  assert.equal(sent.length, active - 2, 'every active module except the two requested');
  assert.equal(store.messages.length, sent.length);
  assert.equal(store.sends.length, sent.length);
});

test('an unsubscribe before the first send means nothing is ever planned', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await opened(store);
  store.unsubscribe('p1', T0.toISOString());
  const r = await plan(store, DAY2);
  assert.equal(r.considered, 0);
  assert.equal(store.messages.length, 0);
  assert.equal(store.find(seqId)!.state, 'stopped');
  assert.equal(dripView('stopped', store.find(seqId)!.stoppedReason), 'unsubscribed');
});

test('an unsubscribe during the sequence cancels what is queued and stops the rest; a second unsubscribe changes nothing', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await opened(store);
  await plan(store, DAY2);
  assert.equal(store.messages[0].state, 'queued');
  store.unsubscribe('p1', DAY2.toISOString());
  assert.equal(store.messages[0].state, 'cancelled');
  const before = JSON.stringify(store.sequences) + JSON.stringify(store.messages);
  store.unsubscribe('p1', DAY2.toISOString());
  assert.equal(JSON.stringify(store.sequences) + JSON.stringify(store.messages), before, 'idempotent');
  const later = await plan(store, new Date(DAY2.getTime() + 10 * 86_400_000));
  assert.equal(later.considered, 0);
  assert.equal(store.messages.length, 1);
  assert.equal(store.find(seqId)!.state, 'stopped');
});

test('withdrawn consent stops the sequence at the next step, and no consent on record does too', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await opened(store);
  store.consents.push({ personId: 'p1', state: 'withdrawn', source: 'operator', at: T0.toISOString() });
  const r = await plan(store, DAY2);
  assert.equal(r.lines[0].outcome, 'stopped');
  assert.equal(store.find(seqId)!.stoppedReason, 'consent withdrawn');
  assert.equal(store.messages.length, 0);

  // A sequence that somehow exists with no consent row at all.
  const store2 = new MemoryDripStore();
  person(store2, 'p2');
  const o = await store2.open({ personId: 'p2', requestId: null, resourceId: 'LC-T02', anchorAt: T0.toISOString(), nextSendAt: DAY2.toISOString() });
  const r2 = await plan(store2, DAY2);
  assert.equal(r2.lines[0].outcome, 'stopped');
  assert.equal(store2.find(o.sequenceId!)!.stoppedReason, 'no marketing consent on record');
  assert.equal(store2.messages.length, 0);
});

test('a consent record that does not answer holds the step and gives the lease back', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await opened(store);
  store.consentUnavailable = true;
  const r = await plan(store, DAY2);
  assert.equal(r.lines[0].outcome, 'held');
  assert.equal(store.messages.length, 0);
  assert.equal(store.find(seqId)!.nextSendAt, DAY2.toISOString(), 'still due, not leased');
  store.consentUnavailable = false;
  const r2 = await plan(store, DAY2);
  assert.equal(r2.planned, 1);
});

test('a message already queued under the step\'s key is not written twice', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await opened(store);
  await store.queueMessage({
    idempotencyKey: `drip:${seqId}:1`,
    sequenceId: seqId,
    personId: 'p1',
    templateKey: 'recommend-lc-t07',
    templateVersion: 'x',
    purpose: 'marketing',
    step: 1,
    recipient: 'p1@example.org',
    subject: 's',
    body: 'b',
    scheduledFor: DAY2.toISOString(),
  });
  const r = await plan(store, DAY2);
  assert.equal(r.lines[0].outcome, 'already-queued');
  assert.equal(store.messages.length, 1);
});

test('a planner that died after claiming leaves a lease that expires; the step is then planned once', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await opened(store);
  const leaseUntil = new Date(DAY2.getTime() + 10 * 60_000).toISOString();
  assert.equal(await store.lease(seqId, DAY2.toISOString(), leaseUntil), true);
  const during = await plan(store, DAY2);
  assert.equal(during.considered, 0, 'leased: not due');
  const after = await plan(store, new Date(Date.parse(leaseUntil) + 1000));
  assert.equal(after.planned, 1);
  assert.equal(store.messages.length, 1);
});

test('two planners at once over three due sequences plan each step exactly once', async () => {
  const store = new MemoryDripStore();
  for (const id of ['a', 'b', 'c']) {
    person(store, id);
    await opened(store, id, 'lc-r01');
  }
  const [x, y] = await Promise.all([plan(store, DAY2), plan(store, DAY2)]);
  assert.equal(x.planned + y.planned, 3);
  assert.equal(store.messages.length, 3);
  assert.equal(new Set(store.messages.map((m) => m.idempotencyKey)).size, 3);
  assert.equal(store.sends.length, 3);
  const losses = [...x.lines, ...y.lines].filter((l) => l.outcome === 'lost-lease' || l.outcome === 'already-queued').length;
  assert.equal(losses, 3, 'the other planner lost each race');
});

test('a person whose record is gone stops the sequence rather than addressing nobody', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await opened(store);
  store.people.delete('p1');
  const r = await plan(store, DAY2);
  assert.equal(r.lines[0].outcome, 'stopped');
  assert.equal(store.find(seqId)!.state, 'stopped');
});

test('the brief\'s vocabulary is derived from the state and the reason', () => {
  assert.equal(dripView('active', null), 'active');
  assert.equal(dripView('completed', null), 'completed');
  assert.equal(dripView('stopped', 'unsubscribe'), 'unsubscribed');
  assert.equal(dripView('stopped', 'consent withdrawn'), 'unsubscribed');
  assert.equal(dripView('stopped', 'hard bounce'), 'suppressed');
  assert.equal(dripView('stopped', 'complaint'), 'suppressed');
  assert.equal(dripView('stopped', 'failed permanently'), 'failed');
  assert.equal(dripView('stopped', 'superseded by application'), 'stopped');
});
