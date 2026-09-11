// A synthetic pipeline, so the console's screens can be looked at.
//
//   npm run seed -- --help
//   npm run seed -- --project <ref>                  # create
//   npm run seed -- --project <ref> --dry-run        # say what it would create
//   npm run seed -- --project <ref> --clear          # remove exactly its own
//
// ───────────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS
// ───────────────────────────────────────────────────────────────────────────
//
// Almost every branch of the console has been type-checked and never rendered.
// With no rows, `listLeads` never resolves a lead, so Meetings, Offer, Finance,
// Attendance and Nominations have never been drawn at all; `totals` has never
// had to tell an application from an applicant; `netByCurrency` has never been
// handed two currencies. Code that has only ever run against the empty set is
// code whose interesting half is untested, and the interesting half here fails
// QUIETLY — a wrong count renders exactly like a right one.
//
// So this writes a small, deliberately awkward dataset: a person who applied
// twice, an enterprise order whose nominees are not applicants, a lead nobody
// owns with work already overdue, a refund beside a receipt, two currencies on
// one record, a submission that arrived before the reporting window opened,
// and a row flagged as a test so the exclusion can be seen working.
//
// Acceptance case E14 is the consumer: it reads what the dashboard counted and
// reconciles it against these records.
//
// ───────────────────────────────────────────────────────────────────────────
// EVERYTHING IT WRITES IS UNMISTAKABLY FAKE, AND THAT IS LOAD-BEARING
// ───────────────────────────────────────────────────────────────────────────
//
// The brief requires test records to be cleared before production opens, which
// is only possible if they can be told from real ones with certainty rather
// than by eye. Two markers, both on the address:
//
//   * a `+seed` plus-tag. The person matcher deliberately does NOT strip plus
//     tags, so these are distinct people and can never merge into somebody
//     real.
//   * the `.invalid` domain, which RFC 2606 reserves and no resolver will ever
//     answer for. Nothing here can be emailed, by anybody, ever — including by
//     a mail integration that does not exist yet and will not know these rows
//     were supposed to be skipped.
//
// Organisations carry `[seed]` in the name for the same reason. `--clear`
// works off those two markers and nothing else, so it can only ever delete
// what this file created.
//
// ───────────────────────────────────────────────────────────────────────────
// A NOTE ABOUT `is_test`, WHICH IS NOT THE MARKER
// ───────────────────────────────────────────────────────────────────────────
//
// `form_submissions.is_test` looks like the obvious way to label all of this,
// and it is the wrong one. `totals()` filters `.eq('is_test', false)`, so a
// dataset flagged end to end is a dataset the dashboard counts as nothing —
// every tile reads 0, no reconciliation is possible, and the exercise is
// pointless. The flag is also not "written by a script": the schema describes
// it as an operator's judgement about a row, the example being a honeypot that
// misfired on somebody's password manager.
//
// So the flag is USED rather than worn. Two rows carry it — one `is_test`, one
// `is_spam` — and E14 asserts both are absent from the counted totals, which
// is the "test/spam exclusions visible" property the operating guide asks for.
// The rest are countable, and what keeps them out of a real database is the
// refusal below, not a column.
//
// `--all-test` flags every row instead, for anyone who wants a dataset that is
// guaranteed invisible to the totals. It makes E14 unanswerable; it is there
// because somebody will want it.
//
// ───────────────────────────────────────────────────────────────────────────
// TALKING TO POSTGREST RATHER THAN IMPORTING THE APP
// ───────────────────────────────────────────────────────────────────────────
//
// This runs under `node --experimental-strip-types`, whose ESM resolver will
// not guess a missing file extension. `src/lib/admin/pipeline-queries.ts`
// imports `../pipeline/roles` without one, and most of `src/lib/**` is the
// same, so importing the console's own modules fails before the first query.
// Rows therefore go in over PostgREST.
//
// The two exceptions are modules that deliberately import NOTHING, which makes
// them safe here and means the seed uses the shipped rule rather than a copy:
// `reference.ts` mints the quotable reference, and `consent.ts` supplies the
// exact wording and version a consent record has to point at. Inventing either
// would put words in a record claiming somebody read them.
//
// The submissions themselves go through `pipeline_submit()` rather than
// straight INSERTs, for the same reason: person matching, organisation review
// flagging, opportunity reuse, the one automatic stage move, the activity, the
// task, the attribution and the audit line are all rules that live in one
// place, and a seed that reimplemented them would produce a shape the real
// pipeline cannot produce.
//
// ───────────────────────────────────────────────────────────────────────────
// AND THE DATABASE WOULD REJECT THE OBVIOUS SHORTCUT ANYWAY
// ───────────────────────────────────────────────────────────────────────────
//
// `opportunities` carries two PARTIAL unique indexes: one open member record
// per person per cohort, one open enterprise record per person. They exist so
// that "an enquiry can later become an application without losing either
// record" is true in the database rather than only inside a function.
//
// Which is exactly what the interesting case here needs. Alpha appears three
// times — an enquiry, an application, and a second application — and a seed
// that inserted an opportunity per submission would be refused by the index on
// the second row. Going through `pipeline_submit` produces ONE opportunity,
// advanced once from enquiry to application_received and then left alone, with
// three submissions hanging off it. That pair of numbers, three rows and one
// applicant, is the first thing E14 checks.
//
// The same index is why the three terminal side states matter to a seed: they
// are excluded from it, so Golf being withdrawn and Mike being closed leave the
// index and cannot collide with anything. If you add a cast member, give them
// their own slug or expect exactly this behaviour from sharing one.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { pathToFileURL } from 'node:url';

import { newReference } from '../src/lib/pipeline/reference.ts';
import { MARKETING_CONSENT } from '../src/lib/pipeline/consent.ts';

// ---------------------------------------------------------------------------
// The markers. Exported, because E14 has to find these rows and there must be
// exactly one definition of what "these rows" means.
// ---------------------------------------------------------------------------

/** The plus-tag. Never stripped by the person matcher, so these never merge. */
export const SEED_TAG = '+seed';

/** RFC 2606 reserves `.invalid`. Nothing here can ever receive mail. */
export const SEED_DOMAIN = 'thelivingcraft.invalid';

/** PostgREST `like` pattern matching every address this file writes. */
export const SEED_EMAIL_PATTERN = `%${SEED_TAG}@${SEED_DOMAIN}`;

/** In an organisation name, so the seeded companies are as findable. */
export const SEED_ORG_MARK = '[seed]';

export const isSeedEmail = (email: string | null | undefined): boolean =>
  typeof email === 'string' && email.endsWith(`${SEED_TAG}@${SEED_DOMAIN}`);

/**
 * The address for one member of the cast.
 *
 * Exported because acceptance case E14 has to look two of these up by name —
 * the enterprise sponsor, and the first nominated participant who must NOT be
 * findable as a lead. A second spelling of the format in the harness is the
 * two-owners-of-one-format mistake, and it would fail in the direction that
 * looks like a pass: a search for an address nobody wrote returns nothing,
 * which is exactly what "a nominee is not a person" is supposed to prove.
 */
export const seedAddress = (slug: string): string => `${slug}${SEED_TAG}@${SEED_DOMAIN}`;

const addr = seedAddress;

/** Staff-shaped strings for `owner`, `approved_by`, `confirmed_by` and friends. */
const STAFF = {
  operator: addr('operator'),
  instructor: addr('instructor'),
  finance: addr('finance'),
  programme: addr('programme'),
};

/**
 * What a complete run creates, counted rather than described.
 *
 * E14 asserts the database agrees with this. That is the point of the file:
 * seed a KNOWN quantity, then check the dashboard reports it. A number here
 * that drifts from the cast below turns E14 from a reconciliation into a
 * coin toss, so the two are checked against each other at the end of a run.
 */
export const SEED_EXPECTATIONS = {
  people: 18,
  /**
   * FOUR, not three, and the fourth is the point of the pair.
   *
   * Two different sponsors name the same company. `pipeline_submit` creates a
   * second organisation row flagged `needs_review` rather than merging them,
   * because merging on a name alone is an operator's decision. So three
   * company names produce four rows, and the extra one is the only way to see
   * that flag set anywhere in the console.
   */
  organisations: 4,
  opportunities: 18,
  submissions: 20,
  /** Every application row, flagged ones included. */
  applicationRows: 14,
  /** Application rows the dashboard may count — excludes the flagged two. */
  countableApplications: 12,
  /** Distinct people behind those. One person applied twice. */
  countableApplicants: 11,
  /** Enquiry rows, one of which is backdated outside a 30-day window. */
  countableEnquiries: 3,
  enquiriesInsideThirtyDays: 2,
  enterpriseSubmissions: 3,
  /** Flagged, and therefore counted nowhere. */
  flaggedTest: 1,
  flaggedSpam: 1,
  /** Nominated participants. None of them is a person or an applicant. */
  nominations: 6,
  offers: 6,
  /** Six receipts and refunds in one insert, plus the enterprise refund. */
  payments: 7,
  admissions: 3,
  meetings: 3,
  attendance: 3,
  /** Opportunities left deliberately unowned, and overdue open tasks. */
  unowned: 1,
  overdueTasks: 1,
} as const;

