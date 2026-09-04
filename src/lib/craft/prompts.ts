// What a session ending opens, and the one prompt that says so.
//
// ---------------------------------------------------------------------------
// WHY ONE PROMPT AND NOT TWO
// ---------------------------------------------------------------------------
// A session ending opens two things at the same instant: the feedback form and
// the week's knowledge check. Prompting for each separately means two modals
// racing onto one dashboard, and two stacked dialogs are not twice the prompt —
// they are a thing people click past without reading. So there is one prompt
// per session, it names whatever is actually outstanding, and one dismissal
// closes it.
//
// Feedback leads when both are open. It is sixty seconds against several
// minutes, and it is the one that decays: "was the pacing right" is a question
// worth asking on the day and nearly worthless a week later.
//
// ---------------------------------------------------------------------------
// STILL A PROMPT, STILL NOT A CHASE (§10)
// ---------------------------------------------------------------------------
// Shown once. Dismissal is permanent and is never counted, reported, or shown
// to Sunil. What survives a dismissal is the TO-DO PANEL on the dashboard —
// a passive list the learner opens themselves, which is the opposite of being
// chased. The distinction §10 turns on is repetition and escalation, and there
// is none here: no second prompt, no email, no "you still haven't".

import { db } from '../admin/supabase';
import { sessionEnded } from './checks';
import type { WeeklyCheck } from './checks';
import type { Feedback } from './feedback';
import { pulsesDue, type PulseWindow, type PulsePhase } from './pulses';

const fail = (where: string, err: unknown) => {
  console.error(`prompts ${where} failed:`, err instanceof Error ? err.message : err);
};

export interface PromptSession {
  week: number;
  title: string;
  endsAt?: string;
}

export type PromptTaskId = 'pulse' | 'feedback' | 'check';

export interface PromptTask {
  id: PromptTaskId;
  label: string;
  detail: string;
  href: string;
}

export interface SessionPrompt {
  week: number;
  title: string;
  phase: PulsePhase;
  /** At least one — a prompt with nothing outstanding is never returned. */
  tasks: PromptTask[];
}

/** The dismissal key: a week has two prompts, and closing one is not the other. */
export const promptKey = (week: number, phase: PulsePhase) => `${week}:${phase}`;

/**
 * The single prompt to show, or null.
 *
 * TWO MOMENTS EXIST IN A WEEK — the run-up to the session and the hours after
 * it — and after week 1 ends they overlap: week 1's after-window and week 2's
 * before-window are both live. Only one prompt is ever returned, and the
 * AFTER moment wins, because it is about the session someone just sat through
 * and everything in it decays. The before-pulse is not lost: it stays on the
 * to-do panel and gets its own prompt once the after-prompt is closed.
 *
 * It is never about more than one session either. If somebody has been away and
 * three sessions ran, prompting for all three would be a backlog report, and
 * the to-do panel already is one.
 */
