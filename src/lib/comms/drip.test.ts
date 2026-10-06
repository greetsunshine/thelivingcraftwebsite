// The resource follow-ups, end to end against the in-memory store, with the
// clock in the test's hand.
//
// The rules under test come from the resource brief
// (05-email-and-resource-routing, revised 29 September 2026). The ones that
// matter most, because each one failing is silent:
//   * nothing but the confirmation request goes until the person clicks it;
//   * days 2, 5, 9 and 14 from the click, then weekly; weekdays at 10:00 IST;
//     never less than 48 hours apart; no catch-up burst;
//   * a reply, a call, an application or a payment pauses it, and nothing
//     resumes it except a person;
//   * never the resource they asked for, never one already sent, never one
//     Sunil has not released;
//   * a step is planned once, whatever runs the planner and however often.
//
// Run with `npm test`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_DRIP_CONFIG,
  confirmDrip,
  dripConfig,
  dripView,
  openResourceDrip,
  recommend,
  rollToWeekday,
  runDripPlanner,
  sendSlot,
  slotForStep,
} from './drip.ts';
import { MemoryDripStore } from './drip-memory.ts';
import { DRIP_MODULES, RELEASES, moduleForRequestId, type DripModule } from '../../data/resource-routing.ts';
import { CONFIRM_ACTION, CONFIRMATION_TEMPLATE, DRIP_TEMPLATES, dripTemplateFor, fillDripBody, relevanceSentence } from './drip-templates.ts';

const IST = 'Asia/Kolkata';
const COHORT = 'Explore the cohort: https://learning.thelivingcraft.ai/#apply';
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

// Thursday 1 October 2026, 10:30 IST.
const T0 = new Date('2026-10-01T05:00:00.000Z');
// 10:00 IST is 04:30 UTC.
const at10 = (date: string) => new Date(`${date}T04:30:00.000Z`);

/** The live catalogue with every active module released, as it will be once Sunil confirms them. */
const RELEASED: readonly DripModule[] = DRIP_MODULES.map((m) => ({ ...m, released: true }));

const person = (store: MemoryDripStore, id = 'p1', role = 'Founder / Business Owner', roleCode: string | null = null) => {
  store.addPerson(id, { firstName: 'Asha', recipient: `${id}@example.org`, role, roleCode });
  return id;
};

/** Tick the box on a download, at T0. */
const ticked = async (store: MemoryDripStore, personId = 'p1', requestResourceId = 'lc-r01', now = T0) => {
  store.addRequest(personId, requestResourceId);
  const out = await openResourceDrip(store, { personId, requestId: `req-${personId}`, requestResourceId, consented: true, now });
  assert.equal(out.opened, true);
  return out.opened ? out.sequenceId : '';
};

/** Tick, then click the confirmation link at `confirmAt`. Sends the confirmation request on the way. */
const confirmed = async (store: MemoryDripStore, personId = 'p1', requestResourceId = 'lc-r01', confirmAt = T0) => {
  const seqId = await ticked(store, personId, requestResourceId, confirmAt);
  store.sweep(confirmAt.toISOString());
  assert.equal(await confirmDrip(store, { sequenceId: seqId, personId, now: confirmAt }), 'confirmed');
  return seqId;
};

const plan = (store: MemoryDripStore, now: Date, catalogue: readonly DripModule[] = RELEASED) =>
  runDripPlanner(store, { now, cohortInvitation: COHORT, catalogue });

const marketing = (store: MemoryDripStore) => store.messages.filter((m) => m.purpose === 'marketing');

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

test('every module starts unreleased: "All begin disabled pending technical review"', () => {
  assert.deepEqual(Object.keys(RELEASES), []);
  assert.ok(DRIP_MODULES.every((m) => m.released === false));
  assert.equal(recommend({ initial: 'LC-T01', excluded: [], roleCode: null }), null, 'the live catalogue selects nothing yet');
});

test('a request id maps to its module, and a guide has no request id', () => {
  assert.equal(moduleForRequestId('lc-r01')?.id, 'LC-R01');
  assert.equal(moduleForRequestId('poc-screen')?.id, 'LC-T01');
  assert.equal(moduleForRequestId('template-decision-record')?.id, 'LC-TPL03');
  assert.equal(moduleForRequestId('no-such-thing'), undefined);
  assert.deepEqual(DRIP_MODULES.find((m) => m.id === 'LC-G01')?.requestIds, []);
});