/**
 * The enterprise order's finance position, stated here so E14 reconciles
 * against a number this file owns rather than one somebody retyped.
 *
 * Two currencies on one record, and the cross-currency sum is the number that
 * must appear NOWHERE: 444400 dirhams-minor added to 7777700 rupees-minor is
 * 8222100 of nothing at all, and it is the shape a wrong total arrives in.
 */
export const ENTERPRISE_NET = {
  AED: 555500 - 111100,
  INR: 7777700,
  /** Never rendered. E14 asserts the page does not contain it. */
  nonsenseSum: 555500 - 111100 + 7777700,
} as const;

/**
 * THE DATES ARE LOAD-BEARING, and this is the rule they follow.
 *
 * E14 cannot compare a dashboard tile to a flat number, because the acceptance
 * harness writes its own submissions into the same database before it gets
 * there — and a case that only reconciles on a pristine database is a case
 * that reports a confusing failure the second time anybody runs it.
 *
 * So it compares WINDOWS instead. The overview offers 7, 30 and 90 days, and
 * this dataset is laid out so each boundary means exactly one thing:
 *
 *   inside 7 days   nothing seeded. Everything the harness itself writes lands
 *                   here, so subtracting the 7-day tile removes the harness's
 *                   own contribution exactly, whatever it grows into later.
 *   8 to 28 days    every countable row, AND both flagged rows — which is what
 *                   makes the exclusion visible. A totals query ignoring
 *                   is_test would report 14 applications in this band, not 12.
 *   45 days         the one backdated enquiry, and nothing else. It is the
 *                   entire difference between the 30-day and 90-day tiles.
 *
 * Change a `daysAgo` and E14 starts measuring something else. `dateProblems()`
 * below fails the run rather than letting that happen quietly.
 */
const WINDOW = { newest: 8, oldest: 28, backdated: 45 } as const;

/** The one submission placed before a 30-day reporting window opens. */
const BACKDATED_DAYS = WINDOW.backdated;

// ---------------------------------------------------------------------------
// Arguments — same shape as add-staff.ts, deliberately duplicated rather than
// shared. A helper module between two scripts is a third file to resolve under
// strip-types and buys eight lines.
// ---------------------------------------------------------------------------

function arg(name: string): string | undefined {
  const flag = `--${name}`;
  const i = process.argv.indexOf(flag);
  if (i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
    return process.argv[i + 1];
  }
  const inline = process.argv.find((a) => a.startsWith(`${flag}=`));
  return inline?.slice(flag.length + 1);
}

const has = (name: string) => process.argv.includes(`--${name}`);

const usage = () => {
  console.log(`
A synthetic pipeline dataset, for looking at screens that have never had data.

  npm run seed -- --project <ref>              create the dataset
  npm run seed -- --project <ref> --dry-run    print the plan, write nothing
  npm run seed -- --project <ref> --clear      delete exactly what it created

  --project    REQUIRED. The Supabase project ref in this environment's
               SUPABASE_URL. It is not printed here or in any refusal: go and
               look at which database you are pointing at, and type it. That
               is the whole point of the flag.
  --dry-run    Counts what would be written and stops before writing.
  --clear      Removes every row carrying the seed markers, and nothing else.
  --all-test   Flags every submission is_test. The dashboard then counts none
               of them and acceptance case E14 cannot run. Rarely what you want.

WHAT IT WRITES
  ${SEED_EXPECTATIONS.people} people, ${SEED_EXPECTATIONS.organisations} organisations, ${SEED_EXPECTATIONS.opportunities} opportunities and ${SEED_EXPECTATIONS.submissions} submissions, plus the
  evidence behind them: ${SEED_EXPECTATIONS.meetings} meetings, ${SEED_EXPECTATIONS.offers} offers, ${SEED_EXPECTATIONS.payments} payments in two currencies,
  ${SEED_EXPECTATIONS.admissions} admission decisions, ${SEED_EXPECTATIONS.attendance} attendance rows, and ${SEED_EXPECTATIONS.nominations} nominated participants who
  are deliberately NOT people and NOT applicants.

  Submissions are dated ${WINDOW.newest}-${WINDOW.oldest} days ago, with one enquiry at ${WINDOW.backdated} days.
  Nothing lands inside 7 days: that is the gap acceptance case E14 subtracts
  to remove its own writes from the dashboard's tiles.

  Every address carries a ${SEED_TAG} plus-tag on the ${SEED_DOMAIN} domain,
  which no resolver will ever answer for, so none of it can be emailed by
  anything — including by a mail integration that has not been built yet.

WHAT IT REFUSES
  A deployment environment. A project ref you did not name. A database holding
  any address that could actually receive mail, or any learner record — or one
  that could not be asked, because a safety check that did not run is not a
  safety check. It also refuses to run twice: this is a known quantity, and two
  copies of it is a number nobody meant.

  Seeding a live pipeline with invented applicants is a genuinely bad day, and
  the live-data check is the one doing most of the work.
`);
};

// ---------------------------------------------------------------------------
// Refusing to run against production
// ---------------------------------------------------------------------------
//
// Three gates, and they protect against different mistakes:
//
//   1. THE WRONG SHELL. `VERCEL`, `CI` or NODE_ENV=production means this is
//      running inside a deployment or a pipeline, where nobody sits watching.
//      There is no flag for this one.
//
//   2. THE WRONG PROJECT. `--project` must name the ref in SUPABASE_URL. The
//      refusal deliberately does not print the ref, because a refusal that
//      tells you the answer is a prompt, not a check — the value is in having
//      LOOKED at which database your environment is pointing at.
//
//   3. THE WRONG DATABASE ALTOGETHER. The strongest available signal that
//      something is live is that it holds an address which can receive mail.
//      Production has people in it; a scratch project has `.invalid` rows and
//      nothing else. So: any `people` or `leads` row whose address is not
//      `.invalid`, or any `learners` row at all, and this stops.
//
// What none of it protects against, said plainly rather than buried: a brand
// new production project, on its first day, with nothing in it yet and a ref
// you typed correctly and confidently. Gate 3 has nothing to see and gates 1
// and 2 are satisfied. There is no check that catches that one, and the honest
// answer is that `--clear` is then the recovery path — which is why it is
// written to be exact rather than approximate.
//
// Nor does any of it protect against a service-role key that reaches a second
// project: gate 2 compares the ref in SUPABASE_URL against what you typed, and
// both come from the same shell. If the URL is wrong, the flag agrees with it.
//
// What gate 3 now DOES cover, and did not: a probe that could not be run. An
// error that is not "no such table" means the question went unanswered, and an
// unanswered safety check is reported and refused rather than counted as a
// clean bill of health.

const PROD_ENV_SIGNALS = ['VERCEL', 'VERCEL_ENV', 'CI'] as const;

/** The subdomain of a Supabase URL: https://<ref>.supabase.co */
function projectRef(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    const [ref] = host.split('.');
    return ref || null;
  } catch {
    return null;
  }
}

/**
 * A refusal, thrown rather than exited.
 *
 * `process.exit()` while supabase-js still has keep-alive sockets open trips a
 * libuv assertion on Windows and prints a crash on top of the message — which
 * reads as a broken script rather than as the deliberate refusal it is.
 * `scripts/acceptance.ts` carries the same note for the same reason. Throwing
 * lets the loop drain and still exits non-zero.
 */
class Refusal extends Error {}

const refuse = (...lines: string[]): never => {
  throw new Refusal(`\n  ${lines.join('\n  ')}\n`);
};

/**
 * Gate 3. Counts only — never an address, never a name.
 *
 * A count is enough to decide and enough to explain. Printing the row that
 * tripped it would put a real person's address in a terminal, a screenshot and
 * eventually a chat window, which is the failure the console's own error
 * strings are written to avoid.
 */
/**
 * The codes that mean "that table is not here", which is a legitimate answer.
 *
 * A scratch project with no schema says this about all three, and that is the
 * emptiest a database can be. Every OTHER error means the question was not
 * answered, which is a different thing entirely — see `looksLive`.
 */
const TABLE_ABSENT = new Set(['42P01', 'PGRST205', 'PGRST202', 'PGRST106']);

interface LiveCheck {
  /** What was found that a scratch project would not hold. */
  found: string[];
  /** Probes that could not be run at all. A gate that did not run is not a gate that passed. */
  unanswered: string[];
}

