// An in-memory DripStore, for the tests and for nothing else in production.
//
// It keeps the same guarantees the database keeps, because the planner's
// correctness rests on them and a test that skipped them would prove nothing:
// the lease is a compare-and-set on next_send_at, a message key is unique,
// one live sequence per person, and activation only moves a sequence that is
// still awaiting confirmation. Everything else is arrays a test can read.

import type {
  ConsentRead,
  DripMessage,
  DripPerson,
  DripSequence,
  DripState,
  DripStore,
  OpenRow,
  StepStatus,
} from './drip.ts';

export interface MemorySequence extends DripSequence {
  route: string;
  stoppedReason: string | null;
  pausedReason: string | null;
  completedAt: string | null;
}

export interface MemoryMessage extends DripMessage {
  messageId: string;
  state: string;
  sentAt: string | null;
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
  confirmedAt: string | null;
}

const LIVE: readonly string[] = ['awaiting_confirmation', 'active', 'paused'];

export class MemoryDripStore implements DripStore {
  people = new Map<string, DripPerson>();
  /** person id -> request ids (resource_requests.resource_id) */
  requests = new Map<string, string[]>();
  sequences: MemorySequence[] = [];
  messages: MemoryMessage[] = [];
  sends: MemorySend[] = [];
  consents: MemoryConsent[] = [];
  /** person id -> pause reasons, with the instant each happened. */
  signals = new Map<string, { reason: string; at: string; open?: boolean }[]>();
  /** Set to make every write fail, for the "could not be written" branches. */
  broken = false;
  /** Set to make the consent read fail, for the "unknown" branch. */
  consentUnavailable = false;
  /** Set to make the pause-signal read fail. */
  signalsUnavailable = false;
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

  /** A reply, a booking, a payment: an event at an instant. `open` is an open application, which counts whenever it began. */
  addSignal(personId: string, reason: string, at: string, open = false): void {
    this.signals.set(personId, [...(this.signals.get(personId) ?? []), { reason, at, open }]);
  }