test('the confirmation request is the brief\'s wording, transactional, with the link placeholder and no cohort promotion', () => {
  assert.equal(CONFIRMATION_TEMPLATE.purpose, 'transactional');
  assert.equal(CONFIRMATION_TEMPLATE.subject, 'Confirm your Living Craft resource emails');
  assert.ok(CONFIRMATION_TEMPLATE.body.includes(`Confirm my subscription: ${CONFIRM_ACTION}`));
  assert.ok(CONFIRMATION_TEMPLATE.body.includes("If you didn't ask for these updates, ignore this email. You won't be added to the sequence."));
  assert.ok(!/apply|cohort starts|seats?/i.test(CONFIRMATION_TEMPLATE.body.replace('cohort updates', '')), 'no promotion');
  assert.deepEqual(CONFIRMATION_TEMPLATE.actions, []);
});

// ── the relevance sentence ─────────────────────────────────────────────────

test('at most one relevance sentence: the request first, then a stated role, then none', () => {
  assert.equal(
    relevanceSentence({ requestedTitle: 'The POC Selection Tool', roleCode: 'engineer' }),
    'You requested the POC Selection Tool. This resource looks at another decision around the same kind of workflow.',
  );
  assert.match(relevanceSentence({ requestedTitle: null, roleCode: 'engineering_leader' })!, /^You mentioned leading an engineering team/);
  assert.match(relevanceSentence({ requestedTitle: null, roleCode: 'engineer' })!, /^You mentioned hands-on engineering work/);
  assert.match(relevanceSentence({ requestedTitle: null, roleCode: 'architect' })!, /^You mentioned architecture work/);
  assert.equal(relevanceSentence({ requestedTitle: null, roleCode: 'founder' }), null, 'no sentence is invented for a role the brief does not cover');
  assert.equal(relevanceSentence({ requestedTitle: null, roleCode: null }), null);
});

test('with no relevance sentence the module reads complete: "Hi," and no empty paragraph', () => {
  const body = 'Hi {{first_name}},\n\n{{relevance}}\n\nThe bridge.\n\nThe resource.';
  assert.equal(fillDripBody(body, { firstName: null, relevance: null, cohortInvitation: '' }), 'Hi,\n\nThe bridge.\n\nThe resource.');
  assert.equal(
    fillDripBody(body, { firstName: 'Asha', relevance: 'One sentence.', cohortInvitation: '' }),
    'Hi Asha,\n\nOne sentence.\n\nThe bridge.\n\nThe resource.',
  );
});

// ── selection ──────────────────────────────────────────────────────────────

test('the initial resource is never recommended, and its preferred list comes first, in order', () => {
  const first = recommend({ initial: 'LC-T01', excluded: [], roleCode: null, catalogue: RELEASED });
  assert.equal(first?.id, 'LC-G01');
  const second = recommend({ initial: 'LC-T01', excluded: ['LC-G01'], roleCode: null, catalogue: RELEASED });
  assert.equal(second?.id, 'LC-TPL01');
  for (let i = 0; i < 30; i++) {
    const pick = recommend({ initial: 'LC-T01', excluded: RELEASED.slice(0, i).map((m) => m.id), roleCode: null, catalogue: RELEASED });
    assert.notEqual(pick?.id, 'LC-T01');
  }
});

test('once the preferred list is used up, the role decides, then catalogue order', () => {
  const exhausted = ['LC-G03', 'LC-T03', 'LC-T04', 'LC-TPL02']; // LC-R02's list
  const r = (roleCode: Parameters<typeof recommend>[0]['roleCode']) =>
    recommend({ initial: 'LC-R02', excluded: exhausted, roleCode, catalogue: RELEASED })?.id;
  assert.equal(r('founder'), 'LC-T01');
  assert.equal(r('engineer'), 'LC-T02');
  assert.equal(r(null), 'LC-T01', 'no role: catalogue order');
  assert.equal(r('student'), 'LC-TPL04', 'a student: the one module that names students');
});