async function looksLive(client: SupabaseClient): Promise<LiveCheck> {
  const found: string[] = [];
  const unanswered: string[] = [];

  /**
   * One reading, and the three outcomes are kept apart.
   *
   * `absent` is an answer: the table is not here, so it holds nobody. `n > 0`
   * is an answer: it holds somebody. ANYTHING ELSE — a wrong key, a network
   * failure, a permission error — is the question going UNANSWERED, and the
   * first version of this file treated that identically to "nothing found". A
   * mistyped key would therefore have unlocked the strongest of the three
   * gates, silently, which is the one failure mode a safety check may not have.
   */
  const read = (
    table: string,
    describe: (n: number) => string,
    result: { count: number | null; error: { code?: string } | null },
  ) => {
    if (result.error) {
      const code = typeof result.error.code === 'string' ? result.error.code : '';
      if (TABLE_ABSENT.has(code)) return;
      unanswered.push(`${table} (error code ${code || 'unknown'})`);
      return;
    }
    if ((result.count ?? 0) > 0) found.push(describe(result.count ?? 0));
  };

  read(
    'people',
    (n) => `${n} person record(s) with a deliverable address`,
    await client
      .from('people')
      .select('person_id', { count: 'exact', head: true })
      .not('normalised_email', 'like', '%.invalid'),
  );

  read(
    'leads',
    (n) => `${n} lead(s) with a deliverable address`,
    await client
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .not('email', 'like', '%.invalid'),
  );

  read(
    'learners',
    (n) => `${n} learner record(s)`,
    await client.from('learners').select('id', { count: 'exact', head: true }),
  );

  return { found, unanswered };
}

// ---------------------------------------------------------------------------
// The cast
// ---------------------------------------------------------------------------
//
// Names are flatly synthetic on purpose. The hard rule in CLAUDE.md is never
// to invent a person, and "Priya Sharma, Principal Engineer at Acme" in a
// screenshot is indistinguishable from a real applicant — including to the
// person who later has to decide whether it is safe to delete.
//
// The free text is written to be worth reading anyway: a screen full of
// "lorem ipsum" tests the layout and nothing else, and the console's job is to
// help somebody judge an application.

interface Person {
  slug: string;
  name: string;
  type: 'application' | 'enquiry' | 'enterprise';
  role?: string;
  organisation?: string;
  industry?: string;
  phone?: string;
  answers: Record<string, string>;
  funding?: 'self' | 'employer' | 'undecided';
  groupSize?: number;
  owner?: string;
  consent?: boolean;
  attribution?: Record<string, string | boolean>;
  /** Days before now the submission arrived. 0 is today. */
  daysAgo?: number;
  taskOverdueDays?: number;
  isTest?: boolean;
  isSpam?: boolean;
}

const TAGGED = {
  session_source: 'linkedin',
  session_medium: 'organic_social',
  session_campaign: 'cohort_enterprise_v3',
  session_content: 'lc-oct-d07',
  entry_path: '/',
  referrer_host: 'linkedin.com',
  tracking_permission: false,
};

const DIRECT = {
  session_source: 'direct',
  session_medium: 'none',
  entry_path: '/',
  tracking_permission: false,
};

