// The reply mailbox feed: the signature, the body, the sender's address, and
// what one post does to the records, against a small fake of the client.

import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.COMMS_INBOUND_SECRET = 'an-inbound-secret-long-enough';
process.env.COMMS_REPLY_MAILBOX = 'hello@thelivingcraft.ai';
const { addressOf, applyInbound, inboundSecret, parseInbound, signInbound, verifyInbound } = await import('./inbound.ts');

const SECRET = 'an-inbound-secret-long-enough';
const NOW = new Date('2026-10-06T06:00:00.000Z');
const TS = String(Math.floor(NOW.getTime() / 1000));

test('a signed post verifies; a changed body, an old timestamp or a wrong secret does not', async () => {
  const body = JSON.stringify({ kind: 'heartbeat', source: 'gmail' });
  const sig = await signInbound(SECRET, TS, body);
  assert.equal(await verifyInbound({ secret: SECRET, timestamp: TS, signature: sig, rawBody: body, now: NOW }), true);
  assert.equal(await verifyInbound({ secret: SECRET, timestamp: TS, signature: sig, rawBody: body + ' ', now: NOW }), false);
  assert.equal(await verifyInbound({ secret: SECRET, timestamp: TS, signature: sig, rawBody: body, now: new Date(NOW.getTime() + 400_000) }), false);
  assert.equal(await verifyInbound({ secret: 'another-secret-long-enough', timestamp: TS, signature: sig, rawBody: body, now: NOW }), false);
  assert.equal(await verifyInbound({ secret: SECRET, timestamp: null, signature: sig, rawBody: body, now: NOW }), false);
});

test('a secret shorter than 16 characters closes the endpoint', () => {
  assert.equal(inboundSecret(), SECRET);
  process.env.COMMS_INBOUND_SECRET = 'short';
  assert.equal(inboundSecret(), '');
  process.env.COMMS_INBOUND_SECRET = SECRET;
});

test('the sender\'s address is read from either form, lower-cased; anything else is null', () => {
  assert.equal(addressOf('Asha Rao <Asha.Rao@Example.org>'), 'asha.rao@example.org');
  assert.equal(addressOf('asha@example.org'), 'asha@example.org');
  assert.equal(addressOf('"Rao, Asha" <asha@example.org>'), 'asha@example.org');
  assert.equal(addressOf('no address here'), null);
});

test('only a heartbeat or a well-formed reply is acted on', () => {
  assert.deepEqual(parseInbound({ kind: 'heartbeat', source: 'gmail' }), { kind: 'heartbeat', source: 'gmail' });
  const r = parseInbound({ kind: 'reply', source: 'gmail', messageId: '<a@b>', from: 'A <a@x.org>', receivedAt: '2026-10-06T05:00:00Z' });
  assert.equal(r?.kind, 'reply');
  assert.equal(parseInbound({ kind: 'reply', source: 'gmail', from: 'a@x.org' }), null, 'no Message-ID');
  assert.equal(parseInbound({ kind: 'reply', source: 'Bad Source!', messageId: 'x', from: 'a@x.org' }), null);
  assert.equal(parseInbound({ kind: 'delete-everything', source: 'gmail' }), null);
  assert.equal(parseInbound('nope'), null);
});

// ── a fake of the few Supabase calls applyInbound makes ────────────────────

interface Row {
  [k: string]: unknown;
}