test('a role the brief names goes first: an engineering leader gets the review agenda, an architect the authority review', () => {
  // LC-R01's own list would start with LC-T07.
  assert.equal(recommend({ initial: 'LC-R01', excluded: [], roleCode: null, catalogue: RELEASED })?.id, 'LC-T07');
  assert.equal(recommend({ initial: 'LC-R01', excluded: [], roleCode: 'engineering_leader', catalogue: RELEASED })?.id, 'LC-TPL02');
  assert.equal(recommend({ initial: 'LC-R01', excluded: ['LC-TPL02'], roleCode: 'engineering_leader', catalogue: RELEASED })?.id, 'LC-TPL03');
  assert.equal(recommend({ initial: 'LC-R01', excluded: [], roleCode: 'architect', catalogue: RELEASED })?.id, 'LC-T02');
  // Once both are used, the topic order takes over.
  assert.equal(recommend({ initial: 'LC-R01', excluded: ['LC-T02', 'LC-TPL01'], roleCode: 'architect', catalogue: RELEASED })?.id, 'LC-T07');
  // An engineer has no priority in the brief.
  assert.equal(recommend({ initial: 'LC-R01', excluded: [], roleCode: 'engineer', catalogue: RELEASED })?.id, 'LC-T07');
});

test('an inactive or unreleased module is skipped even when the matrix prefers it', () => {
  const base = { ...DRIP_MODULES[0], preferredFollowUps: [] as string[], released: true, active: true };
  const cat: DripModule[] = [
    { ...base, id: 'A', preferredFollowUps: ['B', 'C', 'D'], priority: 1 },
    { ...base, id: 'B', active: false, priority: 2 },
    { ...base, id: 'C', released: false, priority: 3 },
    { ...base, id: 'D', priority: 4 },
  ];
  assert.equal(recommend({ initial: 'A', excluded: [], roleCode: null, catalogue: cat })?.id, 'D');
  assert.equal(recommend({ initial: 'A', excluded: ['D'], roleCode: null, catalogue: cat }), null);
});

// ── the calendar ───────────────────────────────────────────────────────────

test('a calendar day is the reader\'s calendar day, on both sides of a daylight-saving change', () => {
  assert.equal(sendSlot('2026-10-01T20:00:00.000Z', 2, IST, 10), '2026-10-04T04:30:00.000Z');
  assert.equal(sendSlot('2026-10-01T18:00:00.000Z', 2, IST, 10), '2026-10-03T04:30:00.000Z');
  assert.equal(sendSlot('2026-09-30T06:00:00.000Z', 2, IST, 10), '2026-10-02T04:30:00.000Z');
  assert.equal(sendSlot('2026-03-27T12:00:00.000Z', 2, 'Europe/London', 10), '2026-03-29T09:00:00.000Z');
  assert.equal(sendSlot('2026-10-24T12:00:00.000Z', 1, 'Europe/London', 10), '2026-10-25T10:00:00.000Z');
});

test('a weekend slot moves to Monday 10:00', () => {
  assert.equal(rollToWeekday(at10('2026-10-03').toISOString(), IST, 10), at10('2026-10-05').toISOString(), 'Saturday');
  assert.equal(rollToWeekday(at10('2026-10-04').toISOString(), IST, 10), at10('2026-10-05').toISOString(), 'Sunday');
  assert.equal(rollToWeekday(at10('2026-10-06').toISOString(), IST, 10), at10('2026-10-06').toISOString(), 'Tuesday stays');
});

test('steps 1 to 4 fall on days 2, 5, 9 and 14 after the click, moved off weekends and kept 48 hours apart', () => {
  const enrolledAt = T0.toISOString(); // Thursday 1 October
  const s = (step: number, lastSentAt: string | null) => slotForStep({ step, enrolledAt, lastSentAt });
  // Day 2 is Saturday 3 October: Monday 5.
  assert.equal(s(1, null), at10('2026-10-05').toISOString());
  // Day 5 is Tuesday 6, but that is 24 hours after Monday's send: Wednesday 7, exactly 48 hours on.
  assert.equal(s(2, at10('2026-10-05').toISOString()), at10('2026-10-07').toISOString());
  // Day 9 is Saturday 10: Monday 12.
  assert.equal(s(3, at10('2026-10-07').toISOString()), at10('2026-10-12').toISOString());
  // Day 14 is Thursday 15.
  assert.equal(s(4, at10('2026-10-12').toISOString()), at10('2026-10-15').toISOString());
  // Then seven days after the last actual send.
  assert.equal(s(5, at10('2026-10-15').toISOString()), at10('2026-10-22').toISOString());
  // A late send moves the weekly step with it.
  assert.equal(s(5, '2026-10-16T09:00:00.000Z'), at10('2026-10-23').toISOString());
});