const CAST: Person[] = [
  {
    slug: 'alpha',
    name: 'Seed Enquirer Alpha',
    type: 'enquiry',
    role: 'Staff engineer',
    owner: STAFF.operator,
    consent: true,
    attribution: { ...TAGGED, self_reported: 'A colleague forwarded a post.' },
    daysAgo: 21,
    answers: {
      name: 'Seed Enquirer Alpha',
      email: addr('alpha'),
      question:
        'Does the five hours a week include the pair work, or is that on top of it? I am in a release month.',
    },
  },
  {
    slug: 'alpha',
    name: 'Seed Enquirer Alpha',
    type: 'application',
    role: 'Staff engineer',
    funding: 'employer',
    owner: STAFF.operator,
    attribution: { ...TAGGED },
    daysAgo: 14,
    answers: {
      name: 'Seed Enquirer Alpha',
      email: addr('alpha'),
      role: 'Staff engineer',
      experience:
        'Eight years on a settlement platform, four of them owning the reconciliation path. I decide where the idempotency boundaries sit and I am the person who gets called when a batch double-credits.',
      goal:
        'I want to be able to say why an agent boundary is where it is, in front of people who will push back. Right now I can only say it feels wrong.',
      funding: 'employer',
    },
  },
  {
    // The second application. Same person, same cohort, same opportunity: two
    // submission rows and ONE applicant. This pair is what makes the
    // applications and applicants tiles disagree, which is E14's first check.
    slug: 'alpha',
    name: 'Seed Enquirer Alpha',
    type: 'application',
    role: 'Staff engineer',
    funding: 'self',
    attribution: { ...DIRECT },
    daysAgo: 9,
    answers: {
      name: 'Seed Enquirer Alpha',
      email: addr('alpha'),
      role: 'Staff engineer',
      experience:
        'Resubmitting with the detail you asked for. The platform clears about forty thousand instructions a day and I own the retry semantics end to end.',
      goal:
        'Same goal, sharper: I want to write the design record for our agent rollout and have it survive an architecture review.',
      funding: 'self',
    },
  },
  {
    slug: 'bravo',
    name: 'Seed Enquirer Bravo',
    type: 'enquiry',
    owner: STAFF.operator,
    attribution: { ...DIRECT },
    daysAgo: 9,
    answers: {
      name: 'Seed Enquirer Bravo',
      email: addr('bravo'),
      question:
        'I am in Sydney. How much of the cohort is live, and what happens if I miss a session?',
    },
  },
  {
    slug: 'charlie',
    name: 'Seed Applicant Charlie',
    type: 'application',
    role: 'Head of platform',
    organisation: `Bluegrass Fictional Systems ${SEED_ORG_MARK}`,
    industry: 'Logistics',
    phone: '+44 20 7946 0000',
    funding: 'employer',
    owner: STAFF.operator,
    consent: true,
    attribution: { session_source: 'newsletter', session_medium: 'email', entry_path: '/programmes/', tracking_permission: false },
    daysAgo: 19,
    answers: {
      name: 'Seed Applicant Charlie',
      email: addr('charlie'),
      role: 'Head of platform',
      experience:
        'I run a platform group of eleven. Most of my decisions now are about what we are prepared to automate and what has to stay in front of a person.',
      goal: 'A defensible way to decide which steps an agent may take unsupervised.',
      funding: 'employer',
      organisation: `Bluegrass Fictional Systems ${SEED_ORG_MARK}`,
      discovery: 'The weekly note.',
    },
  },
  {
    slug: 'delta',
    name: 'Seed Applicant Delta',
    type: 'application',
    role: 'Principal engineer',
    funding: 'self',
    owner: STAFF.instructor,
    attribution: { ...TAGGED, session_content: 'lc-oct-d02' },
    daysAgo: 17,
    answers: {
      name: 'Seed Applicant Delta',
      email: addr('delta'),
      role: 'Principal engineer',
      experience:
        'Fifteen years, mostly on ingestion and data quality. I have shipped two agent features and neither has an eval I trust.',
      goal: 'Evaluation. I want to know what a good eval for a multi-step agent actually looks like.',
      funding: 'self',
    },
  },
  {
    slug: 'echo',
    name: 'Seed Applicant Echo',
    type: 'application',
    role: 'Engineering manager',
    funding: 'employer',
    owner: STAFF.instructor,
    attribution: { ...DIRECT },
    daysAgo: 24,
    answers: {
      name: 'Seed Applicant Echo',
      email: addr('echo'),
      role: 'Engineering manager',
      experience:
        'I came up through security engineering and moved into management four years ago. I still review designs and I am the one who signs off on threat models.',
      goal: 'Red-teaming agentic systems, specifically where tool use crosses a trust boundary.',
      funding: 'employer',
    },
  },
  {
    slug: 'foxtrot',
    name: 'Seed Applicant Foxtrot',
    type: 'application',
    role: 'Director of engineering',
    funding: 'self',
    owner: STAFF.instructor,
    consent: true,
    attribution: { ...TAGGED, session_content: 'lc-oct-d11' },
    daysAgo: 27,
    answers: {
      name: 'Seed Applicant Foxtrot',
      email: addr('foxtrot'),
      role: 'Director of engineering',
      experience:
        'Two hundred people across three sites. I do not write code any more; I decide what we build and I am accountable when it is wrong.',
      goal:
        'I want to be able to judge an agent design my teams bring me without having to build one myself first.',
      funding: 'self',
    },
  },
  {
    slug: 'golf',
    name: 'Seed Applicant Golf',
    type: 'application',
    role: 'Solutions architect',
    funding: 'self',
    owner: STAFF.operator,
    attribution: { session_source: 'google', session_medium: 'organic', entry_path: '/programmes/', tracking_permission: false },
    daysAgo: 26,
    answers: {
      name: 'Seed Applicant Golf',
      email: addr('golf'),
      role: 'Solutions architect',
      experience: 'Integration work across three banks, mostly messaging and settlement.',
      goal: 'Reliability patterns for long-running agent workflows.',
      funding: 'self',
    },
  },
  {
    slug: 'hotel',
    name: 'Seed Sponsor Hotel',
    type: 'enterprise',
    role: 'VP engineering',
    organisation: `Northwind Synthetic Ltd ${SEED_ORG_MARK}`,
    industry: 'Insurance',
    groupSize: 9,
    owner: STAFF.operator,
    attribution: { ...TAGGED, session_content: 'lc-oct-d04' },
    daysAgo: 23,
    answers: {
      name: 'Seed Sponsor Hotel',
      email: addr('hotel'),
      organisation: `Northwind Synthetic Ltd ${SEED_ORG_MARK}`,
      role: 'VP engineering',
      goal:
        'Nine engineers across Dubai and Bangalore. I want them to stop asking me whether an agent design is safe and start telling me why it is.',
      group_size: '9',
      industry: 'Insurance',
    },
  },
  {
    // Nobody owns this one, and the first task on it is already late. The two
    // numbers on the Overview's "needs attention" panel read exactly this.
    slug: 'india',
    name: 'Seed Applicant India',
    type: 'application',
    role: 'Senior engineer',
    funding: 'undecided',
    taskOverdueDays: 3,
    attribution: { ...DIRECT },
    daysAgo: 10,
    answers: {
      name: 'Seed Applicant India',
      email: addr('india'),
      role: 'Senior engineer',
      experience: 'Six years, two of them on an internal tools team that now maintains four agents.',
      goal: 'Knowing when to stop adding steps and start adding checks.',
      funding: 'undecided',
    },
  },
  {
    slug: 'juliet',
    name: 'Seed Applicant Juliet',
    type: 'application',
    role: 'Technical lead',
    funding: 'employer',
    owner: STAFF.operator,
    attribution: { ...DIRECT },
    daysAgo: 20,
    answers: {
      name: 'Seed Applicant Juliet',
      email: addr('juliet'),
      role: 'Technical lead',
      experience: 'Nine years across two product companies. Currently leading a team of five.',
      goal: 'Systems thinking I can actually apply to the thing in front of me.',
      funding: 'employer',
    },
  },
  {
    slug: 'kilo',
    name: 'Seed Applicant Kilo',
    type: 'application',
    role: 'Product manager',
    funding: 'self',
    owner: STAFF.instructor,
    attribution: { ...DIRECT },
    daysAgo: 25,
    answers: {
      name: 'Seed Applicant Kilo',
      email: addr('kilo'),
      role: 'Product manager',
      experience: 'I do not have a systems-design background. I want to understand what my engineers are arguing about.',
      goal: 'Enough depth to ask a better question in a design review.',
      funding: 'self',
    },
  },
  {
    slug: 'lima',
    name: 'Seed Sponsor Lima',
    type: 'enterprise',
    role: 'Head of data',
    // The same organisation NAME as Hotel, from a different person. The
    // pipeline creates a second row flagged needs_review rather than merging
    // them, and the console's job is to offer the merge. This is the only way
    // to see that flag set.
    organisation: `Northwind Synthetic Ltd ${SEED_ORG_MARK}`,
    industry: 'Insurance',
    groupSize: 4,
    owner: STAFF.operator,
    attribution: { ...DIRECT },
    daysAgo: 11,
    answers: {
      name: 'Seed Sponsor Lima',
      email: addr('lima'),
      organisation: `Northwind Synthetic Ltd ${SEED_ORG_MARK}`,
      role: 'Head of data',
      goal: 'A four-person data platform team who own two retrieval services between them.',
      group_size: '4',
      industry: 'Insurance',
    },
  },
  {
    slug: 'mike',
    name: 'Seed Applicant Mike',
    type: 'application',
    role: 'CTO',
    funding: 'self',
    owner: STAFF.operator,
    attribution: { ...DIRECT },
    daysAgo: 28,
    answers: {
      name: 'Seed Applicant Mike',
      email: addr('mike'),
      role: 'CTO',
      experience: 'Founded and sold one company; currently technical lead of a twelve-person startup.',
      goal: 'Whether to build an agent platform or buy one.',
      funding: 'self',
    },
  },
  {
    slug: 'november',
    name: 'Seed Applicant November',
    type: 'application',
    role: 'Staff engineer',
    funding: 'employer',
    owner: STAFF.instructor,
    consent: true,
    attribution: { ...TAGGED, session_content: 'lc-oct-d11' },
    daysAgo: 22,
    answers: {
      name: 'Seed Applicant November',
      email: addr('november'),
      role: 'Staff engineer',
      experience: 'Eleven years. I own the evaluation harness for a recommendation system used by about a million people.',
      goal: 'Carrying what I know about offline evaluation across to agents, where the output is a trajectory rather than a score.',
      funding: 'employer',
    },
  },
  {
    // Deliberately older than a 30-day reporting window. The dashboard must
    // exclude it at 30 days and include it at 90, and the difference between
    // the two must be exactly this row.
    slug: 'oscar',
    name: 'Seed Enquirer Oscar',
    type: 'enquiry',
    owner: STAFF.operator,
    attribution: { ...DIRECT },
    daysAgo: BACKDATED_DAYS,
    answers: {
      name: 'Seed Enquirer Oscar',
      email: addr('oscar'),
      question: 'Is there a version of this that runs in the European morning?',
    },
  },
  {
    // Flagged as a test. Counted nowhere, visible to an operator who goes
    // looking. E14 checks it is absent from the totals.
    //
    // ITS DATE IS THE TEST. It sits comfortably inside the 30-day window with
    // every countable row, so a totals query that forgot `is_test` would
    // report fourteen applications in that band rather than twelve. Dated
    // outside the window it would be excluded for the wrong reason and the
    // case would pass without observing anything.
    slug: 'papa',
    name: 'Seed Applicant Papa',
    type: 'application',
    role: 'Engineer',
    funding: 'self',
    owner: STAFF.operator,
    isTest: true,
    attribution: { ...DIRECT },
    daysAgo: 15,
    answers: {
      name: 'Seed Applicant Papa',
      email: addr('papa'),
      role: 'Engineer',
      experience: 'Filled in during a walkthrough of the form. Not a real application.',
      goal: 'Checking the form saves.',
      funding: 'self',
    },
  },
  {
    // A honeypot misfire, filed rather than thrown away — the schema comment
    // is explicit that a flagged row is still a row.
    slug: 'quebec',
    name: 'Seed Applicant Quebec',
    type: 'application',
    role: 'Engineer',
    funding: 'self',
    owner: STAFF.operator,
    isSpam: true,
    attribution: { ...DIRECT },
    daysAgo: 12,
    answers: {
      name: 'Seed Applicant Quebec',
      email: addr('quebec'),
      role: 'Engineer',
      experience: 'Tripped the honeypot. Held here rather than discarded, in case it is somebody real.',
      goal: 'Unknown.',
      funding: 'self',
    },
  },
  {
    slug: 'romeo',
    name: 'Seed Sponsor Romeo',
    type: 'enterprise',
    role: 'Director of platform',
    organisation: `Copperline Imaginary Group ${SEED_ORG_MARK}`,
    industry: 'Retail',
    groupSize: 6,
    owner: STAFF.operator,
    attribution: { ...TAGGED, session_content: 'lc-oct-d09' },
    daysAgo: 13,
    answers: {
      name: 'Seed Sponsor Romeo',
      email: addr('romeo'),
      organisation: `Copperline Imaginary Group ${SEED_ORG_MARK}`,
      role: 'Director of platform',
      goal: 'Six engineers who have each built one agent and none of whom can review another one.',
      group_size: '6',
      industry: 'Retail',
    },
  },
];

/**
 * Where each person ends up, and why.
 *
 * The pipeline only ever moves a submission to `enquiry` or
 * `application_received` on its own; everything past that is an operator
 * decision, so it is applied here as one — an UPDATE plus a `stage_history`
 * row plus an activity, which is the shape the console's write path produces.
 *
 * Between them these cover every member stage and three enterprise ones, so no
 * lane on the Overview renders empty and the side states are visible.
 */
const STAGES: { slug: string; to: string; reason?: string; next?: string; dueInDays?: number }[] = [
  { slug: 'charlie', to: 'qualification', next: 'Confirm the employer approval is in writing.', dueInDays: 4 },
  { slug: 'delta', to: 'technical_review', next: 'Sunil to read the experience answer before the call.', dueInDays: 2 },
  { slug: 'echo', to: 'offer' },
  { slug: 'foxtrot', to: 'enrolled' },
  { slug: 'november', to: 'enrolled' },
  {
    slug: 'golf',
    to: 'withdrawn',
    reason: 'Withdrew before the cohort started; deposit returned in full.',
  },
  { slug: 'juliet', to: 'on_hold', reason: 'Paused at their request until the next cohort.' },
  {
    slug: 'kilo',
    to: 'unsuitable',
    reason: 'Not a systems-design role. Pointed at the guides instead, with an offer to revisit.',
  },
  { slug: 'mike', to: 'closed', reason: 'Decided to buy rather than build. Closed with their agreement.' },
  { slug: 'hotel', to: 'order_agreed', next: 'Confirm the nominated nine and the two delivery dates.' },
  { slug: 'lima', to: 'technical_scoping' },
  { slug: 'romeo', to: 'quote' },
];