function fakeClient(tables: Record<string, Row[]>) {
  const unique = new Set<string>();
  const from = (table: string) => {
    let rows = [...(tables[table] ?? [])];
    const q = {
      select: () => q,
      eq: (k: string, v: unknown) => ((rows = rows.filter((r) => r[k] === v)), q),
      in: (k: string, vs: unknown[]) => ((rows = rows.filter((r) => vs.includes(r[k]))), q),
      not: (k: string) => ((rows = rows.filter((r) => r[k] !== null && r[k] !== undefined)), q),
      order: () => q,
      limit: () => q,
      maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
      upsert: async (row: Row) => {
        tables[table] = [...(tables[table] ?? []).filter((r) => r.source !== row.source), { ...(tables[table] ?? []).find((r) => r.source === row.source), ...row }];
        return { error: null };
      },
      insert: async (row: Row) => {
        const key = `${row.provider}|${row.provider_event_id}`;
        if (table === 'comms_events') {
          if (unique.has(key)) return { error: { code: '23505' } };
          unique.add(key);
        }
        tables[table] = [...(tables[table] ?? []), row];
        return { error: null };
      },
    };
    return q;
  };
  return { from } as unknown as Parameters<typeof applyInbound>[0];
}

const reply = (from: string, messageId = '<m1@mail>') =>
  parseInbound({ kind: 'reply', source: 'gmail', messageId, from, receivedAt: '2026-10-06T05:55:00Z' })!;

test('a reply from a known person is recorded once, and pauses their live follow-up', async () => {
  const tables: Record<string, Row[]> = {
    people: [{ person_id: 'p1', normalised_email: 'asha@example.org' }],
    comms_messages: [{ message_id: 'm-sent', person_id: 'p1', sent_at: '2026-10-05T04:30:00Z' }],
    comms_sequences: [{ sequence_id: 's1', person_id: 'p1', route: 'resource', state: 'active' }],
  };
  const paused: string[] = [];
  const stopped: string[] = [];
  const actions = { pause: async (id: string) => paused.push(id), stop: async (id: string) => stopped.push(id) };

  const client = fakeClient(tables);
  assert.equal(await applyInbound(client, reply('Asha <ASHA@example.org>'), actions, NOW), 'recorded');
  assert.equal(tables.comms_events.length, 1);
  const ev = tables.comms_events[0];
  assert.equal(ev.type, 'reply');
  assert.equal(ev.person_id, 'p1');
  assert.equal(ev.message_id, 'm-sent');
  assert.equal(ev.provider, 'inbound:gmail');
  assert.ok(!JSON.stringify(ev).includes('asha@'), 'the address is matched, never stored');
  assert.deepEqual(paused, ['s1']);
  assert.deepEqual(stopped, []);
  assert.equal(tables.comms_inbound_status[0].last_seen_at, NOW.toISOString());

  assert.equal(await applyInbound(client, reply('asha@example.org'), actions, NOW), 'duplicate', 'the same Message-ID twice');
  assert.equal(tables.comms_events.length, 1);
});

test('a reply stops a cohort sequence rather than pausing it', async () => {
  const tables: Record<string, Row[]> = {
    people: [{ person_id: 'p2', normalised_email: 'ravi@example.org' }],
    comms_sequences: [{ sequence_id: 's2', person_id: 'p2', route: 'application', state: 'active' }],
  };
  const stopped: string[] = [];
  await applyInbound(fakeClient(tables), reply('ravi@example.org', '<m2@mail>'), { pause: async () => 0, stop: async (id) => stopped.push(id) }, NOW);
  assert.deepEqual(stopped, ['s2']);
});

test('an unknown sender and our own mailbox are acknowledged and not recorded; a heartbeat only touches the clock', async () => {
  const tables: Record<string, Row[]> = { people: [] };
  const actions = { pause: async () => 0, stop: async () => 0 };
  assert.equal(await applyInbound(fakeClient(tables), reply('stranger@example.org'), actions, NOW), 'unknown sender');
  assert.equal(await applyInbound(fakeClient(tables), reply('The Living Craft <hello@thelivingcraft.ai>'), actions, NOW), 'own mailbox');
  assert.equal(await applyInbound(fakeClient(tables), { kind: 'heartbeat', source: 'gmail' }, actions, NOW), 'heartbeat');
  assert.equal((tables.comms_events ?? []).length, 0);
  assert.equal(tables.comms_inbound_status.length, 1);
  assert.equal(await applyInbound(null, { kind: 'heartbeat', source: 'gmail' }, actions, NOW), 'no store');
});
