// An in-memory DripStore, for the tests and for nothing else in production.
//
// It keeps the same two guarantees the database keeps, because the planner's
// correctness rests on them and a test that skipped them would prove nothing:
// the lease is a compare-and-set on next_send_at, and a message key is unique.
// Everything else is arrays a test can read.

import type { DripMessage, DripPerson, DripSequence, DripStore, OpenRow } from './drip.ts';

export interface MemorySequence extends DripSequence {
  route: string;
  stoppedReason: string | null;
  completedAt: string | null;
}

export interface MemoryMessage extends DripMessage {
  messageId: string;
  state: string;
}

export interface MemorySend {
  sequenceId: string;
  moduleId: string;
  step: number;
  messageId: string | null;
}

export interface MemoryConsent {
  personId: string;
  state: 'granted' | 'withdrawn';
  source: string;
  at: string;
}

export class MemoryDripStore implements DripStore {
  people = new Map<string, DripPerson>();
  /** person id -> request ids (resource_requests.resource_id) */
  requests = new Map<string, string[]>();
  sequences: MemorySequence[] = [];
  messages: MemoryMessage[] = [];
  sends: MemorySend[] = [];
  consents: MemoryConsent[] = [];
  /** Set to make every write fail, for the "could not be written" branches. */
  broken = false;
  private seq = 0;

  private id(prefix: string): string {
    this.seq += 1;
    return `${prefix}-${this.seq}`;
  }

  addPerson(personId: string, p: DripPerson): void {
    this.people.set(personId, p);
  }

  addRequest(personId: string, requestId: string): void {
    this.requests.set(personId, [...(this.requests.get(personId) ?? []), requestId]);
  }

  /** Open an application/enquiry sequence directly, to test "one live sequence". */
  addLiveSequence(personId: string, route: string, state: 'active' | 'paused' = 'active'): string {
    const sequenceId = this.id('seq');
    this.sequences.push({
      sequenceId,
      personId,
      resourceId: '',
      requestId: null,
      state,
      nextSendAt: null,
      stepsSent: 0,
      anchorAt: '2026-01-01T00:00:00.000Z',
      route,
      stoppedReason: null,
      completedAt: null,
    });
    return sequenceId;
  }

  find(sequenceId: string): MemorySequence | undefined {
    return this.sequences.find((s) => s.sequenceId === sequenceId);
  }

  async due(nowISO: string, limit: number): Promise<DripSequence[]> {
    const now = Date.parse(nowISO);
    return this.sequences
      .filter((s) => s.route === 'resource' && s.state === 'active' && s.nextSendAt && Date.parse(s.nextSendAt) <= now)
      .sort((a, b) => Date.parse(a.nextSendAt!) - Date.parse(b.nextSendAt!))
      .slice(0, limit)
      .map((s) => ({ ...s }));
  }

  async lease(sequenceId: string, seenISO: string, untilISO: string): Promise<boolean> {
    const s = this.find(sequenceId);
    if (!s || s.state !== 'active' || !s.nextSendAt) return false;
    if (Date.parse(s.nextSendAt) !== Date.parse(seenISO)) return false;
    s.nextSendAt = untilISO;
    return true;
  }

  async person(personId: string): Promise<DripPerson | null> {
    return this.people.get(personId) ?? null;
  }

  async requestedIds(personId: string): Promise<string[]> {
    return [...(this.requests.get(personId) ?? [])];
  }

  async sentIds(sequenceId: string): Promise<string[]> {
    return this.sends.filter((x) => x.sequenceId === sequenceId).map((x) => x.moduleId);
  }

  async queueMessage(m: DripMessage): Promise<{ messageId: string | null; duplicate: boolean }> {
    if (this.broken) return { messageId: null, duplicate: false };
    const existing = this.messages.find((x) => x.idempotencyKey === m.idempotencyKey);
    if (existing) return { messageId: existing.messageId, duplicate: true };
    const messageId = this.id('msg');
    this.messages.push({ ...m, messageId, state: 'queued' });
    return { messageId, duplicate: false };
  }

  async recordSend(sequenceId: string, moduleId: string, step: number, messageId: string | null): Promise<void> {
    if (this.sends.some((x) => x.sequenceId === sequenceId && (x.moduleId === moduleId || x.step === step))) return;
    this.sends.push({ sequenceId, moduleId, step, messageId });
  }

  async schedule(sequenceId: string, nextSendAtISO: string, stepsSent: number): Promise<void> {
    const s = this.find(sequenceId);
    if (!s) return;
    s.nextSendAt = nextSendAtISO;
    s.stepsSent = stepsSent;
  }

  async complete(sequenceId: string, atISO: string): Promise<void> {
    const s = this.find(sequenceId);
    if (!s) return;
    s.state = 'completed';
    s.completedAt = atISO;
    s.nextSendAt = null;
  }

  async stop(sequenceId: string, reason: string, atISO: string): Promise<void> {
    const s = this.find(sequenceId);
    if (!s) return;
    s.state = 'stopped';
    s.stoppedReason = reason;
    s.nextSendAt = null;
    for (const m of this.messages) {
      if (m.sequenceId === sequenceId && m.state === 'queued') m.state = 'cancelled';
    }
    void atISO;
  }

  async liveSequenceFor(personId: string): Promise<{ sequenceId: string; route: string; state: string } | null> {
    const s = this.sequences.find((x) => x.personId === personId && (x.state === 'active' || x.state === 'paused'));
    return s ? { sequenceId: s.sequenceId, route: s.route, state: s.state } : null;
  }

  /** Set to make the consent read fail, for the "unknown" branch. */
  consentUnavailable = false;

  async consentState(personId: string): Promise<'granted' | 'withdrawn' | 'none' | 'unknown'> {
    if (this.consentUnavailable) return 'unknown';
    const rows = this.consents.filter((c) => c.personId === personId);
    const last = rows[rows.length - 1];
    return last ? last.state : 'none';
  }

  async grantConsent(personId: string, source: string, atISO: string): Promise<boolean> {
    if (this.broken) return false;
    this.consents.push({ personId, state: 'granted', source, at: atISO });
    return true;
  }

  /** What an unsubscribe does to this store: the same four things applyUnsubscribe() does. */
  unsubscribe(personId: string, atISO: string): void {
    this.consents.push({ personId, state: 'withdrawn', source: 'unsubscribe-link', at: atISO });
    for (const s of this.sequences) {
      if (s.personId === personId && (s.state === 'active' || s.state === 'paused')) {
        s.state = 'stopped';
        s.stoppedReason = 'unsubscribe';
        s.nextSendAt = null;
      }
    }
    for (const m of this.messages) {
      if (m.personId === personId && m.purpose === 'marketing' && m.state === 'queued') m.state = 'cancelled';
    }
  }

  async open(row: OpenRow): Promise<{ sequenceId: string | null; duplicate: boolean }> {
    if (this.broken) return { sequenceId: null, duplicate: false };
    if (await this.liveSequenceFor(row.personId)) return { sequenceId: null, duplicate: true };
    const sequenceId = this.id('seq');
    this.sequences.push({
      sequenceId,
      personId: row.personId,
      resourceId: row.resourceId,
      requestId: row.requestId,
      state: 'active',
      nextSendAt: row.nextSendAt,
      stepsSent: 0,
      anchorAt: row.anchorAt,
      route: 'resource',
      stoppedReason: null,
      completedAt: null,
    });
    return { sequenceId, duplicate: false };
  }
}