// ---------------------------------------------------------------------------

const days = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
const hence = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

/**
 * Does the cast still sit where E14's arithmetic expects it?
 *
 * The counts in SEED_EXPECTATIONS and the bands in WINDOW are two descriptions
 * of one dataset, and nothing stops somebody editing the cast and leaving both
 * behind. That drift does not raise — E14 simply starts reconciling against a
 * number nobody meant, and reports a failure whose cause is three files away.
 *
 * So it is checked before anything is written, and again in a dry run, which
 * is the one place somebody editing this file is actually looking.
 */
function dateProblems(): string[] {
  const out: string[] = [];
  const countable = CAST.filter((p) => p.daysAgo !== BACKDATED_DAYS);

  for (const p of countable) {
    const d = p.daysAgo ?? 0;
    if (d < WINDOW.newest || d > WINDOW.oldest) {
      out.push(
        `${p.slug} (${p.type}) is dated ${d} days ago, outside the ${WINDOW.newest}–${WINDOW.oldest} day band.`,
      );
    }
  }

  const backdated = CAST.filter((p) => p.daysAgo === BACKDATED_DAYS);
  if (backdated.length !== 1) {
    out.push(`${backdated.length} rows are backdated to ${BACKDATED_DAYS} days. E14 expects exactly one.`);
  } else if (backdated[0]!.type !== 'enquiry') {
    out.push('The backdated row must be an enquiry; E14 reads the enquiries tile to find it.');
  }

  const tally = (type: Person['type'], flagged: boolean) =>
    CAST.filter((p) => p.type === type && Boolean(p.isTest || p.isSpam) === flagged).length;

  const expect: [string, number, number][] = [
    ['people', new Set(CAST.map((p) => p.slug)).size, SEED_EXPECTATIONS.people],
    ['submissions', CAST.length, SEED_EXPECTATIONS.submissions],
    ['applicationRows', CAST.filter((p) => p.type === 'application').length, SEED_EXPECTATIONS.applicationRows],
    ['countableApplications', tally('application', false), SEED_EXPECTATIONS.countableApplications],
    [
      'countableApplicants',
      new Set(CAST.filter((p) => p.type === 'application' && !p.isTest && !p.isSpam).map((p) => p.slug)).size,
      SEED_EXPECTATIONS.countableApplicants,
    ],
    ['countableEnquiries', tally('enquiry', false), SEED_EXPECTATIONS.countableEnquiries],
    [
      'enquiriesInsideThirtyDays',
      CAST.filter((p) => p.type === 'enquiry' && (p.daysAgo ?? 0) <= WINDOW.oldest).length,
      SEED_EXPECTATIONS.enquiriesInsideThirtyDays,
    ],
    ['enterpriseSubmissions', tally('enterprise', false), SEED_EXPECTATIONS.enterpriseSubmissions],
    ['flaggedTest', CAST.filter((p) => p.isTest).length, SEED_EXPECTATIONS.flaggedTest],
    ['flaggedSpam', CAST.filter((p) => p.isSpam).length, SEED_EXPECTATIONS.flaggedSpam],
  ];

  for (const [label, actual, expected] of expect) {
    if (actual !== expected) {
      out.push(`The cast holds ${actual} ${label}; SEED_EXPECTATIONS says ${expected}.`);
    }
  }

  return out;
}

interface Created {
  submissionId: string;
  personId: string;
  opportunityId: string;
  reference: string;
}

/** Exactly what `pipeline_submit()` returns, spelled the way Postgres spells it. */
interface SubmitRow {
  submission_id: string;
  reference: string;
  already_existed: boolean;
  person_id: string;
  opportunity_id: string;
}

async function submitOne(
  client: SupabaseClient,
  person: Person,
  cohortId: string,
  allTest: boolean,
  n: number,
): Promise<Created> {
  const email = addr(person.slug);

  // The reference is minted by the shipped generator. On the (vanishingly
  // rare) collision pipeline_submit raises before writing anything, so a
  // retry costs nothing.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const reference = newReference();
    const { data, error } = await client.rpc('pipeline_submit', {
      p_request_key: `seed:${person.slug}:${person.type}:${n}`,
      p_reference: reference,
      p_type: person.type,
      p_cohort_id: person.type === 'enterprise' ? null : cohortId,
      p_name: person.name,
      // Trimmed and lower-cased, and the plus-tag is NOT stripped — the same
      // rule people.normalised_email is matched on.
      p_normalised_email: email.trim().toLowerCase(),
      p_original_email: email,
      p_phone: person.phone ?? null,
      p_role: person.role ?? null,
      p_organisation_name: person.organisation ?? null,
      p_industry: person.industry ?? null,
      p_answers: person.answers,
      p_funding_route: person.funding ?? null,
      p_group_size: person.groupSize ?? null,
      // Null, and it stays null. A version string here would be a record
      // claiming somebody was shown a privacy notice that is not published.
      p_privacy_notice_version: null,
      p_owner: person.owner ?? null,
      p_task_due_at:
        person.taskOverdueDays !== undefined ? days(person.taskOverdueDays) : null,
      p_attribution: person.attribution ?? {},
      p_consent: person.consent
        ? {
            granted: true,
            purpose: MARKETING_CONSENT.purpose,
            wording: MARKETING_CONSENT.wording,
            wording_version: MARKETING_CONSENT.version,
            source: `${person.type}_form`,
          }
        : null,
      p_is_test: allTest ? true : (person.isTest ?? false),
      p_is_spam: person.isSpam ?? false,
      p_actor: 'seed_script',
    });

    if (error) {
      if (error.message.includes('pipeline_reference_taken')) continue;
      refuse(
        `pipeline_submit refused the ${person.type} row for ${person.slug}: ${error.message}`,
        '',
        'Rows written before this point are still there. They carry the seed markers,',
        'so they come out cleanly:',
        '',
        '  npm run seed -- --project <ref> --clear',
      );
    }

    const row = (data as SubmitRow[] | null)?.[0];
    if (!row) refuse('pipeline_submit returned no row. The function exists but answered nothing.');

    // A submission arriving in the past is an ordinary fact — an import, a
    // backfill, or in this case a reporting window that has to be crossed.
    // `submitted_at` is the EVIDENCE date and is the one the totals read;
    // `created_at` stays today, which is what the schema asks for.
    if (person.daysAgo) {
      await client
        .from('form_submissions')
        .update({ submitted_at: days(person.daysAgo) })
        .eq('submission_id', row!.submission_id);
    }

    return {
      submissionId: row!.submission_id,
      personId: row!.person_id,
      opportunityId: row!.opportunity_id,
      reference: row!.reference,
    };
  }

  return refuse('Four reference collisions in a row. Something is wrong with the generator.');
}

// ---------------------------------------------------------------------------