  /** Open an application/enquiry sequence directly, to test "one live sequence". */
  addLiveSequence(personId: string, route: string, state: DripState = 'active'): string {
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
      confirmedAt: null,
      resumedAt: null,
      route,
      stoppedReason: null,
      pausedReason: null,
      completedAt: null,
    });
    return sequenceId;
  }

  find(sequenceId: string): MemorySequence | undefined {
    return this.sequences.find((s) => s.sequenceId === sequenceId);
  }

  /** Send everything queued, at `atISO`. The sweep with dispatch on and every gate passing. */
  sweep(atISO: string): number {
    let n = 0;
    for (const m of this.messages) {
      if (m.state === 'queued') {
        m.state = 'sent';
        m.sentAt = atISO;
        n += 1;
      }
    }
    return n;
  }

  /** What a reviewed resume in the console does. */
  resume(sequenceId: string, atISO: string): void {
    const s = this.find(sequenceId);
    if (!s || s.state !== 'paused') return;
    s.state = 'active';
    s.pausedReason = null;
    s.resumedAt = atISO;
    s.nextSendAt = atISO;
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

  async stepStatus(sequenceId: string): Promise<StepStatus | null> {
    const mine = this.messages.filter((m) => m.sequenceId === sequenceId && m.purpose === 'marketing');
    const pending = mine.some((m) => m.state === 'queued' || m.state === 'sending' || m.state === 'unknown');
    const sent = mine.map((m) => m.sentAt).filter((x): x is string => Boolean(x)).sort();
    return { pending, lastSentAt: sent.at(-1) ?? null };
  }

  async pauseSignals(args: { personId: string; recipient: string; sinceISO: string; everResumed: boolean }): Promise<string[] | null> {
    if (this.signalsUnavailable) return null;
    const since = Date.parse(args.sinceISO);
    return (this.signals.get(args.personId) ?? [])
      .filter((x) => (x.open && !args.everResumed) || Date.parse(x.at) >= since)
      .map((x) => x.reason);
  }

  async queueMessage(m: DripMessage): Promise<{ messageId: string | null; duplicate: boolean }> {
    if (this.broken) return { messageId: null, duplicate: false };
    const existing = this.messages.find((x) => x.idempotencyKey === m.idempotencyKey);
    if (existing) return { messageId: existing.messageId, duplicate: true };
    const messageId = this.id('msg');
    this.messages.push({ ...m, messageId, state: 'queued', sentAt: null });
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
    if (!s || s.state !== 'active') return;
    s.state = 'completed';
    s.completedAt = atISO;
    s.nextSendAt = null;
  }

  private cancelQueued(sequenceId: string): void {
    for (const m of this.messages) {
      if (m.sequenceId === sequenceId && m.state === 'queued') m.state = 'cancelled';
    }
  }

  async stop(sequenceId: string, reason: string, atISO: string): Promise<void> {
    const s = this.find(sequenceId);
    if (!s || !LIVE.includes(s.state)) return;
    s.state = 'stopped';
    s.stoppedReason = reason;
    s.nextSendAt = null;
    this.cancelQueued(sequenceId);
    void atISO;
  }

  async pause(sequenceId: string, reason: string, atISO: string): Promise<void> {
    const s = this.find(sequenceId);
    if (!s || s.state !== 'active') return;
    s.state = 'paused';
    s.pausedReason = reason;
    s.nextSendAt = null;
    this.cancelQueued(sequenceId);
    void atISO;
  }

  async liveSequenceFor(personId: string): Promise<{ sequenceId: string; route: string; state: string } | null> {
    const s = this.sequences.find((x) => x.personId === personId && LIVE.includes(x.state));
    return s ? { sequenceId: s.sequenceId, route: s.route, state: s.state } : null;
  }

  async hadResourceSequence(personId: string): Promise<boolean | null> {
    return this.sequences.some((x) => x.personId === personId && x.route === 'resource');
  }

  async sequence(sequenceId: string): Promise<DripSequence | null> {
    const s = this.find(sequenceId);
    return s ? { ...s } : null;
  }

  async consentState(personId: string): Promise<ConsentRead> {
    if (this.consentUnavailable) return 'unknown';
    const rows = this.consents.filter((c) => c.personId === personId);
    if (!rows.length) return 'none';
    const last = rows[rows.length - 1];
    if (last.state === 'withdrawn') return 'withdrawn';
    const lastWithdrawal = rows.map((r, i) => (r.state === 'withdrawn' ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
    return rows.slice(lastWithdrawal + 1).some((r) => r.confirmedAt) ? 'confirmed' : 'granted';
  }

  async grantConsent(personId: string, source: string, atISO: string): Promise<boolean> {
    if (this.broken) return false;
    this.consents.push({ personId, state: 'granted', source, at: atISO, confirmedAt: null });
    return true;
  }

  async confirmConsent(personId: string, atISO: string): Promise<boolean> {
    if (this.broken) return false;
    this.consents.push({ personId, state: 'granted', source: 'resource-gate:confirmed', at: atISO, confirmedAt: atISO });
    return true;
  }

  /** What an unsubscribe does to this store: the same things applyUnsubscribe() does. */
  unsubscribe(personId: string, atISO: string): void {
    this.consents.push({ personId, state: 'withdrawn', source: 'unsubscribe-link', at: atISO, confirmedAt: null });
    for (const s of this.sequences) {
      if (s.personId === personId && LIVE.includes(s.state)) {
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
      state: 'awaiting_confirmation',
      nextSendAt: null,
      stepsSent: 0,
      anchorAt: row.anchorAt,
      confirmedAt: null,
      resumedAt: null,
      route: 'resource',
      stoppedReason: null,
      pausedReason: null,
      completedAt: null,
    });
    return { sequenceId, duplicate: false };
  }

  async activate(sequenceId: string, confirmedAtISO: string, nextSendAtISO: string): Promise<boolean> {
    const s = this.find(sequenceId);
    if (!s || s.state !== 'awaiting_confirmation') return false;
    s.state = 'active';
    s.confirmedAt = confirmedAtISO;
    s.nextSendAt = nextSendAtISO;
    return true;
  }

  async awaitingWithoutRequest(limit: number): Promise<{ sequenceId: string; personId: string }[]> {
    return this.sequences
      .filter(
        (s) =>
          s.route === 'resource' &&
          s.state === 'awaiting_confirmation' &&
          !this.messages.some((m) => m.sequenceId === s.sequenceId && m.templateKey === 'confirm-resource-emails'),
      )
      .slice(0, limit)
      .map((s) => ({ sequenceId: s.sequenceId, personId: s.personId }));
  }
}