test('the 48-hour floor rolls to the next weekday slot after it, not to the minute', () => {
  // Sent Friday 9 October at 15:00 IST. 48 hours on is Sunday 15:00: next weekday 10:00 is Monday 12.
  const last = '2026-10-09T09:30:00.000Z';
  assert.equal(slotForStep({ step: 3, enrolledAt: T0.toISOString(), lastSentAt: last }), at10('2026-10-12').toISOString());
});

test('only the hour and the zone can be configured; the brief\'s offsets cannot be overridden', () => {
  const cfg = dripConfig((k) => ({ COMMS_DRIP_INTERVAL_DAYS: '1', COMMS_DRIP_SEND_HOUR: 'noon', COMMS_DRIP_TIMEZONE: 'Mars/Olympus' })[k] ?? '');
  assert.deepEqual(cfg.offsets, [2, 5, 9, 14]);
  assert.equal(cfg.weeklyDays, 7);
  assert.equal(cfg.minGapHours, 48);
  assert.equal(cfg.hour, 10);
  assert.equal(cfg.zone, IST);
  assert.equal(dripConfig((k) => ({ COMMS_DRIP_SEND_HOUR: '9' })[k] ?? '').hour, 9);
});

// ── opening: the tick ──────────────────────────────────────────────────────

test('without the box ticked, nothing opens, no consent is written and no email is queued', async () => {
  const store = new MemoryDripStore();
  person(store);
  const out = await openResourceDrip(store, { personId: 'p1', requestId: 'r1', requestResourceId: 'lc-r01', consented: false, now: T0 });
  assert.equal(out.opened, false);
  assert.equal(store.sequences.length, 0);
  assert.equal(store.consents.length, 0);
  assert.equal(store.messages.length, 0);
});

test('a tick opens the sequence awaiting confirmation and queues exactly one email: the confirmation request', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await ticked(store);
  const seq = store.find(seqId)!;
  assert.equal(seq.state, 'awaiting_confirmation');
  assert.equal(seq.nextSendAt, null);
  assert.equal(seq.resourceId, 'LC-R01');
  assert.deepEqual(store.consents.map((c) => [c.state, c.source, c.confirmedAt]), [['granted', 'resource-gate', null]]);
  assert.equal(store.messages.length, 1);
  const m = store.messages[0];
  assert.equal(m.purpose, 'transactional');
  assert.equal(m.templateKey, 'confirm-resource-emails');
  assert.equal(m.idempotencyKey, `confirm:${seqId}:1`);
  assert.equal(m.step, 0);
  assert.ok(m.body.includes(CONFIRM_ACTION), 'the link is minted at dispatch, never stored');
});

test('nothing marketing is ever planned for a sequence that is not confirmed', async () => {
  const store = new MemoryDripStore();
  person(store);
  await ticked(store);
  for (let d = 0; d < 40; d++) await plan(store, new Date(T0.getTime() + d * DAY));
  assert.equal(marketing(store).length, 0);
});

test('a second tick while waiting re-sends the request, at most once a day, and opens nothing new', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await ticked(store);
  const again = (now: Date) => openResourceDrip(store, { personId: 'p1', requestId: 'r2', requestResourceId: 'poc-screen', consented: true, now });
  await again(new Date(T0.getTime() + HOUR)); // same IST day
  assert.equal(store.messages.length, 2, 'the first re-send that day');
  await again(new Date(T0.getTime() + 2 * HOUR));
  assert.equal(store.messages.length, 2, 'not a third the same day');
  await again(new Date(T0.getTime() + DAY));
  assert.equal(store.messages.length, 3, 'one more the next day');
  assert.equal(store.sequences.length, 1);
  assert.ok(store.messages.every((m) => m.sequenceId === seqId && m.purpose === 'transactional'));
});

test('a person already in the application sequence keeps that one; the permission is still recorded', async () => {
  const store = new MemoryDripStore();
  person(store);
  store.addLiveSequence('p1', 'application');
  const out = await openResourceDrip(store, { personId: 'p1', requestId: 'r1', requestResourceId: 'lc-r01', consented: true, now: T0 });
  assert.equal(out.opened, false);
  assert.match(out.opened ? '' : out.why, /already has a active application sequence/);
  assert.equal(store.consents.length, 1);
  assert.equal(store.messages.length, 0);
});