async function create(client: SupabaseClient, allTest: boolean, dryRun: boolean) {
  // Before the database is touched at all: does this file still describe the
  // dataset it claims to? A cast that has drifted from its own counts writes a
  // dataset E14 will reconcile against the wrong numbers, and the failure it
  // reports names the dashboard rather than this edit.
  const problems = dateProblems();
  if (problems.length) {
    refuse(
      'This file no longer agrees with itself. Nothing has been written.',
      ...problems.map((p) => `  · ${p}`),
      '',
      'SEED_EXPECTATIONS, WINDOW and CAST are three descriptions of one dataset.',
      'Fix the one that is wrong before seeding, or E14 checks a number nobody meant.',
    );
  }

  const { data: cohorts, error: cohortError } = await client
    .from('cohorts')
    .select('cohort_id, public_label, route')
    .eq('route', 'member')
    .order('created_at')
    .limit(1);

  if (cohortError) {
    refuse(
      'The cohorts table did not answer.',
      `Postgres said: ${cohortError.code ?? cohortError.message}`,
      'If that is 42P01 or PGRST205, supabase/schema.sql has not been applied to this',
      'project. It is a paste into the SQL editor and the file is idempotent.',
    );
  }

  const cohortId = cohorts?.[0]?.cohort_id as string | undefined;
  if (!cohortId) {
    refuse(
      'No member cohort exists in this database.',
      'schema.sql seeds exactly one into an empty table; if it is missing, the file',
      'has not been run here.',
    );
  }

  const existing = await client
    .from('people')
    .select('person_id', { count: 'exact', head: true })
    .like('normalised_email', SEED_EMAIL_PATTERN);

  if ((existing.count ?? 0) > 0) {
    refuse(
      `${existing.count} seeded person record(s) are already here.`,
      'This dataset is a known quantity — running it twice would double the',
      'submissions and E14 would then reconcile against a number nobody meant.',
      'Clear it first:  npm run seed -- --project <ref> --clear',
    );
  }

  if (dryRun) {
    console.log('\n  Dry run. Nothing was written.\n');
    console.log(`  Cohort:        ${cohorts?.[0]?.public_label ?? '—'}`);
    console.log(`  People:        ${SEED_EXPECTATIONS.people}`);
    console.log(
      `  Organisations: ${SEED_EXPECTATIONS.organisations} rows for 3 company names — two sponsors name the same`,
    );
    console.log('                 company, so the second row is flagged needs_review, not merged');
    console.log(`  Opportunities: ${SEED_EXPECTATIONS.opportunities}`);
    console.log(`  Submissions:   ${SEED_EXPECTATIONS.submissions}`);
    console.log(
      `                 ${SEED_EXPECTATIONS.countableApplications} applications from ${SEED_EXPECTATIONS.countableApplicants} applicants · ` +
        `${SEED_EXPECTATIONS.countableEnquiries} enquiries · ${SEED_EXPECTATIONS.enterpriseSubmissions} enterprise`,
    );
    console.log(
      `                 plus ${SEED_EXPECTATIONS.flaggedTest} flagged test and ${SEED_EXPECTATIONS.flaggedSpam} flagged spam, counted nowhere`,
    );
    console.log(`  Evidence:      ${SEED_EXPECTATIONS.meetings} meetings · ${SEED_EXPECTATIONS.offers} offers · ${SEED_EXPECTATIONS.payments} payments in 2 currencies`);
    console.log(`                 ${SEED_EXPECTATIONS.admissions} admissions · ${SEED_EXPECTATIONS.attendance} attendance rows · ${SEED_EXPECTATIONS.nominations} nominations`);
    console.log(`  Left waiting:  ${SEED_EXPECTATIONS.unowned} unowned lead · ${SEED_EXPECTATIONS.overdueTasks} overdue task`);
    console.log(
      `  Dated:         ${WINDOW.newest}–${WINDOW.oldest} days ago, and one enquiry at ${WINDOW.backdated} days.`,
    );
    console.log('                 Nothing inside 7 days, which is how E14 subtracts its own writes.\n');
    if (allTest) {
      console.log('  --all-test is set: every submission would be flagged, so the dashboard');
      console.log('  would count none of them and E14 could not run.\n');
    }
    return;
  }

  // -- submissions ----------------------------------------------------------

  const made = new Map<string, Created>();
  const submissionIds: string[] = [];

  for (const [i, person] of CAST.entries()) {
    const row = await submitOne(client, person, cohortId!, allTest, i);
    submissionIds.push(row.submissionId);
    // The last write for a slug wins, which is what we want: Alpha's three
    // submissions all resolve to the one opportunity.
    made.set(person.slug, row);
  }

  const opp = (slug: string) => made.get(slug)!.opportunityId;
  const who = (slug: string) => made.get(slug)!.personId;

  // -- stages ---------------------------------------------------------------

  for (const move of STAGES) {
    const id = opp(move.slug);
    const { data: before } = await client
      .from('opportunities')
      .select('stage')
      .eq('opportunity_id', id)
      .maybeSingle();

    await client
      .from('opportunities')
      .update({
        stage: move.to,
        stage_entered_at: days(2),
        closure_reason: move.reason ?? null,
        next_action: move.next ?? null,
        due_at: move.dueInDays ? hence(move.dueInDays) : null,
      })
      .eq('opportunity_id', id);

    await client.from('stage_history').insert({
      opportunity_id: id,
      from_stage: before?.stage ?? null,
      to_stage: move.to,
      actor: STAFF.operator,
      reason: move.reason ?? null,
      is_reversal: false,
      occurred_at: days(2),
    });

    await client.from('activities').insert({
      opportunity_id: id,
      type: 'stage_changed',
      actor: STAFF.operator,
      occurred_at: days(2),
      notes: move.reason ?? `Moved to ${move.to}.`,
    });
  }

  // Exactly one lead is left unowned, so the Overview's unassigned figure has
  // something true to say. India's task is already three days late.
  await client.from('opportunities').update({ owner: null }).eq('opportunity_id', opp('india'));

  // -- meetings -------------------------------------------------------------
  // Scheduled and held are two different facts, and a meeting nobody came to
  // is the one a table of held meetings cannot tell you about.

  await client.from('meetings').insert([
    {
      opportunity_id: opp('charlie'),
      scheduled_at: days(12),
      status: 'held',
      // Ran twenty minutes late. Deliberately not equal to scheduled_at.
      held_at: new Date(Date.parse(days(12)) + 20 * 60_000).toISOString(),
      outcome: 'Employer funding is approved in principle; the written confirmation is still coming.',
      next_action: 'Chase the written approval, then move to technical review.',
      recorded_by: STAFF.operator,
    },
    {
      opportunity_id: opp('delta'),
      scheduled_at: days(5),
      status: 'no_show',
      held_at: null,
      outcome: 'Nobody joined. Rebooked by email.',
      recorded_by: STAFF.operator,
    },
    {
      opportunity_id: opp('hotel'),
      scheduled_at: hence(6),
      status: 'scheduled',
      held_at: null,
      next_action: 'Scoping call with the two engineering leads.',
      recorded_by: STAFF.operator,
    },
  ]);

  // -- offers ---------------------------------------------------------------
  // Amounts are minor units and are deliberately NOT the real figures: the
  // fee lives in facts.ts and regions.ts, and a screenshot of this dataset
  // must not be mistakable for a price list.

  const { data: echoV1 } = await client
    .from('offers')
    .insert({
      opportunity_id: opp('echo'),
      version: 1,
      approved_by: STAFF.instructor,
      approved_at: days(10),
      currency: 'INR',
      amount_minor: 12345600,
      term_reference: 'Synthetic terms A — seeded record',
      accepted: false,
    })
    .select('offer_id')
    .maybeSingle();

  // A revision is a NEW ROW pointing at the one it replaces. Editing the
  // approved row in place would change terms after they were quoted.
  await client.from('offers').insert({
    opportunity_id: opp('echo'),
    version: 2,
    supersedes: echoV1?.offer_id ?? null,
    approved_by: STAFF.instructor,
    approved_at: days(3),
    currency: 'INR',
    amount_minor: 11999900,
    term_reference: 'Synthetic terms A, revised — seeded record',
    accepted: false,
  });

  const accepted = async (slug: string, currency: string, minor: number, ago: number) => {
    const { data } = await client
      .from('offers')
      .insert({
        opportunity_id: opp(slug),
        version: 1,
        approved_by: STAFF.instructor,
        approved_at: days(ago + 3),
        currency,
        amount_minor: minor,
        term_reference: 'Synthetic terms A — seeded record',
        accepted: true,
        accepted_at: days(ago),
      })
      .select('offer_id')
      .maybeSingle();
    return data?.offer_id as string | undefined;
  };

  const foxtrotOffer = await accepted('foxtrot', 'INR', 12345600, 18);
  const novemberOffer = await accepted('november', 'INR', 11111100, 15);
  const golfOffer = await accepted('golf', 'AED', 222200, 16);
  const hotelOffer = await accepted('hotel', 'AED', 555500, 9);

  // -- payments -------------------------------------------------------------
  //
  // Three things this arrangement exists to expose:
  //
  //   * Two currencies on ONE record (the enterprise order, billed partly to
  //     the Dubai entity and partly to the India one). Any code that adds
  //     across them produces a number that is wrong and looks authoritative;
  //     netByCurrency returns a row per currency and no grand total, and E14
  //     checks that the cross-currency sum appears nowhere.
  //   * A refund beside a receipt. A refund is a second row, never a deletion.
  //   * A net of ZERO that is a real, computed zero — Golf paid and was
  //     refunded in full. It must not read like "no payment recorded", which
  //     is a different fact with a different treatment.

  await client.from('payments').insert([
    {
      opportunity_id: opp('foxtrot'),
      person_id: who('foxtrot'),
      offer_id: foxtrotOffer ?? null,
      type: 'receipt',
      currency: 'INR',
      amount_minor: 12345600,
      invoice_reference: 'SEED-INV-0001',
      evidence_reference: 'Synthetic bank reference, seeded record',
      confirmed_by: STAFF.finance,
      received_at: days(17),
    },
    {
      opportunity_id: opp('november'),
      person_id: who('november'),
      offer_id: novemberOffer ?? null,
      type: 'receipt',
      currency: 'INR',
      amount_minor: 11111100,
      invoice_reference: 'SEED-INV-0002',
      evidence_reference: 'Synthetic bank reference, seeded record',
      confirmed_by: STAFF.finance,
      received_at: days(14),
    },
    {
      opportunity_id: opp('golf'),
      person_id: who('golf'),
      offer_id: golfOffer ?? null,
      type: 'receipt',
      currency: 'AED',
      amount_minor: 222200,
      invoice_reference: 'SEED-INV-0003',
      confirmed_by: STAFF.finance,
      received_at: days(15),
    },
    {
      opportunity_id: opp('golf'),
      person_id: who('golf'),
      offer_id: golfOffer ?? null,
      type: 'refund',
      currency: 'AED',
      amount_minor: 222200,
      invoice_reference: 'SEED-CRN-0003',
      evidence_reference: 'Returned in full on withdrawal. Seeded record.',
      confirmed_by: STAFF.finance,
      received_at: days(8),
    },
    {
      opportunity_id: opp('hotel'),
      person_id: who('hotel'),
      offer_id: hotelOffer ?? null,
      type: 'receipt',
      currency: 'AED',
      amount_minor: 555500,
      invoice_reference: 'SEED-INV-0004',
      confirmed_by: STAFF.finance,
      received_at: days(7),
    },
    {
      opportunity_id: opp('hotel'),
      person_id: who('hotel'),
      offer_id: hotelOffer ?? null,
      type: 'receipt',
      currency: 'INR',
      amount_minor: 7777700,
      invoice_reference: 'SEED-INV-0005',
      evidence_reference: 'Balance billed to the India entity. Seeded record.',
      confirmed_by: STAFF.finance,
      received_at: days(5),
    },
  ]);

  // The AED refund on the enterprise order: one nominee dropped out.
  await client.from('payments').insert({
    opportunity_id: opp('hotel'),
    person_id: who('hotel'),
    offer_id: hotelOffer ?? null,
    type: 'refund',
    currency: 'AED',
    amount_minor: 111100,
    invoice_reference: 'SEED-CRN-0004',
    evidence_reference: 'One nominated participant withdrew. Seeded record.',
    confirmed_by: STAFF.finance,
    received_at: days(2),
  });

  // -- admissions -----------------------------------------------------------
  // Including a decline, because "we decided not to" is a fact worth keeping
  // and its absence is what makes a pipeline look stalled when it is not.

  await client.from('admissions').insert([
    {
      opportunity_id: opp('foxtrot'),
      decision: 'admitted',
      decided_by: STAFF.instructor,
      decided_at: days(16),
      note: 'Clear architectural responsibility and a real question to work on.',
    },
    {
      opportunity_id: opp('november'),
      decision: 'admitted',
      decided_by: STAFF.instructor,
      decided_at: days(13),
      note: 'Strong evaluation background; the cohort will benefit from it.',
    },
    {
      opportunity_id: opp('kilo'),
      decision: 'declined',
      decided_by: STAFF.instructor,
      decided_at: days(21),
      note: 'Not a systems-design role today. Worth revisiting in a year.',
    },
  ]);

  // -- attendance -----------------------------------------------------------
  // Confirming you will come and coming are two facts, and neither is evidence
  // of payment. November confirmed and did not arrive; that has to be visible.

  await client.from('attendance').insert([
    {
      person_id: who('foxtrot'),
      cohort_id: cohortId,
      session_id: null,
      confirmation_response: 'yes',
      confirmed_at: days(12),
      recorded_by: STAFF.programme,
    },
    {
      person_id: who('foxtrot'),
      cohort_id: cohortId,
      session_id: 'week-1',
      attended: true,
      recorded_by: STAFF.programme,
      occurred_on: days(6).slice(0, 10),
    },
    {
      person_id: who('november'),
      cohort_id: cohortId,
      session_id: 'week-1',
      confirmation_response: 'yes',
      confirmed_at: days(9),
      attended: false,
      recorded_by: STAFF.programme,
      occurred_on: days(6).slice(0, 10),
    },
  ]);

  // -- nominations ----------------------------------------------------------
  //
  // An organisation order is not nine applications. These six are not people
  // rows, not applicants, and not counted anywhere a member figure is counted.
  // E14's second check is that none of these addresses ever became a person.

  const nominee = (n: number, role: string) => ({
    name: `Seed Nominee ${n}`,
    email: addr(`nominee-${n}`),
    role,
  });

  await client.from('nominations').insert([
    { opportunity_id: opp('hotel'), ...nominee(1, 'Senior engineer'), note: 'Dubai.' },
    { opportunity_id: opp('hotel'), ...nominee(2, 'Senior engineer'), note: 'Dubai.' },
    { opportunity_id: opp('hotel'), ...nominee(3, 'Tech lead'), note: 'Bangalore.' },
    { opportunity_id: opp('hotel'), ...nominee(4, 'Engineering manager'), note: 'Bangalore. Withdrew; see the refund.' },
    { opportunity_id: opp('romeo'), ...nominee(5, 'Platform engineer'), note: null },
    { opportunity_id: opp('romeo'), ...nominee(6, 'Platform engineer'), note: null },
  ]);

  // -- consent withdrawal ---------------------------------------------------
  // A new row, never an update. The trigger on this table would refuse an
  // UPDATE anyway, which is the point of having it.

  await client.from('consents').insert({
    person_id: who('alpha'),
    purpose: MARKETING_CONSENT.purpose,
    state: 'withdrawn',
    wording: MARKETING_CONSENT.wording,
    wording_version: MARKETING_CONSENT.version,
    source: 'unsubscribe_link',
    obtained_at: days(3),
    withdrawn_at: days(3),
  });

  // -- a little tidying, so the task list is not uniformly open --------------

  await client
    .from('tasks')
    .update({ completed_at: days(11) })
    .in('opportunity_id', [opp('charlie'), opp('foxtrot'), opp('november'), opp('mike')]);

  // -- what actually landed -------------------------------------------------
  //
  // Counted back out of the database rather than assumed. SEED_EXPECTATIONS is
  // what E14 reconciles against, so a silent drift between this file's cast and
  // its own numbers would turn that case into a test of nothing.

  const counts = await countSeeded(client);
  console.log('\n  Seeded.\n');
  for (const [label, value] of Object.entries(counts)) {
    console.log(`    ${label.padEnd(22)} ${value}`);
  }

  // Every count, against its expectation, by name. The first version of this
  // checked five of them and compared payments against `payments + 1`, which
  // is the arithmetic somebody writes when the constant is wrong and the
  // comparison is being bent to agree with it.
  const drift = (
    [
      ['people', counts.people, SEED_EXPECTATIONS.people],
      ['organisations', counts.organisations, SEED_EXPECTATIONS.organisations],
      ['opportunities', counts.opportunities, SEED_EXPECTATIONS.opportunities],
      ['submissions', counts.submissions, SEED_EXPECTATIONS.submissions],
      ['meetings', counts.meetings, SEED_EXPECTATIONS.meetings],
      ['offers', counts.offers, SEED_EXPECTATIONS.offers],
      ['payments', counts.payments, SEED_EXPECTATIONS.payments],
      ['admissions', counts.admissions, SEED_EXPECTATIONS.admissions],
      ['nominations', counts.nominations, SEED_EXPECTATIONS.nominations],
      ['attendance', counts.attendance, SEED_EXPECTATIONS.attendance],
    ] as const
  )
    .filter(([, actual, expected]) => actual !== expected)
    .map(([label, actual, expected]) => `${label}: wrote ${actual}, expected ${expected}`);

  if (drift.length) {
    console.log('\n  WARNING: what landed differs from SEED_EXPECTATIONS in this file.');
    drift.forEach((d) => console.log(`    · ${d}`));
    console.log('  E14 reconciles against those numbers. Fix them before trusting it.\n');
  } else {
    console.log('\n  Counts agree with SEED_EXPECTATIONS. `npm run acceptance` can now run E14.');
    console.log(`  Remove all of it with:  npm run seed -- --project <ref> --clear\n`);
  }
}