export function sessionPrompt(
  sessions: PromptSession[],
  checks: WeeklyCheck[],
  feedbacks: Feedback[],
  windows: PulseWindow[],
  dismissed: Set<string>,
  now: Date = new Date(),
): SessionPrompt | null {
  const due = pulsesDue(windows);

  // --- the after moment -------------------------------------------------
  const ended = sessions
    .filter((s) => s.week >= 1 && sessionEnded(s.endsAt, now))
    .sort((a, b) => b.week - a.week);
  const latest = ended[0];

  if (latest && !dismissed.has(promptKey(latest.week, 'after'))) {
    const tasks: PromptTask[] = [];

    // Ordered by how fast each decays. A rating of what you can do NOW is
    // worthless tomorrow; feedback fades over days; the check is calibration
    // and keeps.
    if (due.some((w) => w.week === latest.week && w.phase === 'after')) {
      const w = due.find((x) => x.week === latest.week && x.phase === 'after')!;
      tasks.push({
        id: 'pulse',
        label: 'Where you are now',
        detail: `${w.capabilities.length} ${w.capabilities.length === 1 ? 'rating' : 'ratings'}, the same ones you gave before the session. This is the half that makes the first half mean anything.`,
        href: `/craft/familiarity?week=${latest.week}&phase=after`,
      });
    }

    if (!feedbacks.some((f) => f.week === latest.week)) {
      tasks.push({
        id: 'feedback',
        label: 'Session feedback',
        detail: 'Two questions, about a minute. It changes the next session, not the next cohort.',
        href: `/craft/feedback?week=${latest.week}`,
      });
    }

    // Only when untouched. Someone already part-way through has found it, and
    // being invited to something you are in the middle of reads as a system
    // that is not paying attention.
    const check = checks.find((c) => c.week === latest.week);
    if (check && check.isOpen && check.answered === 0) {
      tasks.push({
        id: 'check',
        label: 'Knowledge check',
        detail: `${check.itemCount} ${check.itemCount === 1 ? 'question' : 'questions'}, each with a confidence rating. Calibration, not an exam.`,
        href: `/craft/quiz?week=${latest.week}`,
      });
    }

    if (tasks.length > 0) {
      return { week: latest.week, title: latest.title, phase: 'after', tasks };
    }
  }

  // --- the before moment ------------------------------------------------
  const upcoming = due.find(
    (w) => w.phase === 'before' && !dismissed.has(promptKey(w.week, 'before')),
  );
  if (!upcoming) return null;

  return {
    week: upcoming.week,
    title: upcoming.title,
    phase: 'before',
    tasks: [
      {
        id: 'pulse',
        label: 'Where you are before this one',
        detail: `${upcoming.capabilities.length} ${upcoming.capabilities.length === 1 ? 'rating' : 'ratings'} on what this session covers. Takes half a minute, and it closes when the session starts — a baseline taken afterwards is not a baseline.`,
        href: `/craft/familiarity?week=${upcoming.week}&phase=before`,
      },
    ],
  };
}

/**
 * Weeks whose session has ended but whose feedback is missing. Drives the to-do
 * panel — the reminder that outlives a dismissed prompt.
 *
 * Same `sessionEnded()` clock as everything else here. This used to be tested
 * against `taughtOn`, which was a fourth definition of "the session happened"
 * and could disagree with the prompt that had just invited them to fill it in.
 */
export function feedbackWeeksDue(
  sessions: PromptSession[],
  feedbacks: Feedback[],
  now: Date = new Date(),
): number[] {
  return sessions
    .filter((s) => s.week >= 1 && sessionEnded(s.endsAt, now))
    .filter((s) => !feedbacks.some((f) => f.week === s.week))
    .map((s) => s.week)
    .sort((a, b) => a - b);
}

// ---------------------------------------------------------------------------
// Dismissals
// ---------------------------------------------------------------------------

/** Keys are `week:phase` — see promptKey(). */
export async function dismissedPrompts(learnerId: string): Promise<Set<string>> {
  const client = db();
  if (!client) return new Set();

  try {
    const { data, error } = await client
      .from('session_prompts')
      .select('week, phase')
      .eq('learner_id', learnerId);
    if (error) throw error;
    return new Set((data ?? []).map((r: any) => promptKey(r.week, r.phase ?? 'after')));
  } catch (err) {
    fail('dismissedPrompts', err);
    // Degrades to "nothing dismissed", which would re-show a prompt someone
    // already closed. That is the right way round: the alternative is silently
    // swallowing the only invitation they get.
    return new Set();
  }
}

export async function dismissPrompt(
  learnerId: string,
  week: number,
  phase: PulsePhase,
): Promise<{ ok: boolean }> {
  const client = db();
  if (!client) return { ok: false };

  try {
    // Idempotent: closing the modal twice from two tabs is one row, not an error.
    const { error } = await client
      .from('session_prompts')
      .upsert({ learner_id: learnerId, week, phase }, { onConflict: 'learner_id,week,phase' });
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    fail('dismissPrompt', err);
    return { ok: false };
  }
}