test('a person who has had a follow-up sequence before is not re-enrolled by another tick', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  store.find(seqId)!.state = 'completed';
  const out = await openResourceDrip(store, { personId: 'p1', requestId: 'r9', requestResourceId: 'poc-screen', consented: true, now: new Date(T0.getTime() + 60 * DAY) });
  assert.equal(out.opened, false);
  assert.match(out.opened ? '' : out.why, /does not re-enrol/);
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

// ── confirming: the click ──────────────────────────────────────────────────

test('the click activates the sequence, writes a confirmed consent row, and sets step 1 to day 2', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await ticked(store);
  const outcome = await confirmDrip(store, { sequenceId: seqId, personId: 'p1', now: T0 });
  assert.equal(outcome, 'confirmed');
  const seq = store.find(seqId)!;
  assert.equal(seq.state, 'active');
  assert.equal(seq.confirmedAt, T0.toISOString());
  assert.equal(seq.nextSendAt, at10('2026-10-05').toISOString(), 'day 2 is a Saturday: Monday');
  assert.equal(store.consents.at(-1)!.confirmedAt, T0.toISOString());
  assert.equal(await store.consentState('p1'), 'confirmed');
});

test('a second click changes nothing; somebody else\'s link and a stopped sequence are "gone"', async () => {
  const store = new MemoryDripStore();
  person(store);
  person(store, 'p2');
  const seqId = await ticked(store);
  assert.equal(await confirmDrip(store, { sequenceId: seqId, personId: 'p1', now: T0 }), 'confirmed');
  const before = JSON.stringify(store.sequences);
  assert.equal(await confirmDrip(store, { sequenceId: seqId, personId: 'p1', now: new Date(T0.getTime() + HOUR) }), 'already');
  assert.equal(JSON.stringify(store.sequences), before);
  assert.equal(await confirmDrip(store, { sequenceId: seqId, personId: 'p2', now: T0 }), 'gone');
  assert.equal(await confirmDrip(store, { sequenceId: 'no-such', personId: 'p1', now: T0 }), 'gone');

  const s2 = new MemoryDripStore();
  person(s2);
  const id2 = await ticked(s2);
  s2.unsubscribe('p1', T0.toISOString());
  assert.equal(await confirmDrip(s2, { sequenceId: id2, personId: 'p1', now: T0 }), 'gone', 'an unsubscribe is never undone by a link');
  assert.equal(s2.find(id2)!.state, 'stopped');
});

test('sequences opened before 6 October, moved back to awaiting, are each sent the request once', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = store.addLiveSequence('p1', 'resource', 'awaiting_confirmation');
  const r1 = await plan(store, T0);
  assert.equal(r1.confirmationsQueued, 1);
  const r2 = await plan(store, new Date(T0.getTime() + HOUR));
  assert.equal(r2.confirmationsQueued, 0);
  assert.deepEqual(store.messages.map((m) => [m.idempotencyKey, m.purpose]), [[`confirm:${seqId}:1`, 'transactional']]);
});

// ── the planner ────────────────────────────────────────────────────────────

test('on the first slot one message goes with the name, the relevance sentence and the cohort block', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  const day2 = at10('2026-10-05');

  const early = await plan(store, new Date(day2.getTime() - 60_000));
  assert.equal(early.considered, 0);

  const r = await plan(store, day2);
  assert.equal(r.planned, 1);
  assert.equal(r.lines[0].moduleId, 'LC-T07', 'LC-R01 prefers LC-T07 first');
  const [m] = marketing(store);
  assert.equal(m.idempotencyKey, `drip:${seqId}:1`);
  assert.equal(m.recipient, 'p1@example.org');
  assert.equal(m.subject, 'What does an acceptable outcome cost?');
  assert.match(m.body, /^Hi Asha,\n\nYou requested the Cost-Ceiling Worksheet\. This resource looks at another decision around the same kind of workflow\.\n\n/);
  assert.match(m.body, /Use the Run-Cost Model: https:\/\/learning\.thelivingcraft\.ai\/resources\/run-cost-model/);
  assert.ok(m.body.includes(COHORT));
  assert.ok(m.body.endsWith('{{action:unsubscribe}}'));
  assert.ok(!/\{\{(first_name|relevance|cohort_invitation)\}\}/.test(m.body));
  assert.equal(store.find(seqId)!.stepsSent, 1);

  const again = await plan(store, day2);
  assert.equal(again.considered, 0, 'the same instant plans nothing twice');
});