async function countSeeded(client: SupabaseClient) {
  const people = await client
    .from('people')
    .select('person_id')
    .like('normalised_email', SEED_EMAIL_PATTERN);

  const ids = (people.data ?? []).map((p) => p.person_id as string);

  const count = async (table: string, column: string, values: string[]) => {
    if (!values.length) return 0;
    const { count: n } = await client
      .from(table)
      .select(column, { count: 'exact', head: true })
      .in(column, values);
    return n ?? 0;
  };

  const { data: opps } = ids.length
    ? await client.from('opportunities').select('opportunity_id').in('person_id', ids)
    : { data: [] as { opportunity_id: string }[] };
  const oppIds = (opps ?? []).map((o) => o.opportunity_id as string);

  const orgs = await client
    .from('organisations')
    .select('organisation_id', { count: 'exact', head: true })
    .ilike('name', `%${SEED_ORG_MARK}%`);

  return {
    people: ids.length,
    organisations: orgs.count ?? 0,
    opportunities: oppIds.length,
    submissions: await count('form_submissions', 'person_id', ids),
    meetings: await count('meetings', 'opportunity_id', oppIds),
    offers: await count('offers', 'opportunity_id', oppIds),
    payments: await count('payments', 'opportunity_id', oppIds),
    admissions: await count('admissions', 'opportunity_id', oppIds),
    nominations: await count('nominations', 'opportunity_id', oppIds),
    attendance: await count('attendance', 'person_id', ids),
    consents: await count('consents', 'person_id', ids),
    tasks: await count('tasks', 'opportunity_id', oppIds),
  };
}

// ---------------------------------------------------------------------------
// Clearing
// ---------------------------------------------------------------------------
//
// HOW IT KNOWS WHAT IS ITS OWN: the two markers, and only the two markers. It
// finds people whose normalised address ends `+seed@thelivingcraft.invalid`,
// takes their opportunities, and works outwards from there. Nothing is deleted
// on a date, a batch id or "everything created since"; a real row cannot carry
// those markers, and a seeded row cannot fail to.
//
// MOST OF THE WORK IS DONE BY `ON DELETE CASCADE`, and the exceptions are the
// whole reason this function is longer than one line:
//
//   * `payments` is ON DELETE SET NULL on both its foreign keys, so deleting a
//     person leaves the payment behind as an orphan with no owner. Finance
//     records outliving their subject is right for a real correction and wrong
//     for a fake one, so these go first and explicitly.
//   * `audit_log` has no foreign key at all, on purpose — the record that a
//     decision was made has to outlive the conversation. So its rows are
//     matched by the submission and opportunity ids collected before anything
//     is removed, which is why the order below matters.
//   * `organisations` is SET NULL from `people`, so the seeded companies
//     survive their contacts and are deleted by their `[seed]` name. There are
//     four rows for three names -- two sponsors named one company and the
//     pipeline flagged the second for review rather than merging it.
//
// Everything else — submissions, attributions, consents, opportunities,
// activities, tasks, meetings, offers, admissions, attendance, nominations,
// stage history — cascades from the person or the opportunity.

async function clear(client: SupabaseClient, dryRun: boolean) {
  const { data: people, error } = await client
    .from('people')
    .select('person_id')
    .like('normalised_email', SEED_EMAIL_PATTERN);

  if (error) {
    refuse(
      'The people table did not answer.',
      `Postgres said: ${error.code ?? error.message}`,
      'If that is 42P01 or PGRST205, supabase/schema.sql has not been applied here,',
      'so there is nothing seeded to remove.',
    );
  }

  const personIds = (people ?? []).map((p) => p.person_id as string);

  if (!personIds.length) {
    console.log('\n  Nothing seeded in this database. Nothing to remove.\n');
    return;
  }

  const { data: opps } = await client
    .from('opportunities')
    .select('opportunity_id')
    .in('person_id', personIds);
  const oppIds = (opps ?? []).map((o) => o.opportunity_id as string);

  const { data: subs } = await client
    .from('form_submissions')
    .select('submission_id')
    .in('person_id', personIds);
  const subIds = (subs ?? []).map((s) => s.submission_id as string);

  if (dryRun) {
    console.log('\n  Dry run. Nothing was deleted.\n');
    console.log(`    people          ${personIds.length}`);
    console.log(`    opportunities   ${oppIds.length}`);
    console.log(`    submissions     ${subIds.length}`);
    console.log('\n  Everything hanging off those cascades, except payments, audit rows');
    console.log('  and the seeded organisations, which are removed explicitly.\n');
    return;
  }

  // Payments first: they would survive the person otherwise.
  if (oppIds.length) await client.from('payments').delete().in('opportunity_id', oppIds);
  await client.from('payments').delete().in('person_id', personIds);

  // Then the audit rows, by the ids they point at. `record_id` has no FK, so
  // this is the only thing that will ever remove them.
  if (subIds.length) await client.from('audit_log').delete().in('record_id', subIds);
  if (oppIds.length) await client.from('audit_log').delete().in('record_id', oppIds);

  // The person carries the rest away with it.
  const { error: delError } = await client.from('people').delete().in('person_id', personIds);
  if (delError) refuse(`Could not delete the seeded people: ${delError.message}`);

  // Organisations are SET NULL from people, so they are still here.
  await client.from('organisations').delete().ilike('name', `%${SEED_ORG_MARK}%`);

  const left = await client
    .from('people')
    .select('person_id', { count: 'exact', head: true })
    .like('normalised_email', SEED_EMAIL_PATTERN);

  console.log(`\n  Removed ${personIds.length} people, ${oppIds.length} opportunities and ${subIds.length} submissions,`);
  console.log('  with everything that cascaded from them, plus their payments, audit rows');
  console.log('  and organisations.');
  console.log(`\n  Seeded people remaining: ${left.count ?? 0}\n`);
  console.log('  The Web3Forms inbox is not reachable from here and never held any of');
  console.log('  this: nothing seeded was ever sent anywhere.\n');
}

// ---------------------------------------------------------------------------

async function main() {
  if (has('help') || process.argv.length <= 2) {
    if (!has('help')) {
      // Said before the usage rather than after it, because a wall of help
      // text scrolls the important sentence off the top: this did nothing.
      console.error('\n  Nothing was written. --project is required, and names which database you mean.');
    }
    usage();
    // Asking for help is not a failure; being given no arguments at all is,
    // because the next thing that happens is somebody assuming it ran.
    process.exitCode = has('help') ? 0 : 1;
    return;
  }

  const dryRun = has('dry-run');
  const clearing = has('clear');
  const allTest = has('all-test');

  // Gate 1 — the wrong shell.
  const signal = PROD_ENV_SIGNALS.find((v) => process.env[v]);
  if (signal || process.env.NODE_ENV === 'production') {
    refuse(
      `This is running inside a deployment or a CI job (${signal ?? 'NODE_ENV=production'}).`,
      'It writes invented applicants into a pipeline. There is no flag for this one.',
    );
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    refuse(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed. Put them in .env.local,',
      'and check WHICH database they name before you do.',
    );
  }

  // Gate 2 — the wrong project.
  const ref = projectRef(url!);
  const named = arg('project')?.trim();
  if (!named) {
    refuse(
      '--project is required, and it is not printed here.',
      'Open the SUPABASE_URL this shell is using, read the project ref out of it,',
      'and type it. The value of the flag is that you looked.',
    );
  }
  if (!ref || named !== ref) {
    refuse(
      'That is not the project this environment points at.',
      'The ref is deliberately not echoed — a refusal that tells you the answer is',
      'a prompt, not a check. Go and read SUPABASE_URL.',
    );
  }

  const client = createClient(url!, key!, { auth: { persistSession: false } });

  if (clearing) {
    // Gate 3 does NOT apply to clearing. Removing rows that carry the seed
    // markers is safe on any database, and if this ever did run somewhere it
    // should not have, being able to clear up is the entire recovery path.
    await clear(client, dryRun);
    return;
  }

  // Gate 3 — the wrong database altogether.
  const live = await looksLive(client);
  const override = has('i-know-this-is-not-production');

  // A probe that could not be run is not a probe that passed, and there is no
  // override for it: the override exists for "I know what is in there", which
  // is precisely what nobody knows when the question came back unanswered.
  if (live.unanswered.length) {
    refuse(
      'The live-data check could not be completed, so it is not a check.',
      ...live.unanswered.map((u) => `  · could not read ${u}`),
      '',
      'A missing table is fine and reads as empty. Anything else — a key that is not',
      'accepted, a project that is not answering — means this script does not know what',
      'is in that database, and it will not write invented applicants into one it',
      'cannot see. Fix the connection and run it again.',
    );
  }

  if (live.found.length && !override) {
    refuse(
      'This database holds records that a scratch project does not:',
      ...live.found.map((l) => `  · ${l}`),
      '',
      'An address that can receive mail is the clearest signal there is that this',
      'is somebody real. Point SUPABASE_URL at a different project.',
      '',
      'If you are certain — a staging copy, a restored backup — repeat with',
      '--i-know-this-is-not-production. It is spelled out at that length because it',
      'should not be reachable from muscle memory.',
    );
  }
  if (live.found.length) {
    console.log('\n  WARNING: overriding the live-data check. This database holds:');
    live.found.forEach((l) => console.log(`    · ${l}`));
    console.log('  Continuing because --i-know-this-is-not-production was given.\n');
  }

  await create(client, allTest, dryRun);
}

// Only when run, never when imported. `scripts/acceptance.ts` imports the
// markers and SEED_EXPECTATIONS from this file so that "what the seed created"
// has one definition rather than two that drift.
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main().catch((err) => {
    // A Refusal is already written for a reader; anything else is a surprise
    // and gets whatever it has to say. `exitCode` rather than `exit()` — see
    // the note on Refusal.
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