test('the whole run lands on the brief\'s calendar: Mon 5, Wed 7, Mon 12, Thu 15, Thu 22 October', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  const sentAt: string[] = [];
  for (let i = 0; i < 5; i++) {
    const seq = store.find(seqId)!;
    // Run the clock forward in ten-minute ticks, like the cron, until a step is planned.
    let now = new Date(Math.max(Date.parse(seq.nextSendAt!), T0.getTime()));
    let r = await plan(store, now);
    let guard = 0;
    while (r.planned === 0 && guard++ < 2000) {
      now = new Date(Date.parse(store.find(seqId)!.nextSendAt!));
      r = await plan(store, now);
    }
    assert.equal(r.planned, 1);
    store.sweep(now.toISOString());
    sentAt.push(now.toISOString());
  }
  assert.deepEqual(sentAt, ['2026-10-05', '2026-10-07', '2026-10-12', '2026-10-15', '2026-10-22'].map((d) => at10(d).toISOString()));
});

test('no catch-up burst: with dispatch off for three weeks, one message waits and nothing piles up behind it', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  await plan(store, at10('2026-10-05'));
  assert.equal(marketing(store).length, 1);
  // Nothing is swept. The cron keeps running.
  for (let t = at10('2026-10-05').getTime(); t < at10('2026-10-26').getTime(); t += 6 * HOUR) await plan(store, new Date(t));
  assert.equal(marketing(store).length, 1, 'still one');
  assert.equal(store.find(seqId)!.stepsSent, 1);
  // Dispatch comes on: the waiting one goes on Monday 26. The next is 48 hours later at the earliest.
  store.sweep(at10('2026-10-26').toISOString());
  const r = await plan(store, new Date(at10('2026-10-26').getTime() + HOUR));
  assert.equal(r.planned, 0);
  assert.equal(store.find(seqId)!.nextSendAt, at10('2026-10-28').toISOString());
});

test('a reply pauses the sequence, cancels what is queued, and nothing restarts it on its own', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  await plan(store, at10('2026-10-05'));
  store.addSignal('p1', 'the person replied', at10('2026-10-05').toISOString());
  // The queued step has not gone; the next due check pauses.
  await plan(store, new Date(at10('2026-10-05').getTime() + 2 * HOUR));
  const seq = store.find(seqId)!;
  assert.equal(seq.state, 'paused');
  assert.equal(seq.pausedReason, 'the person replied');
  assert.equal(marketing(store)[0].state, 'cancelled');
  for (let d = 1; d < 30; d++) await plan(store, new Date(at10('2026-10-05').getTime() + d * DAY));
  assert.equal(store.find(seqId)!.state, 'paused');
  assert.equal(marketing(store).length, 1);
});

test('after a reviewed resume the old reply is not read again, and a new one pauses it again', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  store.addSignal('p1', 'the person replied', at10('2026-10-02').toISOString());
  await plan(store, at10('2026-10-05'));
  assert.equal(store.find(seqId)!.state, 'paused');

  store.resume(seqId, at10('2026-10-08').toISOString());
  const r = await plan(store, at10('2026-10-08'));
  assert.equal(r.planned, 1, 'the reviewed reply does not pause it again');

  store.sweep(at10('2026-10-08').toISOString());
  store.addSignal('p1', 'the person booked a call', at10('2026-10-09').toISOString());
  await plan(store, at10('2026-10-12'));
  assert.equal(store.find(seqId)!.state, 'paused');
  assert.equal(store.find(seqId)!.pausedReason, 'the person booked a call');
});

test('an open application pauses it whenever it was opened, until somebody reviews it', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  store.addSignal('p1', 'the person has an open application or enquiry', '2026-09-01T00:00:00.000Z', true);
  await plan(store, at10('2026-10-05'));
  assert.equal(store.find(seqId)!.state, 'paused');
  assert.equal(marketing(store).length, 0);
});

test('when the pause signals cannot be read, nothing is sent and the step is checked again', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  store.signalsUnavailable = true;
  const r = await plan(store, at10('2026-10-05'));
  assert.equal(r.lines[0].outcome, 'held');
  assert.equal(marketing(store).length, 0);
  assert.equal(store.find(seqId)!.state, 'active');
});

test('with nothing released, a confirmed sequence waits; it is not ended as exhausted', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  const r = await plan(store, at10('2026-10-05'), DRIP_MODULES);
  assert.equal(r.lines[0].outcome, 'held');
  assert.match(r.lines[0].detail, /released/);
  assert.equal(store.find(seqId)!.state, 'active');
  assert.equal(marketing(store).length, 0);
});

test('the sequence never repeats a resource, never sends a requested one, and is exhausted when the catalogue is used up', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  const sent: string[] = [];
  let now = at10('2026-10-05');
  for (let i = 0; i < 400 && store.find(seqId)!.state === 'active'; i++) {
    const r = await plan(store, now);
    for (const l of r.lines) if (l.outcome === 'planned') sent.push(l.moduleId!);
    if (i === 0) store.addRequest('p1', 'poc-screen');
    store.sweep(now.toISOString());
    const next = store.find(seqId)!.nextSendAt;
    if (!next) break;
    now = new Date(Math.max(Date.parse(next), now.getTime() + 60_000));
  }
  assert.equal(store.find(seqId)!.state, 'completed');
  assert.equal(dripView('completed', null), 'exhausted');
  assert.equal(new Set(sent).size, sent.length, 'no resource twice');
  assert.ok(!sent.includes('LC-R01') && !sent.includes('LC-T01'), 'never one they asked for');
  assert.ok(!sent.includes('LC-T10') && !sent.includes('LC-T11'), 'never an inactive module');
  assert.equal(sent.length, RELEASED.filter((m) => m.active).length - 2);
});

test('an unsubscribe cancels what is queued and stops the rest; withdrawn consent stops it at the next step', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  await plan(store, at10('2026-10-05'));
  store.unsubscribe('p1', at10('2026-10-05').toISOString());
  assert.equal(marketing(store)[0].state, 'cancelled');
  assert.equal(dripView('stopped', store.find(seqId)!.stoppedReason), 'unsubscribed');

  const s2 = new MemoryDripStore();
  person(s2);
  const id2 = await confirmed(s2);
  s2.consents.push({ personId: 'p1', state: 'withdrawn', source: 'operator', at: T0.toISOString(), confirmedAt: null });
  const r = await plan(s2, at10('2026-10-05'));
  assert.equal(r.lines[0].outcome, 'stopped');
  assert.equal(s2.find(id2)!.stoppedReason, 'consent withdrawn');
});

test('a consent record that does not answer holds the step and gives the lease back', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  store.consentUnavailable = true;
  const r = await plan(store, at10('2026-10-05'));
  assert.equal(r.lines[0].outcome, 'held');
  assert.equal(store.find(seqId)!.nextSendAt, at10('2026-10-05').toISOString(), 'still due, not leased');
  store.consentUnavailable = false;
  assert.equal((await plan(store, at10('2026-10-05'))).planned, 1);
});

test('two planners at once over three due sequences plan each step exactly once', async () => {
  const store = new MemoryDripStore();
  for (const id of ['a', 'b', 'c']) {
    person(store, id);
    await confirmed(store, id);
  }
  const day2 = at10('2026-10-05');
  const [x, y] = await Promise.all([plan(store, day2), plan(store, day2)]);
  assert.equal(x.planned + y.planned, 3);
  assert.equal(marketing(store).length, 3);
  assert.equal(new Set(marketing(store).map((m) => m.idempotencyKey)).size, 3);
});

test('a planner that died after claiming leaves a lease that expires; the step is then planned once', async () => {
  const store = new MemoryDripStore();
  person(store);
  const seqId = await confirmed(store);
  const day2 = at10('2026-10-05');
  const leaseUntil = new Date(day2.getTime() + 10 * 60_000).toISOString();
  assert.equal(await store.lease(seqId, day2.toISOString(), leaseUntil), true);
  assert.equal((await plan(store, day2)).considered, 0);
  assert.equal((await plan(store, new Date(Date.parse(leaseUntil) + 1000))).planned, 1);
  assert.equal(marketing(store).length, 1);
});

test('the brief\'s vocabulary is derived from the state and the reason', () => {
  assert.equal(dripView('awaiting_confirmation', null), 'awaiting confirmation');
  assert.equal(dripView('active', null), 'active');
  assert.equal(dripView('paused', null), 'paused');
  assert.equal(dripView('completed', null), 'exhausted');
  assert.equal(dripView('stopped', 'unsubscribe'), 'unsubscribed');
  assert.equal(dripView('stopped', 'hard bounce'), 'suppressed');
  assert.equal(dripView('stopped', 'superseded by application'), 'stopped');
  assert.equal(DEFAULT_DRIP_CONFIG.hour, 10);
});
