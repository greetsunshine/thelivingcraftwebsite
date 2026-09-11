-- Admin console storage. Run once against a fresh Supabase project:
--   Supabase dashboard -> SQL Editor -> paste -> Run.
-- Re-running is safe; every statement is idempotent.
--
-- WHY THIS EXISTS AT ALL. CLAUDE.md says the site has no database, and that was
-- right while every surface was a static page and every lead was an email. The
-- admin console needs two things a static site cannot have: a lead history that
-- outlives an inbox, and traffic the site itself can read back. So the exception
-- is widened deliberately and narrowly:
--
--   * Visitor-facing pages still read NOTHING from here. If Supabase is down or
--     unconfigured, /, /caio, /assessment and /api/ask behave exactly as before.
--     Writes are fire-and-forget; a failed write loses a row, never a lead.
--   * Web3Forms remains the delivery path for every lead. This table is the
--     RECORD, not the notification. If the two ever disagree, the inbox wins.
--   * Nothing here feeds the Q&A agent's grounding. Facts still come only from
--     facts.ts.
--
-- ACCESS MODEL. RLS is on for every table with no policies attached, so the
-- anon key can read and write nothing. Only the service-role key reaches this
-- data, it lives in Vercel env vars, and it is never shipped to a browser.

-- ---------------------------------------------------------------------------
-- Events — first-party traffic
-- ---------------------------------------------------------------------------
-- Deliberately not a general analytics store. It answers the questions this
-- practice actually has: which surface is the front door, does the assessment
-- page feed /caio, do people open the agent, do they start the form and stop.
--
-- `visitor` is a DAILY-ROTATING hash of IP + user-agent + a server salt. It
-- makes "how many people" answerable without storing an identifier that follows
-- someone across days. Raw IPs are never written.

create table if not exists public.events (
  id            bigserial primary key,
  created_at    timestamptz not null default now(),
  -- pageview | ask_open | ask_question | apply_start | apply_submit | cta_click
  type          text        not null,
  path          text        not null,
  referrer_host text,
  country       text,
  region        text,
  device        text,
  visitor       text,
  meta          jsonb
);

create index if not exists events_created_idx on public.events (created_at desc);
create index if not exists events_type_created_idx on public.events (type, created_at desc);
create index if not exists events_path_idx on public.events (path);

-- ---------------------------------------------------------------------------
-- Leads — what people entered, from either path
-- ---------------------------------------------------------------------------
-- source = 'form'  : one of the three application/enquiry forms
-- source = 'agent' : the Q&A agent's capture_visitor tool
--
-- `delivered` records whether the browser's Web3Forms post succeeded. A row
-- with delivered = false is a lead that reached the database but may never have
-- reached the inbox — the single most important thing this table can tell you,
-- and invisible before it existed.

create table if not exists public.leads (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  source      text        not null default 'form',
  surface     text        not null default '/',
  interest    text,
  name        text,
  email       text,
  role        text,
  company     text,
  region      text,
  message     text,
  question    text,
  context     text,
  status      text        not null default 'new',
  admin_note  text,
  delivered   boolean     not null default false,
  country     text,
  updated_at  timestamptz not null default now()
);

create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_email_idx on public.leads (lower(email));

-- ---------------------------------------------------------------------------
-- Questions — everything asked of the visitor Q&A agent
-- ---------------------------------------------------------------------------
-- The highest-signal table here. These are prospects telling you, unprompted,
-- what they do not understand about the offer. `answered = false` means the
-- agent had to fall back to "I don't know" — each one is a gap in facts.ts.

create table if not exists public.questions (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  session_id    text,
  surface       text,
  region        text,
  country       text,
  question      text        not null,
  answer        text,
  answered      boolean     not null default true,
  captured      boolean     not null default false,
  tools         text[],
  turns         int,
  input_tokens  int,
  output_tokens int
);

create index if not exists questions_created_idx on public.questions (created_at desc);
create index if not exists questions_answered_idx on public.questions (answered, created_at desc);

-- ---------------------------------------------------------------------------
-- Learners — the people who hold a seat
-- ---------------------------------------------------------------------------
-- The first table here that is about a PERSON rather than an event, and the
-- only one whose rows a non-admin can cause to be read. It gates /craft, the
-- cohort's course area.
--
-- WHY A CODE AND NOT A PASSWORD. Eight seats. A password means a set-password
-- flow, a reset flow, and an email sender to keep alive for eight people who
-- each log in a handful of times over six weeks. Instead Sunil issues a
-- 24-byte random code from /admin/learners when someone accepts a seat, and
-- sends it however he is already talking to them. The code IS the credential:
-- high entropy, no user-chosen weakness, revocable in one click.
--
-- Only the HMAC of the code is stored. A read of this table — a leaked service
-- key, a Supabase console left open — does not yield anything that can sign in,
-- because the HMAC secret lives in Vercel's env, not in the database.
--
-- `status` is the whole authorization model: 'active' signs in, anything else
-- ('revoked', 'withdrawn') does not. Rows are kept rather than deleted so a
-- withdrawn participant leaves a record.

create table if not exists public.learners (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  email        text        not null,
  name         text,
  cohort       text        not null default 'cohort-1',
  -- HMAC-SHA256 of the access code. Never the code itself.
  code_hash    text        not null,
  status       text        not null default 'active',
  note         text,
  last_seen_at timestamptz,
  updated_at   timestamptz not null default now()
);

-- One seat per email. Two rows for one person means a revoked code that still
-- signs in, so this is a correctness constraint, not tidiness.
--
-- The index is on the plain column, not lower(email), because the issuing path
-- upserts on it and Postgres will only take a conflict target it has a matching
-- index for. Case-insensitivity is preserved by normalising to lowercase on
-- every write instead — see issueSeat() in src/lib/craft/learners.ts.
create unique index if not exists learners_email_key on public.learners (email);
create index if not exists learners_status_idx on public.learners (status, created_at desc);

-- The guided walkthrough, in three additive columns.
--
-- On `learners` rather than in a table of their own: they are three scalars
-- about one person, and putting them here means the hard delete on
-- /craft/admin/learners erases them with no new work. Nothing here is personal
-- data beyond "did this person read the intro", but it goes when they go.
--
-- `tour_completed_at` is set when the spine is FINISHED OR EXPLICITLY SKIPPED.
-- Null means still eligible to be offered.
--
-- `tour_offers` counts how many times it has been put in front of them: 1 is
-- the auto-start on first sign-in, 2 to 4 are the dashboard cards. At 4 it is
-- never offered again.
--
-- `tour_offered_at` is when it was last offered, so a nudge cannot fire twice
-- in one calendar day.
--
-- WHY NOT REUSE last_seen_at. It looks like a first-login flag and is not one —
-- it is stamped on every authenticated request, so it is non-null before the
-- learner has read step 1.
alter table public.learners add column if not exists tour_completed_at timestamptz;
alter table public.learners add column if not exists tour_offers int not null default 0;
alter table public.learners add column if not exists tour_offered_at timestamptz;

-- ---------------------------------------------------------------------------
-- Intake — the pre-cohort self-assessment
-- ---------------------------------------------------------------------------
-- Was going to be a Google Form. It is here instead because everything a Google
-- Form would have given us already exists on this site: a gate that knows which
-- learner is asking, a console to read answers in, and a CSV route beside the
-- leads one. The form asked for an email address only so that Google could tell
-- respondents apart; behind /craft the session already answers that, so the
-- question is gone and "limit 1 response" is a unique index instead.
--
-- WHY jsonb FOR THE ANSWERS. The three sections are 5 + 13 + 6 questions and
-- the wording will change between cohorts. As columns that is a migration every
-- time Sunil rewrites a prompt; as jsonb the question text lives in one array in
-- src/lib/craft/intake.ts and the answers key off ids that outlive the wording.
-- The cost is that Postgres cannot constrain the shape — so the endpoint
-- validates against that same array before writing, and anything unrecognised
-- is dropped rather than stored.
--
-- learner_id is the identity; email/name are a snapshot taken at submit time so
-- an export still reads correctly after a seat is revoked and the row is gone.

create table if not exists public.intake_responses (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  learner_id   uuid        not null references public.learners(id) on delete cascade,
  email        text        not null,
  name         text,
  cohort       text        not null default 'cohort-1',
  -- { q1..q5: 'solid' | 'rusty' | 'new' }
  quick_check  jsonb       not null default '{}'::jsonb,
  -- { A1..A7: 1-5 }
  technical    jsonb       not null default '{}'::jsonb,
  -- { B1..B6: 1-5 }
  leadership   jsonb       not null default '{}'::jsonb,
  -- { r1..r6: text }
  reality      jsonb       not null default '{}'::jsonb,
  -- Null while a learner is part-way through. Only a row with submitted_at set
  -- is one Sunil should read as finished; the console counts on this to tell
  -- "started and abandoned" from "not started", which a Google Form could not.
  submitted_at timestamptz
);

-- One response per learner. This is what "limit 1 response" was, enforced where
-- it cannot be worked around, and it is the conflict target the upsert needs.
create unique index if not exists intake_learner_key on public.intake_responses (learner_id);
create index if not exists intake_submitted_idx on public.intake_responses (submitted_at desc nulls last);

-- ---------------------------------------------------------------------------
-- Familiarity — the week-6 re-ask of the technical and leadership questions
-- ---------------------------------------------------------------------------
create table if not exists public.familiarity_responses (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  learner_id   uuid        not null references public.learners(id) on delete cascade,
  technical    jsonb       not null default '{}'::jsonb,
  leadership   jsonb       not null default '{}'::jsonb,
  submitted_at timestamptz
);
create unique index if not exists familiarity_learner_key on public.familiarity_responses (learner_id);
create index if not exists familiarity_submitted_idx on public.familiarity_responses (submitted_at desc nulls last);

-- ---------------------------------------------------------------------------
-- Radar — market intelligence, for Sunil only
-- ---------------------------------------------------------------------------
-- Was src/data/radar.json, refreshed by a weekly agent that opened a pull
-- request. The review gate made sense for the visitor-facing retriever, whose
-- output a chatbot repeats verbatim to prospects. It made much less sense here:
-- nothing on the public site reads the radar, so the PR was gating a private
-- notebook — and it cost a merge and a deploy before Sunil could read what his
-- own agent had found.
--
-- Moving it here changes what "review" means rather than removing it. Findings
-- land with status = 'new'; hiding one is an UPDATE instead of a pull request,
-- and reading one no longer requires shipping a deployment.
--
-- The visitor Q&A agent still cannot reach this. That was previously enforced
-- by src/pages/api/ask.ts not importing a module; it is now enforced by ask.ts
-- not querying a table. Keep it that way — investment figures, India hiring
-- numbers and claims about what is failing are Sunil's to judge before
-- repeating, not a chatbot's to volunteer.

create table if not exists public.radar_findings (
  -- The agent's own slug id. Stable across runs, which is what makes the
  -- re-found-next-month case an upsert rather than a duplicate row.
  id            text        primary key,
  created_at    timestamptz not null default now(),
  gathered_at   date        not null,
  category      text        not null,
  title         text        not null,
  body          text        not null,
  implication   text,
  -- Operator-only, exactly like latest.json's reviewNote: what the agent could
  -- not confirm about its own finding. Never rendered outside /admin.
  review_note   text,
  source        text        not null,
  -- Host + path with the query string and trailing slash stripped. Deduping on
  -- this is what stops the same story returning next month under a new slug.
  source_key    text        not null,
  source_type   text,
  published_at  date,
  tags          text[],
  -- new = unread, kept = Sunil has read and kept it, hidden = dismissed.
  status        text        not null default 'new',
  updated_at    timestamptz not null default now()
);

create unique index if not exists radar_source_key on public.radar_findings (source_key);
create index if not exists radar_category_idx on public.radar_findings (category, gathered_at desc);
create index if not exists radar_status_idx on public.radar_findings (status, gathered_at desc);

-- One row per sweep. The JSON file carried a `refreshedAt` field, and the
-- console reads "never run" / "refreshed N days ago" off it; without a run
-- record that reading would silently come from the newest FINDING instead,
-- which is wrong in the case that matters — a sweep that legitimately found
-- nothing new would look like a sweep that never happened.
create table if not exists public.radar_runs (
  id           uuid        primary key default gen_random_uuid(),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  trigger      text        not null default 'schedule',
  categories   text[],
  found        int         not null default 0,
  duplicates   int         not null default 0,
  pruned       int         not null default 0,
  error        text
);

create index if not exists radar_runs_started_idx on public.radar_runs (started_at desc);

-- ---------------------------------------------------------------------------
-- Submissions — ADR decision records, one per learner per week
-- ---------------------------------------------------------------------------
create table if not exists public.submissions (
  id           uuid        primary key default gen_random_uuid(),
  learner_id   uuid        not null references public.learners(id) on delete cascade,
  week         int         not null check (week between 1 and 6),
  adr_markdown text        not null,
  repo_url     text,
  submitted_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists submissions_learner_week on public.submissions (learner_id, week);

-- A submitted ADR is a snapshot, not a live document: Sunil reads eight of these
-- a week and must not be reading against a moving target (spec §5.5). Drafts stay
-- editable; submitting freezes the text. Additive so an existing deployment
-- picks it up without dropping the table.
alter table public.submissions add column if not exists status text not null default 'submitted';
alter table public.submissions alter column submitted_at drop not null;
do $$ begin
  alter table public.submissions add constraint submissions_status_check
    check (status in ('draft', 'submitted'));
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Quiz responses — one row per learner per item
-- ---------------------------------------------------------------------------
create table if not exists public.quiz_responses (
  id           uuid        primary key default gen_random_uuid(),
  learner_id   uuid        not null references public.learners(id) on delete cascade,
  item_id      text        not null,
  answer       text        not null,
  confidence   int         not null check (confidence between 1 and 5),
  answered_at  timestamptz not null default now()
);
create unique index if not exists quiz_learner_item on public.quiz_responses (learner_id, item_id);

-- ---------------------------------------------------------------------------
-- Session prompts — "I have seen what this week's session opened"
-- ---------------------------------------------------------------------------
-- One row per learner per week, written when they dismiss the post-session
-- prompt. Its only job is to stop that prompt coming back.
--
-- ONE ROW FOR THE WHOLE PROMPT, NOT ONE PER TASK. A session ending opens two
-- things at the same instant — the feedback form and the knowledge check — and
-- two modals racing each other onto one dashboard is not twice the prompt, it
-- is a dialog people click past without reading. So there is a single prompt
-- naming both, and a single dismissal.
--
-- WHY A TABLE FOR A DISMISSAL. The repo forbids localStorage and
-- sessionStorage outright, so "they have already seen this" has nowhere else to
-- live. Without the row the modal would reappear on every navigation, which is
-- the nagging §10 rules out — so this small table is what keeps the feature on
-- the right side of that rule rather than an optimisation.
--
-- WHAT IT IS NOT is a record of who ignored what. Nothing counts these, nothing
-- reports on them, and there is no second prompt to schedule. A row means
-- "shown once, done"; absence means "not shown yet". What survives a dismissal
-- is the to-do panel on the dashboard, which the learner opens themselves —
-- a list they choose to look at, not something that chases them.
-- Anything that reads this table as compliance data is a change of purpose.
--
-- (Briefly called `quiz_prompts`, before the feedback form joined it in the
-- same prompt. That name never reached production; if a dev database has one,
-- it is an unused leftover and can be dropped.)
-- `phase` distinguishes the two moments a week has: the run-up to the session
-- and the hours after it. They are different prompts about different things, so
-- dismissing one must not silence the other.
create table if not exists public.session_prompts (
  id           uuid        primary key default gen_random_uuid(),
  learner_id   uuid        not null references public.learners(id) on delete cascade,
  week         int         not null check (week between 1 and 6),
  phase        text        not null default 'after' check (phase in ('before', 'after')),
  dismissed_at timestamptz not null default now()
);
alter table public.session_prompts add column if not exists phase text not null default 'after';
do $$ begin
  alter table public.session_prompts add constraint session_prompts_phase_check
    check (phase in ('before', 'after'));
exception when duplicate_object then null; end $$;
create unique index if not exists session_prompts_learner_week_phase
  on public.session_prompts (learner_id, week, phase);

-- ---------------------------------------------------------------------------
-- Outcome ratings — the same five statements either side of one session
-- ---------------------------------------------------------------------------
-- Two ratings a session: one before the teaching starts, one near the end. Both
-- cover THE SAME FIVE STATEMENTS, written for that session, in that session's
-- own words — "so that the two sets of numbers mean the same thing".
--
-- WAS `capability_pulses`, KEYED BY CAPABILITY ID. That version asked about
-- three of the thirteen intake capabilities, named by a `topics` array on the
-- session. Week 1, once written, turned out not to work that way: it rates five
-- bespoke outcomes at 00:05 and again at 04:52, and nothing in the teaching
-- material ever maps a week to A1–A3. Renamed rather than migrated because this
-- table had not been applied to production yet — if it ever was, this is a
-- rename plus a rewrite of every `ratings` key, not a drop.
--
-- WHY FIVE AND NOT THIRTEEN, which is unchanged and still the binding reason.
-- Asking all thirteen twice a week is twelve surveys across six weeks, and a
-- room of director-level engineers stops answering by week two — at which point
-- the data is biased toward the compliant rather than merely sparse. Five takes
-- half a minute, and the delta is ATTRIBUTABLE: movement on a statement either
-- side of the session that taught it says something about that session. The same
-- movement measured six weeks apart says only that time passed.
--
-- This does NOT replace §5.6's week-0 intake and week-6 re-ask. Those are the
-- cohort-level before/after over all thirteen capabilities and remain the
-- evidence for the programme's outcome claims. Two instruments, two jobs; see
-- src/lib/craft/pulses.ts for why merging them again breaks both.
create table if not exists public.outcome_ratings (
  id           uuid        primary key default gen_random_uuid(),
  learner_id   uuid        not null references public.learners(id) on delete cascade,
  week         int         not null check (week between 1 and 6),
  phase        text        not null check (phase in ('before', 'after')),
  -- { "harness": 3, "trace": 2, "failures": 1 } — keyed by the session's own
  -- outcome ids, values 1-5. The ids live in the session's frontmatter.
  ratings      jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create unique index if not exists outcome_ratings_learner_week_phase
  on public.outcome_ratings (learner_id, week, phase);
create index if not exists outcome_ratings_week_idx on public.outcome_ratings (week, phase);

-- ---------------------------------------------------------------------------
-- Checkpoint ratings — one number, four times a session, while it can still help
-- ---------------------------------------------------------------------------
-- Every other instrument here reports after the fact. This one fires inside the
-- session, on one named item per block, and its entire value is that Sunil can
-- act on it before the next block starts: "the drill block is where it is
-- easiest to get quietly stuck and say nothing about it."
--
-- A 2 means GO SLOWER. It is not a measure of the learner, nothing aggregates it
-- into one, and §10's cut of levels and ranks holds — Sunil's read is a count of
-- how many people are below 3 right now, never a mean and never a name in a
-- ranked list.
--
-- Keyed by the checkpoint's OFFSET into the day ('01:10'), not an index. Offsets
-- are stable, readable, and survive somebody inserting a checkpoint earlier in
-- the session; indices do not.
create table if not exists public.checkpoint_ratings (
  id           uuid        primary key default gen_random_uuid(),
  learner_id   uuid        not null references public.learners(id) on delete cascade,
  week         int         not null check (week between 1 and 6),
  -- HH:MM from the session start, matching the session file's `checkpoints`.
  at           text        not null check (at ~ '^[0-9]{2}:[0-9]{2}$'),
  rating       int         not null check (rating between 1 and 5),
  created_at   timestamptz not null default now()
);
create unique index if not exists checkpoint_ratings_learner_week_at
  on public.checkpoint_ratings (learner_id, week, at);
create index if not exists checkpoint_ratings_week_idx on public.checkpoint_ratings (week, at);

-- ---------------------------------------------------------------------------
-- Pair drafts — the decision record written in the room, by two people
-- ---------------------------------------------------------------------------
-- A DIFFERENT OBJECT FROM `submissions`, on purpose. Week 1 writes this in pairs
-- in fifteen minutes at 03:50, has another pair review it ten minutes later, and
-- then each person finishes THEIR OWN record at home. Folding the two together
-- would make two learners' submitted records start identical, which ruins both
-- Sunil's read of eight and the claim that the record is the artefact of the
-- cohort.
--
-- So this is short-lived and shared; `submissions` is considered and individual.
--
-- `author_id` is whoever typed. `partner_id` is the other half of the pair, and
-- is nullable because somebody's partner can be absent and a draft with one name
-- on it is still worth reviewing. Both cascade with the learner.
create table if not exists public.pair_drafts (
  id           uuid        primary key default gen_random_uuid(),
  week         int         not null check (week between 1 and 6),
  author_id    uuid        not null references public.learners(id) on delete cascade,
  partner_id   uuid        references public.learners(id) on delete set null,
  -- Same seven sections as a submitted record, assembled as markdown by
  -- src/lib/craft/adr.ts. One template, so week 6 reads against week 1.
  body         text        not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- One draft per pair per week, keyed on whoever typed it.
create unique index if not exists pair_drafts_author_week on public.pair_drafts (author_id, week);
create index if not exists pair_drafts_week_idx on public.pair_drafts (week, created_at desc);

-- ---------------------------------------------------------------------------
-- Pair reviews — ten minutes, four questions, 0/1/2 and a comment
-- ---------------------------------------------------------------------------
-- THE ONLY PLACE IN THE PROGRAMME A NUMBER IS PUT ON SOMEBODY'S WORK, and it is
-- put there by a peer, in the room, over ten minutes. It does not break §10's cut
-- of learner-facing levels: nothing sums these, nothing averages them, and no
-- name ever appears in a ranked list. Week 1 is explicit — "the written comment
-- matters more than the number, and there is no assessment behind this. It exists
-- to make ten minutes of review structured enough to finish."
--
-- If anything ever aggregates this column, that is the cut feature coming back.
create table if not exists public.pair_reviews (
  id           uuid        primary key default gen_random_uuid(),
  draft_id     uuid        not null references public.pair_drafts(id) on delete cascade,
  reviewer_id  uuid        not null references public.learners(id) on delete cascade,
  -- { "goals-testable": { "score": 1, "comment": "…" }, … } keyed by the
  -- question ids in src/lib/craft/adr.ts.
  answers      jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists pair_reviews_draft_reviewer
  on public.pair_reviews (draft_id, reviewer_id);
create index if not exists pair_reviews_draft_idx on public.pair_reviews (draft_id);

-- ---------------------------------------------------------------------------
-- Doubts — learner questions, classified and clustered
-- ---------------------------------------------------------------------------
create table if not exists public.doubts (
  id            uuid        primary key default gen_random_uuid(),
  learner_id    uuid        not null references public.learners(id) on delete cascade,
  body          text        not null,
  kind          text        not null check (kind in ('course', 'content')),
  capability_id text,
  cluster_id    text,
  answer        text,
  -- Where the answer came from. 'facts'/'session' are code-grounded relays of
  -- the syllabus; 'sunil' is his own words, and is the ONLY source eligible to
  -- be relayed to the next person who asks the same thing; 'relay' is that
  -- repeat. Nothing here is ever a model's own opinion — see src/lib/craft/doubts.ts.
  answer_source text        check (answer_source in ('facts', 'session', 'relay', 'sunil')),
  status        text        not null default 'new',
  created_at    timestamptz not null default now()
);
-- Additive, so an existing deployment picks it up without dropping the table.
alter table public.doubts add column if not exists answer_source text;
do $$ begin
  alter table public.doubts add constraint doubts_answer_source_check
    check (answer_source in ('facts', 'session', 'relay', 'sunil'));
exception when duplicate_object then null; end $$;

create index if not exists doubts_learner_idx on public.doubts (learner_id, created_at desc);
create index if not exists doubts_status_idx on public.doubts (status, created_at desc);
-- Relay reads "what has Sunil already answered", so it filters on both.
create index if not exists doubts_source_idx on public.doubts (answer_source, created_at desc);

-- --- The discussion forum -------------------------------------------------
--
-- This table started life as a private learner→Sunil inbox and is now the
-- THREAD table behind /craft/discussion. The name stayed: renaming a live table
-- is a migration with real downside and no user-visible gain, and every row
-- already here is a thread with no replies. The product noun is "discussion";
-- the storage noun is still `doubts`. Nowhere else in the codebase says
-- "doubt" any more — src/lib/craft/discussion.ts is the only file that has to
-- know about the mismatch, and it says so at the top.
--
-- WHY A THREAD IS COHORT-VISIBLE BY DEFAULT. Eight people, six weeks, and the
-- questions that stall someone on a Tuesday are usually stalling two others.
-- Making them private by default meant Sunil answered the same thing three
-- times and nobody learned from anybody.
--
-- WHY 'private' SURVIVES. "I don't understand any of this and I don't want to
-- say so in front of the room" is a real question that only ever gets asked in
-- private. Removing the private path to build the public one would have traded
-- one capability for another rather than adding one.
alter table public.doubts add column if not exists visibility text not null default 'cohort';
do $$ begin
  alter table public.doubts add constraint doubts_visibility_check
    check (visibility in ('cohort', 'private'));
exception when duplicate_object then null; end $$;

-- Optional. A thread reads better with a subject line, but forcing one on a
-- half-formed question is how you get "Question" fourteen times.
alter table public.doubts add column if not exists title text;

-- Sunil's pin. Ordering is otherwise purely chronological — see listThreads().
alter table public.doubts add column if not exists pinned boolean not null default false;

-- TWO MARKS, TWO MEANINGS, AND THEY ARE NOT INTERCHANGEABLE.
--   resolved_reply_id  — the ASKER says this unblocked them. It is a report
--                        about one person's Tuesday, not a claim of correctness.
--   endorsed_reply_id  — SUNIL says this is right. That is the claim of
--                        correctness, and only he can make it.
-- Collapsing these into one "accepted answer" is the failure this whole
-- surface is shaped to avoid: a confident peer answer wearing the authority of
-- the course. See src/lib/craft/discussion.ts.
alter table public.doubts add column if not exists resolved_reply_id uuid;
alter table public.doubts add column if not exists endorsed_reply_id uuid;

create index if not exists doubts_visibility_idx on public.doubts (visibility, created_at desc);

-- ---------------------------------------------------------------------------
-- Discussion replies — peers, Sunil, and the syllabus
-- ---------------------------------------------------------------------------
-- author_role is the load-bearing column. A reply is read very differently
-- depending on who wrote it, and the difference must be in the data rather
-- than inferred from whether learner_id happens to be null:
--
--   'learner'    — a peer. Helpful, and possibly wrong. Shown with their name.
--   'instructor' — Sunil. The only role whose words carry the course's
--                  authority, and (see discussion.ts) the ONLY role whose text
--                  is ever eligible to be relayed verbatim to a later asker.
--   'system'     — a grounded answer from facts.ts or session frontmatter,
--                  written by code, never by a model. Labelled as not-a-person
--                  on screen.
--
-- ON §7's CASCADE RULE. learner_id cascades, so erasing someone really removes
-- their replies — their words are their personal data. It is null for the other
-- two roles, which the cascade simply does not touch, so Sunil's answers and
-- the syllabus relays survive a learner leaving. Erasing a thread's AUTHOR
-- takes the thread and therefore this table's rows on it, including other
-- people's replies. That is deliberate: a DPDP deletion is not answered by
-- keeping the conversation and removing the name from the top of it.
create table if not exists public.discussion_replies (
  id           uuid        primary key default gen_random_uuid(),
  doubt_id     uuid        not null references public.doubts(id) on delete cascade,
  learner_id   uuid        references public.learners(id) on delete cascade,
  author_role  text        not null check (author_role in ('learner', 'instructor', 'system')),
  body         text        not null,
  created_at   timestamptz not null default now()
);
create index if not exists discussion_replies_thread on public.discussion_replies (doubt_id, created_at);
create index if not exists discussion_replies_learner on public.discussion_replies (learner_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Feedback — post-session responses, two questions per session
-- ---------------------------------------------------------------------------
-- FOUR QUESTIONS, TWO JOBS. `landed` and `pacing` are about the SESSION and are
-- what makes "what to change before Thursday" possible. `changing` and `unsure`
-- are the two lines the room actually answers at the close, and they are about
-- the LEARNER: a commitment and a doubt.
--
-- `unsure` is nullable and usually stays null here, because it does not belong
-- in this table. The close's second line — "the thing I am still unsure about" —
-- opens a thread in the forum instead, where another learner can answer it
-- before Sunil gets there. The column exists so the text is not lost if the
-- forum write fails; a row with `unsure` set and no thread is a delivery
-- failure, not a design.
create table if not exists public.feedback (
  id           uuid        primary key default gen_random_uuid(),
  learner_id   uuid        not null references public.learners(id) on delete cascade,
  week         int         not null check (week between 1 and 6),
  landed       text        not null,
  pacing       text        not null,
  changing     text,
  unsure       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
-- Additive, for a table that may already exist in production.
alter table public.feedback add column if not exists changing text;
alter table public.feedback add column if not exists unsure text;
create unique index if not exists feedback_learner_week on public.feedback (learner_id, week);

-- ---------------------------------------------------------------------------
-- Feedback responses — what changed because of what they said
-- ---------------------------------------------------------------------------
-- "You said the drill was rushed — week 4 gives it twenty more minutes." Spec
-- §5.3 says that line IS the feature: without a visible loop, response rates
-- collapse by week 3 and the feedback form becomes theatre.
--
-- NOTE ON §7's CASCADE RULE. Every other learner table is keyed to learner_id
-- with ON DELETE CASCADE, because it holds one person's data. This one is not
-- keyed to anyone: it is Sunil's note to the room, one row per week, and it
-- holds no personal data to erase. Erasing a learner must not delete the note
-- the whole cohort can see.
--
-- It is teaching-adjacent, so §6 deserves an answer too: this lives in Postgres
-- rather than in src/content/ because it is per-cohort operational writing that
-- is thrown away between cohorts, not session material that is revised and
-- reviewed as a diff.
create table if not exists public.feedback_responses (
  id           uuid        primary key default gen_random_uuid(),
  week         int         not null check (week between 1 and 6),
  body         text        not null,
  -- Null while Sunil is drafting. Learners only ever read published rows.
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists feedback_response_week on public.feedback_responses (week);

-- ---------------------------------------------------------------------------
-- Lock everything down
-- ---------------------------------------------------------------------------
-- RLS enabled + zero policies = the anon and authenticated keys can do nothing.
-- The service-role key bypasses RLS by design and is the only way in.

alter table public.events    enable row level security;
alter table public.leads     enable row level security;
alter table public.questions enable row level security;
alter table public.learners  enable row level security;
alter table public.intake_responses enable row level security;
alter table public.familiarity_responses enable row level security;
alter table public.radar_findings enable row level security;
alter table public.radar_runs     enable row level security;
alter table public.submissions    enable row level security;
alter table public.quiz_responses enable row level security;
alter table public.session_prompts enable row level security;
alter table public.outcome_ratings enable row level security;
alter table public.checkpoint_ratings enable row level security;
alter table public.pair_drafts enable row level security;
alter table public.pair_reviews enable row level security;
alter table public.doubts         enable row level security;
alter table public.discussion_replies enable row level security;
alter table public.feedback       enable row level security;
alter table public.feedback_responses enable row level security;

revoke all on public.events    from anon, authenticated;
revoke all on public.leads     from anon, authenticated;
revoke all on public.questions from anon, authenticated;
revoke all on public.learners  from anon, authenticated;
revoke all on public.intake_responses from anon, authenticated;
revoke all on public.familiarity_responses from anon, authenticated;
revoke all on public.radar_findings from anon, authenticated;
revoke all on public.radar_runs     from anon, authenticated;
revoke all on public.submissions    from anon, authenticated;
revoke all on public.quiz_responses from anon, authenticated;
revoke all on public.session_prompts from anon, authenticated;
revoke all on public.outcome_ratings from anon, authenticated;
revoke all on public.checkpoint_ratings from anon, authenticated;
revoke all on public.pair_drafts from anon, authenticated;
revoke all on public.pair_reviews from anon, authenticated;
revoke all on public.doubts         from anon, authenticated;
revoke all on public.discussion_replies from anon, authenticated;
revoke all on public.feedback       from anon, authenticated;
revoke all on public.feedback_responses from anon, authenticated;

-- Keep updated_at honest so "last touched" in the console means something.
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

drop trigger if exists learners_touch on public.learners;
create trigger learners_touch before update on public.learners
  for each row execute function public.touch_updated_at();

drop trigger if exists intake_touch on public.intake_responses;
create trigger intake_touch before update on public.intake_responses
  for each row execute function public.touch_updated_at();

drop trigger if exists familiarity_touch on public.familiarity_responses;
create trigger familiarity_touch before update on public.familiarity_responses
  for each row execute function public.touch_updated_at();

drop trigger if exists radar_touch on public.radar_findings;
create trigger radar_touch before update on public.radar_findings
  for each row execute function public.touch_updated_at();

drop trigger if exists submissions_touch on public.submissions;
create trigger submissions_touch before update on public.submissions
  for each row execute function public.touch_updated_at();

drop trigger if exists feedback_touch on public.feedback;
create trigger feedback_touch before update on public.feedback
  for each row execute function public.touch_updated_at();

drop trigger if exists feedback_response_touch on public.feedback_responses;
create trigger feedback_response_touch before update on public.feedback_responses
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Rollups
-- ---------------------------------------------------------------------------
-- Aggregation happens in Postgres rather than by pulling rows into the function
-- and counting them in TypeScript. That version works fine for a month and then
-- silently truncates at whatever row cap you picked, showing a confidently
-- wrong number. These cannot.

create or replace function public.admin_traffic_daily(days int default 30)
returns table (day date, views bigint, visitors bigint)
language sql stable as $$
  select date_trunc('day', created_at)::date as day,
         count(*) filter (where type = 'pageview')                as views,
         count(distinct visitor) filter (where type = 'pageview') as visitors
  from public.events
  where created_at >= now() - make_interval(days => days)
  group by 1
  order by 1;
$$;

create or replace function public.admin_traffic_paths(days int default 30)
returns table (path text, views bigint, visitors bigint)
language sql stable as $$
  select e.path,
         count(*)                  as views,
         count(distinct e.visitor) as visitors
  from public.events e
  where e.type = 'pageview'
    and e.created_at >= now() - make_interval(days => days)
  group by 1
  order by 2 desc
  limit 50;
$$;

create or replace function public.admin_traffic_breakdown(days int default 30, dim text default 'referrer_host')
returns table (label text, views bigint)
language sql stable as $$
  select coalesce(
           case dim
             when 'country' then e.country
             when 'device'  then e.device
             when 'region'  then e.region
             else e.referrer_host
           end,
           'direct / unknown') as label,
         count(*)              as views
  from public.events e
  where e.type = 'pageview'
    and e.created_at >= now() - make_interval(days => days)
  group by 1
  order by 2 desc
  limit 25;
$$;

-- The funnel this practice cares about: land -> engage -> hand over contact.
create or replace function public.admin_funnel(days int default 30)
returns table (type text, events bigint, visitors bigint)
language sql stable as $$
  select e.type,
         count(*)                  as events,
         count(distinct e.visitor) as visitors
  from public.events e
  where e.created_at >= now() - make_interval(days => days)
  group by 1
  order by 2 desc;
$$;

-- ---------------------------------------------------------------------------
-- Retention
-- ---------------------------------------------------------------------------
-- This practice sells regulated-industry AI governance. Holding visitor data
-- indefinitely, with no stated period and no mechanism to enforce one, is not a
-- position it can defend — least of all to the kind of buyer who asks.
--
-- What is and is not covered, and why:
--
--   events     PURGED. Analytics. `visitor` is already a hash that rotates
--              daily, so an old row is barely personal to begin with; past a
--              couple of quarters it is not answering any question either.
--   questions  PURGED, on a longer window. These carry text a visitor typed,
--              which can name them or their employer even though we never
--              asked. They are the highest-signal thing here, hence a year
--              rather than 180 days — but not forever.
--
--   leads      NOT purged. A lead is a commercial record with an inbox copy
--              beside it, and quietly deleting one after N days would mean
--              losing a real enquiry to a cron job. Erasure is per-person and
--              deliberate: the Erase button on /admin/leads.
--   learners   NOT purged, same reasoning, plus the schema keeps withdrawn
--              seats on purpose. Erasing a learner cascades to their intake.
--
-- Defaults are arguments, not constants, so the window can be shortened without
-- a migration.

create or replace function public.admin_purge(event_days int default 180, question_days int default 365)
returns table (events_deleted bigint, questions_deleted bigint)
language plpgsql as $$
declare
  ev bigint;
  qs bigint;
begin
  -- Guard rails. A caller that passes 0 — through a bug, an empty form field
  -- coerced to a number, or a mistyped API call — would otherwise delete the
  -- entire table, and that is a data-loss bug wearing a retention policy's
  -- clothes. Refuse rather than clamp: silently doing something other than what
  -- was asked is how you end up trusting a number that was never applied.
  if event_days < 30 or question_days < 30 then
    raise exception 'Retention windows below 30 days are refused (got events=%, questions=%)',
      event_days, question_days;
  end if;

  with gone as (
    delete from public.events
    where created_at < now() - make_interval(days => event_days)
    returning 1
  )
  select count(*) into ev from gone;

  with gone as (
    delete from public.questions
    where created_at < now() - make_interval(days => question_days)
    returning 1
  )
  select count(*) into qs from gone;

  return query select ev, qs;
end;
$$;

-- Counts what a purge WOULD remove, without removing it. The console shows this
-- beside the button, because "delete 12,000 rows" and "delete 3" deserve
-- different amounts of hesitation.
create or replace function public.admin_purge_preview(event_days int default 180, question_days int default 365)
returns table (events_stale bigint, questions_stale bigint)
language sql stable as $$
  select
    (select count(*) from public.events
      where created_at < now() - make_interval(days => event_days)),
    (select count(*) from public.questions
      where created_at < now() - make_interval(days => question_days));
$$;

-- Running it on a schedule, once you are happy with the windows. Left commented
-- because pg_cron needs enabling per project (Database -> Extensions) and an
-- unattended DELETE should be a decision someone made on purpose, not a line
-- that arrived with the schema:
--
--   create extension if not exists pg_cron;
--   select cron.schedule('purge', '0 3 * * 0', $cron$ select public.admin_purge(); $cron$);
--
-- Until then it is the button on /admin — which means the policy is only real
-- if someone presses it.

-- ===========================================================================
-- THE COHORT PIPELINE
-- ===========================================================================
-- Everything below this line belongs to the cohort rebuild
-- (docs/cohort-pipeline/build-plan.md, from the handoff package dated
-- 10 September 2026). Nothing above it changes.
--
-- WHY A SECOND FAMILY OF TABLES rather than more columns on `leads`. `leads` is
-- a LEDGER: one flat row per submission, written fire-and-forget beside the
-- Web3Forms inbox, and it stays exactly that. This is a PIPELINE: the same
-- person appears twice, an enquiry becomes an application without either record
-- being lost, and an organisation order is not eight individual applications.
-- Those are relationships, and the brief's whole data dictionary is about not
-- collapsing them. Flattening them into `leads` is how "count one applicant for
-- that cohort" quietly becomes "count every time they pressed the button".
--
-- NAMING. `public.submissions` was already taken -- it is the learners' decision
-- records under /craft -- so a public form submission is `form_submissions`.
-- Two different things with one name is worse than one slightly long name.
--
-- THE ERASURE RULE, restated for these tables. A DPDP deletion request is
-- answered by deleting a person's rows, so `people` cascades to their
-- submissions, attributions, opportunities, activities, tasks and consents.
-- `audit_log` is the deliberate exception: it must survive, which is precisely
-- why it never holds a name, an address, a phone number or a free-text answer.
-- Record ids are the join. If you ever find yourself copying an answer into an
-- audit row, you are moving personal data outside the cascade.

-- ---------------------------------------------------------------------------
-- Organisations
-- ---------------------------------------------------------------------------
-- The data dictionary is unusually firm here: "Name-only matches are review
-- candidates, not automatic merges." So this table does NOT deduplicate by
-- name. Two people typing "Acme" produce two rows, the second flagged for
-- review, and a human decides whether they are the same company. The failure
-- that prevents is silent and expensive: merging two unrelated Acmes joins two
-- companies' contacts, notes and eventually their commercial terms, and there
-- is no undo for that once an operator has worked against the merged view.
--
-- `domain` is nullable and stays null unless someone supplies it. It is NOT
-- derived from the email address: personal addresses are accepted on every
-- form by design, and deriving a domain from gmail.com would file half the
-- pipeline under one imaginary organisation.

create table if not exists public.organisations (
  organisation_id uuid        primary key default gen_random_uuid(),
  name            text        not null,
  domain          text,
  industry        text,
  -- Set when this row was created despite an existing row with the same name.
  -- The console's job is to offer the merge; the pipeline's job is to refuse to
  -- make it on its own.
  needs_review    boolean     not null default false,
  review_reason   text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists organisations_name_idx on public.organisations (lower(name));
create index if not exists organisations_review_idx on public.organisations (needs_review, created_at desc);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
-- Matching is trimmed, case-normalised email and NOTHING ELSE. Two rules the
-- dictionary names as mistakes, both enforced by that one choice:
--
--   * Plus-tags are not stripped. a+cohort@x.com and a@x.com are two addresses
--     and only their owner knows whether they are one person.
--   * Different addresses are never merged by name. There is more than one
--     Priya Sharma.
--
-- `original_email` keeps whatever they typed, so a receipt goes to the address
-- they gave rather than to one we tidied on their behalf. It is set once, by
-- the first submission; a later submission does not rewrite it, because a
-- second form post is not evidence that the first one was wrong.

create table if not exists public.people (
  person_id        uuid        primary key default gen_random_uuid(),
  name             text        not null,
  normalised_email text        not null unique,
  original_email   text        not null,
  phone            text,
  role             text,
  organisation_id  uuid        references public.organisations(organisation_id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists people_created_idx on public.people (created_at desc);
create index if not exists people_org_idx on public.people (organisation_id);
create index if not exists people_name_idx on public.people (lower(name));

-- ---------------------------------------------------------------------------
-- Cohorts
-- ---------------------------------------------------------------------------
-- The cohort a submission belongs to is resolved HERE, server-side, and never
-- read from a hidden input -- the brief: "The cohort ID is assigned from the
-- server's active configuration, not accepted blindly from a hidden input."
-- A hidden field is a value the visitor's browser can edit, and a form that
-- files applications against a cohort of the sender's choosing is a data
-- integrity problem that shows up months later as a roster nobody can explain.
--
-- `application_open` is the truthful closure switch (acceptance case E18):
-- when it is false the application route refuses with honest wording and the
-- enquiry route stays available. `schedule_reference` is free text pointing at
-- the approved schedule; no date is ever inferred from an internal id.

create table if not exists public.cohorts (
  cohort_id          uuid        primary key default gen_random_uuid(),
  public_label       text        not null,
  route              text        not null default 'member' check (route in ('member', 'enterprise')),
  application_open   boolean     not null default true,
  schedule_reference text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Seed exactly one cohort, and only into an empty table, so re-running this
-- file never adds a second. The label is a neutral placeholder and the schedule
-- is null ON PURPOSE: the programme's public label, dates and fee are Sunil's
-- to set, and a schema file inventing them would put a claim about the offer
-- somewhere facts.ts cannot see it.
insert into public.cohorts (public_label, route, application_open)
select 'Open cohort', 'member', true
where not exists (select 1 from public.cohorts);

-- ---------------------------------------------------------------------------
-- Form submissions -- what somebody actually sent
-- ---------------------------------------------------------------------------
-- The immutable evidence record. One row per accepted submission, kept even
-- when the same person submits again, because "a repeated application updates
-- the review context and keeps submission history".
--
-- `request_key` IS THE IDEMPOTENCY STORY and the unique index is the whole
-- mechanism. The browser mints one key per form instance and sends the same key
-- on every retry, so a double click, a refresh and a flaky network all resolve
-- to one row and one reference (E02). Nothing else in this design prevents a
-- duplicate application, and nothing else needs to.
--
-- `type` carries three values, not the dictionary's two. An enterprise enquiry
-- is an enquiry in the dictionary's sense, but the brief also says it "is never
-- counted as an application" AND that an organisation order is a different
-- counting unit -- folding it into 'enquiry' loses the only field that says
-- which. The member/enterprise split lives on `opportunities.route`; this
-- column says which form was filled in.
--
-- `answers` is the validated field values from forms.ts, verbatim. Storing them
-- as jsonb rather than as columns is deliberate: the questions belong to the
-- form definition, which is copy and will be edited, and a copy edit must not
-- be a migration. The console reads the labels back out of forms.ts.
--
-- `submitted_at` is the EVIDENCE date and `created_at` the entry date. They are
-- the same instant today and the brief still asks for both, because an imported
-- historical submission has a real submitted_at and a today created_at, and one
-- report wants each.
--
-- `is_test` and `is_spam` exist because the metric definition for applications
-- saved says "excluding retries and flagged tests/spam". A flagged row is still
-- a row: a honeypot that misfires on somebody's password manager must not throw
-- a real person's application away, it must file it where an operator finds it.

create table if not exists public.form_submissions (
  submission_id          uuid        primary key default gen_random_uuid(),
  request_key            text        not null unique,
  reference              text        not null unique,
  type                   text        not null check (type in ('application', 'enquiry', 'enterprise')),
  person_id              uuid        not null references public.people(person_id) on delete cascade,
  organisation_id        uuid        references public.organisations(organisation_id) on delete set null,
  cohort_id              uuid        references public.cohorts(cohort_id) on delete set null,
  -- Filled in immediately after the opportunity is resolved. The brief says
  -- applications and enquiries link to that record; deriving the link later
  -- from person + cohort would be a second definition of it, and the two would
  -- disagree the first time an operator moved something by hand.
  opportunity_id         uuid,
  answers                jsonb       not null default '{}'::jsonb,
  funding_route          text        check (funding_route in ('self', 'employer', 'undecided')),
  group_size             int         check (group_size is null or group_size between 1 and 100000),
  submitted_at           timestamptz not null default now(),
  -- Null until the owner supplies the data-controller facts and a privacy
  -- notice is published. A made-up version string here would be a record
  -- claiming somebody was shown a notice that does not exist.
  privacy_notice_version text,
  is_test                boolean     not null default false,
  is_spam                boolean     not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists form_submissions_submitted_idx on public.form_submissions (submitted_at desc);
create index if not exists form_submissions_type_idx on public.form_submissions (type, submitted_at desc);
create index if not exists form_submissions_person_idx on public.form_submissions (person_id, submitted_at desc);
create index if not exists form_submissions_cohort_idx on public.form_submissions (cohort_id, type, submitted_at desc);
create index if not exists form_submissions_opportunity_idx on public.form_submissions (opportunity_id);

-- ---------------------------------------------------------------------------
-- Opportunities -- the conversation, not the form
-- ---------------------------------------------------------------------------
-- One per person per cohort for the member route, one per person for the
-- enterprise route, REUSED rather than duplicated. That reuse is what makes
-- "an enquiry can later produce an application without losing either record"
-- true: both submissions hang off one opportunity, the stage moves forward
-- once, and the applicant is counted once (E05).
--
-- The partial unique indexes below enforce it in the database rather than only
-- inside pipeline_submit(), because two requests arriving at the same instant
-- is exactly the case a function-level check loses.
--
-- STAGES are the brief's, verbatim, in two families:
--   member     enquiry, application_received, qualification, technical_review,
--              offer, enrolled
--   enterprise enquiry, qualification, technical_scoping, quote, order_agreed,
--              delivery_coordination, closed
--   side       on_hold, unsuitable, withdrawn, closed
--
-- `owner` is null until a named staff account owns it, and null here means
-- exactly "unassigned" -- the Overview screen's unassigned-leads count reads
-- it. It is deliberately not defaulted to a person nobody agreed to.

create table if not exists public.opportunities (
  opportunity_id   uuid        primary key default gen_random_uuid(),
  person_id        uuid        references public.people(person_id) on delete cascade,
  organisation_id  uuid        references public.organisations(organisation_id) on delete set null,
  route            text        not null check (route in ('member', 'enterprise')),
  cohort_id        uuid        references public.cohorts(cohort_id) on delete set null,
  stage            text        not null check (stage in (
                     'enquiry', 'application_received', 'qualification', 'technical_review',
                     'offer', 'enrolled',
                     'technical_scoping', 'quote', 'order_agreed', 'delivery_coordination',
                     'on_hold', 'unsuitable', 'withdrawn', 'closed')),
  owner            text,
  stage_entered_at timestamptz not null default now(),
  -- Required by the brief when closing or reversing a stage. Nothing in this
  -- file enforces that; the console will, because only the console knows who
  -- asked for the change.
  closure_reason   text,
  next_action      text,
  due_at           timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Open = not one of the three terminal side states. on_hold IS open: a paused
-- conversation is still that person's conversation, and a second submission
-- while they are on hold belongs to it.
create unique index if not exists opportunities_open_member
  on public.opportunities (person_id, coalesce(cohort_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where route = 'member' and stage not in ('unsuitable', 'withdrawn', 'closed');

-- Enterprise is keyed to the PERSON, not the organisation, for the same reason
-- organisations are not merged by name: two sponsors from one company are two
-- conversations until a human says otherwise.
create unique index if not exists opportunities_open_enterprise
  on public.opportunities (person_id)
  where route = 'enterprise' and stage not in ('unsuitable', 'withdrawn', 'closed');

create index if not exists opportunities_stage_idx on public.opportunities (stage, updated_at desc);
create index if not exists opportunities_owner_idx on public.opportunities (owner, due_at);
create index if not exists opportunities_person_idx on public.opportunities (person_id);
create index if not exists opportunities_org_idx on public.opportunities (organisation_id);
create index if not exists opportunities_created_idx on public.opportunities (created_at desc);

-- ---------------------------------------------------------------------------
-- Attributions -- where they came from, kept in two halves
-- ---------------------------------------------------------------------------
-- One row per submission, and the two halves are never reconciled into one
-- number. `first_*` is the first touch we were permitted to remember;
-- `session_*` is the visit that submitted the form. They answer different
-- questions and the operating guide says to show both with their definitions
-- rather than picking a winner.
--
-- `self_reported` is the discovery answer. It is a THIRD piece of evidence and
-- never an override: somebody can meet Sunil on LinkedIn in March and type the
-- URL directly in September, and both facts are true.
--
-- MISSING STAYS MISSING. Absent UTM values are null. An absent referrer is
-- direct/unknown and is never reconstructed by fingerprinting or by inference.
-- `tracking_permission` records whether we were allowed to remember the first
-- touch at all; with no consent surface built yet it is false on every row, and
-- `first_*` is therefore null on every row. That is the honest state, not a
-- gap to fill in (E07).

create table if not exists public.attributions (
  submission_id       uuid        primary key references public.form_submissions(submission_id) on delete cascade,
  first_source        text,
  first_medium        text,
  first_campaign      text,
  first_content       text,
  first_term          text,
  session_source      text,
  session_medium      text,
  session_campaign    text,
  session_content     text,
  session_term        text,
  entry_path          text,
  -- Bare host, never a full URL: a referrer's query string can carry the
  -- linking site's own session token or somebody's search terms.
  referrer_host       text,
  self_reported       text,
  tracking_permission boolean     not null default false,
  first_captured_at   timestamptz,
  session_captured_at timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index if not exists attributions_session_source_idx on public.attributions (session_source, session_captured_at desc);
create index if not exists attributions_first_source_idx on public.attributions (first_source);

-- ---------------------------------------------------------------------------
-- Consents -- append-only, and enforced
-- ---------------------------------------------------------------------------
-- A consent record has to be able to say what the person actually saw, which
-- means the wording and its version are copied into the row rather than
-- referenced. If the marketing sentence is reworded, that is a NEW version and
-- new rows; the old rows keep the old words, because the alternative is a
-- record that quietly claims somebody agreed to a sentence written after they
-- ticked the box.
--
-- A withdrawal is a NEW ROW with state='withdrawn', never an UPDATE of the row
-- that granted it. The trigger below makes that structural instead of a matter
-- of discipline: preserving the change is the dictionary's requirement, and an
-- UPDATE destroys the evidence that permission was ever given. DELETE is left
-- alone so erasure still works.

create table if not exists public.consents (
  consent_id      uuid        primary key default gen_random_uuid(),
  person_id       uuid        not null references public.people(person_id) on delete cascade,
  purpose         text        not null default 'marketing',
  state           text        not null check (state in ('granted', 'withdrawn')),
  wording         text        not null,
  wording_version text        not null,
  obtained_at     timestamptz not null default now(),
  -- Where it came from: which form, an import, an unsubscribe link, an operator.
  source          text,
  withdrawn_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists consents_person_idx on public.consents (person_id, obtained_at desc);
create index if not exists consents_purpose_idx on public.consents (purpose, state, obtained_at desc);

create or replace function public.consents_are_append_only() returns trigger
language plpgsql as $$
begin
  raise exception 'consents is append-only: record a withdrawal as a new row rather than editing the row that granted permission';
end;
$$;

drop trigger if exists consents_no_update on public.consents;
create trigger consents_no_update before update on public.consents
  for each row execute function public.consents_are_append_only();

-- ---------------------------------------------------------------------------
-- Activities and tasks
-- ---------------------------------------------------------------------------
-- An activity is something that happened; a task is something somebody owes.
-- They are separate tables because "record manual contact here before further
-- nurture" needs a chronological log nobody closes, and an overdue-work list
-- needs rows that get completed.
--
-- `due_at` is nullable and is null by default. The proposed one-business-day
-- acknowledgement and two-day technical response are explicitly "subject to
-- capacity agreement" and must not be published as guarantees -- so until
-- somebody agrees a number, a task carries no due date rather than a made-up
-- one, and the overdue count stays honest.

create table if not exists public.activities (
  activity_id    uuid        primary key default gen_random_uuid(),
  opportunity_id uuid        not null references public.opportunities(opportunity_id) on delete cascade,
  type           text        not null,
  actor          text,
  occurred_at    timestamptz not null default now(),
  notes          text,
  created_at     timestamptz not null default now()
);

create index if not exists activities_opportunity_idx on public.activities (opportunity_id, occurred_at desc);
create index if not exists activities_occurred_idx on public.activities (occurred_at desc);

create table if not exists public.tasks (
  task_id        uuid        primary key default gen_random_uuid(),
  opportunity_id uuid        not null references public.opportunities(opportunity_id) on delete cascade,
  owner          text,
  description    text        not null,
  due_at         timestamptz,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists tasks_open_idx on public.tasks (owner, due_at) where completed_at is null;
create index if not exists tasks_opportunity_idx on public.tasks (opportunity_id, created_at desc);
create index if not exists tasks_unassigned_idx on public.tasks (created_at desc) where completed_at is null and owner is null;

-- ---------------------------------------------------------------------------
-- Audit log -- restricted, and deliberately boring
-- ---------------------------------------------------------------------------
-- Who changed what, when, and why. It is the one table here that does NOT
-- cascade when a person is erased, because the record that a stage was reversed
-- has to outlive the conversation it was about.
--
-- That survival is exactly why NOTHING PERSONAL GOES IN IT. No name, no
-- address, no phone number, no free-text answer, and never a credential or a
-- token. Record ids are the join; when the person is erased the ids dangle,
-- which is the correct outcome -- the history says a decision was made and no
-- longer says about whom.

create table if not exists public.audit_log (
  audit_id       uuid        primary key default gen_random_uuid(),
  record_type    text        not null,
  record_id      uuid,
  actor          text        not null,
  previous_value jsonb,
  new_value      jsonb,
  occurred_at    timestamptz not null default now(),
  reason         text
);

create index if not exists audit_log_record_idx on public.audit_log (record_type, record_id, occurred_at desc);
create index if not exists audit_log_occurred_idx on public.audit_log (occurred_at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor, occurred_at desc);

-- ---------------------------------------------------------------------------
-- Lock the pipeline down, same rule as everything above
-- ---------------------------------------------------------------------------

alter table public.organisations    enable row level security;
alter table public.people           enable row level security;
alter table public.cohorts          enable row level security;
alter table public.form_submissions enable row level security;
alter table public.opportunities    enable row level security;
alter table public.attributions     enable row level security;
alter table public.consents         enable row level security;
alter table public.activities       enable row level security;
alter table public.tasks            enable row level security;
alter table public.audit_log        enable row level security;

revoke all on public.organisations    from anon, authenticated;
revoke all on public.people           from anon, authenticated;
revoke all on public.cohorts          from anon, authenticated;
revoke all on public.form_submissions from anon, authenticated;
revoke all on public.opportunities    from anon, authenticated;
revoke all on public.attributions     from anon, authenticated;
revoke all on public.consents         from anon, authenticated;
revoke all on public.activities       from anon, authenticated;
revoke all on public.tasks            from anon, authenticated;
revoke all on public.audit_log        from anon, authenticated;

drop trigger if exists organisations_touch on public.organisations;
create trigger organisations_touch before update on public.organisations
  for each row execute function public.touch_updated_at();

drop trigger if exists people_touch on public.people;
create trigger people_touch before update on public.people
  for each row execute function public.touch_updated_at();

drop trigger if exists cohorts_touch on public.cohorts;
create trigger cohorts_touch before update on public.cohorts
  for each row execute function public.touch_updated_at();

drop trigger if exists form_submissions_touch on public.form_submissions;
create trigger form_submissions_touch before update on public.form_submissions
  for each row execute function public.touch_updated_at();

drop trigger if exists opportunities_touch on public.opportunities;
create trigger opportunities_touch before update on public.opportunities
  for each row execute function public.touch_updated_at();

drop trigger if exists tasks_touch on public.tasks;
create trigger tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- pipeline_submit() -- the whole save, in one transaction
-- ---------------------------------------------------------------------------
-- The brief asks for this in one sentence and it is the hardest sentence in the
-- document: "validate, resolve the contact, create the enquiry/application and
-- initial task, and queue acknowledgement/owner notification in one reliable
-- transaction or equivalent durable workflow. Return success only after the
-- record is committed."
--
-- WHY IT IS SQL AND NOT TYPESCRIPT. supabase-js speaks PostgREST, and PostgREST
-- gives one statement per request. Eight inserts from the Vercel function is
-- eight transactions: a timeout after the fourth leaves a person with no
-- opportunity, an opportunity with no task, or a submission whose attribution
-- never landed -- and the caller cannot tell which. That is the "false success"
-- E03 forbids, arriving through the back door. A plpgsql function is one
-- statement to PostgREST and one transaction to Postgres: it all lands or none
-- of it does, and only then does the API say the word "received".
--
-- WHAT IT DELIBERATELY DOES NOT DO: send anything. Queuing the acknowledgement
-- is stage 4 and is switched off until there is a verified sender (decision D2).
-- The task row is the durable "somebody owes this person a reply" in the
-- meantime, and Web3Forms still delivers the inbox copy from the browser.
--
-- IDEMPOTENCY, which is the single most important behaviour here (E02): the
-- first thing the function does is look for the request key, and a hit returns
-- the reference that was already issued with already_existed = true. No second
-- record, no second acknowledgement, no second applicant in the count. The
-- unique index does the same job again underneath, for the case where two
-- copies of the request are in flight at once and neither has committed yet.
--
-- THE REFERENCE IS GENERATED IN TYPESCRIPT and passed in. src/lib/pipeline/
-- reference.ts owns the alphabet and the shape; a second implementation here
-- would be the two-owners-of-one-format mistake CLAUDE.md keeps a whole section
-- about. On the (vanishingly rare) collision this raises pipeline_reference_taken
-- before writing anything and the caller retries with a fresh candidate.

create or replace function public.pipeline_submit(
  p_request_key            text,
  p_reference              text,
  p_type                   text,
  p_cohort_id              uuid,
  p_name                   text,
  p_normalised_email       text,
  p_original_email         text,
  p_phone                  text        default null,
  p_role                   text        default null,
  p_organisation_name      text        default null,
  p_industry               text        default null,
  p_answers                jsonb       default '{}'::jsonb,
  p_funding_route          text        default null,
  p_group_size             int         default null,
  p_privacy_notice_version text        default null,
  p_owner                  text        default null,
  p_task_due_at            timestamptz default null,
  p_attribution            jsonb       default '{}'::jsonb,
  p_consent                jsonb       default null,
  p_is_test                boolean     default false,
  p_is_spam                boolean     default false,
  p_actor                  text        default 'public_form'
)
returns table (
  submission_id   uuid,
  reference       text,
  already_existed boolean,
  person_id       uuid,
  opportunity_id  uuid
)
language plpgsql
as $fn$
-- Every bare identifier below that also names a column resolves to the column.
-- The five OUT parameters share their names with real columns, which is exactly
-- the ambiguity this setting decides; locals are v_-prefixed so they never
-- collide either way.
#variable_conflict use_column
declare
  v_submission_id uuid;
  v_reference     text;
  v_person_id     uuid;
  v_org_id        uuid;
  v_opp_id        uuid;
  v_route         text;
  v_stage         text;
  v_target_stage  text;
  v_org_name      text    := nullif(btrim(p_organisation_name), '');
  v_dupes         int     := 0;
  v_advanced      boolean := false;
begin
  if p_type not in ('application', 'enquiry', 'enterprise') then
    raise exception 'pipeline_submit: unknown submission type';
  end if;

  -- 1 -- The request key. Everything else is downstream of this answer. -------
  select s.submission_id, s.reference, s.person_id, s.opportunity_id
    into v_submission_id, v_reference, v_person_id, v_opp_id
    from public.form_submissions s
   where s.request_key = p_request_key;

  if v_submission_id is not null then
    return query select v_submission_id, v_reference, true, v_person_id, v_opp_id;
    return;
  end if;

  -- Checked before any write, so a collision costs nothing and the caller can
  -- simply try again with another candidate.
  if exists (select 1 from public.form_submissions s where s.reference = p_reference) then
    raise exception 'pipeline_reference_taken';
  end if;

  -- 2 -- Organisation. Creates rather than merges; see the table comment. -----
  if v_org_name is not null then
    -- One exception to no-merging, and it is not a merge: the same person
    -- naming the same organisation a second time is one record restated, not
    -- two records that happen to share a name.
    select p.organisation_id
      into v_org_id
      from public.people p
      join public.organisations o on o.organisation_id = p.organisation_id
     where p.normalised_email = p_normalised_email
       and lower(o.name) = lower(v_org_name);

    if v_org_id is null then
      select count(*) into v_dupes
        from public.organisations o
       where lower(o.name) = lower(v_org_name);

      insert into public.organisations (name, industry, needs_review, review_reason)
      values (
        v_org_name,
        nullif(btrim(p_industry), ''),
        v_dupes > 0,
        case when v_dupes > 0 then
          format('Name-only match with %s existing organisation record(s). Merging is an operator decision.', v_dupes)
        end
      )
      returning organisations.organisation_id into v_org_id;
    end if;
  end if;

  -- 3 -- Person, by normalised email and nothing else. -----------------------
  insert into public.people (name, normalised_email, original_email, phone, role, organisation_id)
  values (
    p_name,
    p_normalised_email,
    p_original_email,
    nullif(btrim(p_phone), ''),
    nullif(btrim(p_role), ''),
    v_org_id
  )
  on conflict (normalised_email) do nothing
  returning people.person_id into v_person_id;

  if v_person_id is null then
    -- Already known. Fill blanks, overwrite nothing. A second submission is not
    -- evidence that the first was wrong, and an operator correction must not be
    -- undone by the next form post (E05). Their new answers are all preserved
    -- on the submission itself, where the history belongs.
    update public.people p
       set phone           = coalesce(p.phone, nullif(btrim(p_phone), '')),
           role            = coalesce(p.role, nullif(btrim(p_role), '')),
           organisation_id = coalesce(p.organisation_id, v_org_id)
     where p.normalised_email = p_normalised_email
    returning p.person_id into v_person_id;
  end if;

  -- 4 -- The submission. Claims the request key before any further work. ------
  begin
    insert into public.form_submissions (
      request_key, reference, type, person_id, organisation_id, cohort_id,
      answers, funding_route, group_size, privacy_notice_version, is_test, is_spam
    ) values (
      p_request_key,
      p_reference,
      p_type,
      v_person_id,
      v_org_id,
      p_cohort_id,
      coalesce(p_answers, '{}'::jsonb),
      nullif(p_funding_route, ''),
      p_group_size,
      nullif(p_privacy_notice_version, ''),
      coalesce(p_is_test, false),
      coalesce(p_is_spam, false)
    )
    returning form_submissions.submission_id into v_submission_id;
  exception when unique_violation then
    -- Two copies of one request in flight. The other one won; return its
    -- reference rather than a second record.
    select s.submission_id, s.reference, s.person_id, s.opportunity_id
      into v_submission_id, v_reference, v_person_id, v_opp_id
      from public.form_submissions s
     where s.request_key = p_request_key;

    if v_submission_id is null then raise; end if;

    return query select v_submission_id, v_reference, true, v_person_id, v_opp_id;
    return;
  end;

  -- 5 -- The opportunity. Reused when one is already open. -------------------
  v_route        := case when p_type = 'enterprise' then 'enterprise' else 'member' end;
  v_target_stage := case when p_type = 'application' then 'application_received' else 'enquiry' end;

  if v_route = 'member' then
    select o.opportunity_id, o.stage
      into v_opp_id, v_stage
      from public.opportunities o
     where o.route = 'member'
       and o.person_id = v_person_id
       and o.cohort_id is not distinct from p_cohort_id
       and o.stage not in ('unsuitable', 'withdrawn', 'closed')
     order by o.created_at
     limit 1
       for update;
  else
    select o.opportunity_id, o.stage
      into v_opp_id, v_stage
      from public.opportunities o
     where o.route = 'enterprise'
       and o.person_id = v_person_id
       and o.stage not in ('unsuitable', 'withdrawn', 'closed')
     order by o.created_at
     limit 1
       for update;
  end if;

  if v_opp_id is null then
    begin
      insert into public.opportunities (
        person_id, organisation_id, route, cohort_id, stage, owner, stage_entered_at
      ) values (
        v_person_id,
        v_org_id,
        v_route,
        case when v_route = 'member' then p_cohort_id else null end,
        v_target_stage,
        nullif(p_owner, ''),
        now()
      )
      returning opportunities.opportunity_id into v_opp_id;
      v_stage := v_target_stage;
    exception when unique_violation then
      -- The partial index caught a concurrent create. Take theirs.
      select o.opportunity_id, o.stage
        into v_opp_id, v_stage
        from public.opportunities o
       where o.person_id = v_person_id
         and o.route = v_route
         and o.stage not in ('unsuitable', 'withdrawn', 'closed')
       order by o.created_at
       limit 1;
      if v_opp_id is null then raise; end if;
    end;

  elsif v_stage = 'enquiry' and v_target_stage = 'application_received' then
    -- The one automatic stage move in the whole pipeline, and it only ever runs
    -- forward from the first stage. A repeat application from somebody already
    -- at qualification or technical review is review context, not a demotion --
    -- dragging them backwards would rewrite work an operator had done.
    update public.opportunities o
       set stage = 'application_received',
           stage_entered_at = now()
     where o.opportunity_id = v_opp_id;

    v_advanced := true;
    v_stage    := 'application_received';
  end if;

  update public.form_submissions s
     set opportunity_id = v_opp_id
   where s.submission_id = v_submission_id;

  -- 6 -- The log line and the work it creates. -------------------------------
  insert into public.activities (opportunity_id, type, actor, notes)
  values (
    v_opp_id,
    case p_type
      when 'application' then 'application_received'
      when 'enterprise'  then 'enterprise_enquiry_received'
      else 'enquiry_received'
    end,
    p_actor,
    format('Submission %s.', p_reference)
  );

  if v_advanced then
    insert into public.activities (opportunity_id, type, actor, notes)
    values (v_opp_id, 'stage_changed', p_actor,
            'Enquiry became an application for the same cohort.');

    insert into public.audit_log (record_type, record_id, actor, previous_value, new_value, reason)
    values (
      'opportunity', v_opp_id, p_actor,
      jsonb_build_object('stage', 'enquiry'),
      jsonb_build_object('stage', 'application_received'),
      'Application received from a person whose enquiry was already open.'
    );
  end if;

  -- The wording is the operating guide's own description of the first job.
  insert into public.tasks (opportunity_id, owner, description, due_at)
  values (
    v_opp_id,
    nullif(p_owner, ''),
    case p_type
      when 'application' then 'Read the experience and learning goal, clarify readiness and funding route, then respond.'
      when 'enterprise'  then 'Qualify the team enquiry, then coordinate technical scoping with Sunil.'
      else 'Answer the question and record the reply.'
    end,
    p_task_due_at
  );

  -- 7 -- Attribution, and consent only if it was actually given. -------------
  insert into public.attributions (
    submission_id,
    first_source, first_medium, first_campaign, first_content, first_term,
    session_source, session_medium, session_campaign, session_content, session_term,
    entry_path, referrer_host, self_reported, tracking_permission,
    first_captured_at, session_captured_at
  ) values (
    v_submission_id,
    nullif(p_attribution ->> 'first_source', ''),
    nullif(p_attribution ->> 'first_medium', ''),
    nullif(p_attribution ->> 'first_campaign', ''),
    nullif(p_attribution ->> 'first_content', ''),
    nullif(p_attribution ->> 'first_term', ''),
    nullif(p_attribution ->> 'session_source', ''),
    nullif(p_attribution ->> 'session_medium', ''),
    nullif(p_attribution ->> 'session_campaign', ''),
    nullif(p_attribution ->> 'session_content', ''),
    nullif(p_attribution ->> 'session_term', ''),
    nullif(p_attribution ->> 'entry_path', ''),
    nullif(p_attribution ->> 'referrer_host', ''),
    nullif(p_attribution ->> 'self_reported', ''),
    coalesce((p_attribution ->> 'tracking_permission')::boolean, false),
    nullif(p_attribution ->> 'first_captured_at', '')::timestamptz,
    coalesce(nullif(p_attribution ->> 'session_captured_at', '')::timestamptz, now())
  )
  on conflict (submission_id) do nothing;

  -- A receipt is not marketing consent, so nothing here is inferred from the
  -- submission itself. A row exists only when the box was ticked, and it copies
  -- the words that were on screen beside it.
  if p_consent is not null and coalesce((p_consent ->> 'granted')::boolean, false) then
    insert into public.consents (person_id, purpose, state, wording, wording_version, source)
    values (
      v_person_id,
      coalesce(nullif(p_consent ->> 'purpose', ''), 'marketing'),
      'granted',
      p_consent ->> 'wording',
      p_consent ->> 'wording_version',
      coalesce(nullif(p_consent ->> 'source', ''), p_type)
    );
  end if;

  -- 8 -- Audit. Ids and decisions only; re-read the table comment before -----
  --      adding a field here.
  insert into public.audit_log (record_type, record_id, actor, previous_value, new_value, reason)
  values (
    'form_submission', v_submission_id, p_actor, null,
    jsonb_build_object(
      'type',           p_type,
      'route',          v_route,
      'reference',      p_reference,
      'cohort_id',      p_cohort_id,
      'opportunity_id', v_opp_id,
      'stage',          v_stage,
      'is_test',        coalesce(p_is_test, false),
      'is_spam',        coalesce(p_is_spam, false)
    ),
    'Public form submission committed.'
  );

  return query select v_submission_id, p_reference, false, v_person_id, v_opp_id;
end;
$fn$;

-- This one WRITES, so it does not get the default public execute grant. Both
-- browser-facing keys are already powerless against these tables (RLS on, zero
-- policies), and this closes the second door as well: the function runs as its
-- caller, so anon calling it would fail on the first insert -- but a write path
-- reachable by an unauthenticated key is not a thing to leave lying around on
-- the strength of a second mechanism.
revoke all on function public.pipeline_submit from public;
grant execute on function public.pipeline_submit to service_role;

-- ===========================================================================
-- Staff -- named accounts, because a shared password cannot express a role
-- ===========================================================================
-- The console has one password, and everyone holding it is the same person as
-- far as the server is concerned. That was right while the console showed
-- traffic and a lead ledger. It stops being right the moment the brief says an
-- Alchemy operator "cannot approve technical fit/offers or confirm finance
-- evidence" and that finance confirmation is "reserved for finance".
--
-- Those are not preferences about who clicks what. They are the reason an
-- enrolment means something: a seat is confirmed only when two people who
-- cannot act for each other have each recorded their own fact. One account
-- holding both powers turns that into one person's opinion.
--
-- The matrix itself lives in src/lib/pipeline/roles.ts, not here. Postgres
-- stores WHO somebody is; the application decides what that lets them do, and
-- keeping the two apart means a role change is a code review rather than an
-- UPDATE somebody ran at speed.

create table if not exists public.staff (
  staff_id      uuid        primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  name          text        not null,
  -- Lower-cased at the application boundary, and unique. Sign-in is by address
  -- because staff already know their own; a separate username is one more thing
  -- to forget for a team of five.
  email         text        not null unique,
  -- PBKDF2-SHA256, iterations and salt encoded in the string. Never a plain
  -- digest: SHA-256 over a human-chosen password is a lookup table away from
  -- being plaintext.
  password_hash text        not null,
  -- Role names from roles.ts. An array because one person genuinely holds two
  -- in a practice this size -- Sunil is instructor and often programme owner.
  -- An unrecognised name grants nothing, so a typo here fails closed.
  roles         text[]      not null default '{}',
  -- Revocation without deletion. Somebody leaving must lose access immediately
  -- while their audit trail keeps a name against it -- a deleted row would turn
  -- every action they ever took into "unknown actor", which is worse evidence
  -- than the row costs to keep.
  active        boolean     not null default true,
  last_seen_at  timestamptz
);

create index if not exists staff_email_idx on public.staff (lower(email));
create index if not exists staff_active_idx on public.staff (active) where active;

drop trigger if exists staff_touch on public.staff;
create trigger staff_touch before update on public.staff
  for each row execute function public.touch_updated_at();

alter table public.staff enable row level security;

-- ===========================================================================
-- Stage 3 -- the evidence behind a stage, and the gate on enrolment
-- ===========================================================================
-- A stage is a claim. These tables are what makes the claim checkable.
--
-- THE ONE INVARIANT THIS WHOLE SECTION EXISTS FOR
--
--   "Enrolment requires Sunil's recorded acceptance/admission decision and
--    finance-confirmed payment under the approved offer."
--
-- Two facts, recorded by two people who cannot act for each other. That is why
-- `admissions` and `payments` are separate tables with separate authors rather
-- than two booleans on `opportunities` -- a boolean can be set by whoever has
-- the row open, and a row with an actor and a time cannot.
--
-- WHAT MUST NEVER HAPPEN HERE
--   * No column that says "enrolled" as a fact of its own. Enrolment is
--     DERIVED from the evidence (see enrolment_blockers below). A cached flag
--     is a fifth definition of "did they join", and the learning agent already
--     carries a scar from having five definitions of "did the session happen".
--   * A refund does not delete anything. It is a second payment row with its
--     own meaning, plus a review task. History survives corrections.
--   * Attendance is never evidence of payment, and payment is never evidence
--     of attendance. Two different owners, two different tables, and no join
--     that implies one from the other.

-- ---------------------------------------------------------------------------
-- Meetings -- scheduled and held are two different facts
-- ---------------------------------------------------------------------------
-- The operating guide asks for them separately: "Record scheduled and held
-- meetings separately." A meeting that was booked and missed is signal; a
-- table that only knows about the ones that happened cannot tell you that
-- three people booked and none arrived.

create table if not exists public.meetings (
  meeting_id     uuid        primary key default gen_random_uuid(),
  opportunity_id uuid        not null references public.opportunities(opportunity_id) on delete cascade,
  scheduled_at   timestamptz,
  status         text        not null default 'scheduled'
                             check (status in ('scheduled', 'held', 'cancelled', 'no_show')),
  -- When it ACTUALLY happened. Deliberately not defaulted from scheduled_at:
  -- a meeting that ran late or moved is a different fact from the one booked,
  -- and "held_at = scheduled_at because nobody edited it" is a fabricated time.
  held_at        timestamptz,
  outcome        text,
  next_action    text,
  recorded_by    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists meetings_opp_idx on public.meetings (opportunity_id, scheduled_at desc);
create index if not exists meetings_held_idx on public.meetings (held_at desc) where held_at is not null;

-- ---------------------------------------------------------------------------
-- Offers -- approved by one person, and versioned
-- ---------------------------------------------------------------------------
-- "Only Sunil or an explicitly delegated approver can approve." The column is
-- `approved_by` rather than `created_by` because who WROTE it is not the
-- interesting fact; who stood behind it is.
--
-- A revision is a NEW ROW pointing at the one it replaces. The data dictionary:
-- "revisions linked and not new prospects". Editing an approved offer in place
-- would let the terms somebody accepted change after they accepted them.

create table if not exists public.offers (
  offer_id       uuid        primary key default gen_random_uuid(),
  opportunity_id uuid        not null references public.opportunities(opportunity_id) on delete cascade,
  version        int         not null default 1,
  supersedes     uuid        references public.offers(offer_id) on delete set null,
  approved_by    text        not null,
  approved_at    timestamptz not null default now(),
  currency       text        not null,
  -- MINOR UNITS, always. Storing 1200.00 as a float and reconciling it against
  -- finance later is how a rounding difference becomes an argument. The data
  -- dictionary says minor units and means it.
  amount_minor   bigint      not null check (amount_minor >= 0),
  term_reference text,
  accepted       boolean     not null default false,
  accepted_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists offers_opp_idx on public.offers (opportunity_id, approved_at desc);
create index if not exists offers_accepted_idx on public.offers (accepted, accepted_at desc);

-- ---------------------------------------------------------------------------
-- Payments -- finance evidence, and nothing infers it
-- ---------------------------------------------------------------------------
-- "Do not infer payment from an offer or receipt email." So this table is
-- written by finance and by nobody else, and no other table implies it.
--
-- A refund is a row of type 'refund' with its own amount. Net is receipts
-- minus refunds, computed at read time, per currency. The operating guide is
-- explicit that cross-currency amounts are never added.

create table if not exists public.payments (
  payment_id         uuid        primary key default gen_random_uuid(),
  opportunity_id     uuid        references public.opportunities(opportunity_id) on delete set null,
  person_id          uuid        references public.people(person_id) on delete set null,
  offer_id           uuid        references public.offers(offer_id) on delete set null,
  type               text        not null check (type in ('receipt', 'refund')),
  currency           text        not null,
  amount_minor       bigint      not null check (amount_minor > 0),
  invoice_reference  text,
  evidence_reference text,
  -- Who in finance confirmed it. Not the operator who typed it in, and not
  -- "system": an unattributed payment is not evidence of anything.
  confirmed_by       text        not null,
  -- The transaction date, which is not the day somebody entered it. "Keep
  -- evidence dates separate from entry dates."
  received_at        timestamptz not null,
  created_at         timestamptz not null default now()
);

create index if not exists payments_opp_idx on public.payments (opportunity_id, received_at desc);
create index if not exists payments_person_idx on public.payments (person_id);
create index if not exists payments_type_idx on public.payments (type, received_at desc);

-- ---------------------------------------------------------------------------
-- Admissions -- the other half of the gate
-- ---------------------------------------------------------------------------
-- Sunil's decision, recorded as evidence with an author and a time. A decline
-- is recorded too: "we decided not to" is a fact worth keeping, and its
-- absence is what makes a pipeline look stalled when it is not.

create table if not exists public.admissions (
  admission_id   uuid        primary key default gen_random_uuid(),
  opportunity_id uuid        not null references public.opportunities(opportunity_id) on delete cascade,
  decision       text        not null check (decision in ('admitted', 'declined')),
  decided_by     text        not null,
  decided_at     timestamptz not null default now(),
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists admissions_opp_idx on public.admissions (opportunity_id, decided_at desc);

-- ---------------------------------------------------------------------------
-- Attendance -- the programme owner's record, independent of both
-- ---------------------------------------------------------------------------
-- "Attendance remains independent." Confirming you will come, and coming, are
-- two facts; so are coming and having paid. The programme owner records this
-- and cannot infer payment from it, which roles.ts enforces.

create table if not exists public.attendance (
  attendance_id         uuid        primary key default gen_random_uuid(),
  person_id             uuid        not null references public.people(person_id) on delete cascade,
  cohort_id             uuid        references public.cohorts(cohort_id) on delete set null,
  -- Null for the cohort-level confirmation; set for a specific session.
  session_id            text,
  confirmation_response text        check (confirmation_response in ('yes', 'no', 'unknown')),
  confirmed_at          timestamptz,
  attended              boolean,
  recorded_by           text,
  occurred_on           date,
  created_at            timestamptz not null default now()
);

create unique index if not exists attendance_person_session
  on public.attendance (person_id, coalesce(cohort_id, '00000000-0000-0000-0000-000000000000'::uuid),
                        coalesce(session_id, ''));

-- ---------------------------------------------------------------------------
-- Nominations -- an enterprise order is not eight applications
-- ---------------------------------------------------------------------------
-- "Store participant nominations separately. An organisation order is not
-- eight or ten individual cohort applications."
--
-- A nominated participant is NOT a `people` row and NOT an applicant. They
-- become a person when they themselves do something. Counting nominations as
-- applicants is the easiest way to overstate this pipeline, and keeping them
-- in their own table makes that mistake require effort.

create table if not exists public.nominations (
  nomination_id   uuid        primary key default gen_random_uuid(),
  opportunity_id  uuid        not null references public.opportunities(opportunity_id) on delete cascade,
  organisation_id uuid        references public.organisations(organisation_id) on delete set null,
  name            text,
  email           text,
  role            text,
  note            text,
  created_at      timestamptz not null default now()
);

create index if not exists nominations_opp_idx on public.nominations (opportunity_id);

-- ---------------------------------------------------------------------------
-- Stage history -- every move, with who and why
-- ---------------------------------------------------------------------------
-- `audit_log` records changes generically. This is the typed version for the
-- one change that gets reported on: "Distinct opportunity/stage entries with
-- correction history available", and "not summed as unique people".
--
-- A correction is a row like any other, flagged. Nothing is deleted, so a
-- reversal leaves both the move and the unmove visible -- which is the point,
-- because a pipeline that quietly loses its reversals reports better than it is.

create table if not exists public.stage_history (
  entry_id       uuid        primary key default gen_random_uuid(),
  opportunity_id uuid        not null references public.opportunities(opportunity_id) on delete cascade,
  from_stage     text,
  to_stage       text        not null,
  actor          text        not null,
  -- Required by the console when closing or reversing. Null is legitimate for
  -- an ordinary forward move; a close or a reversal without one is refused
  -- before it reaches here.
  reason         text,
  is_reversal    boolean     not null default false,
  occurred_at    timestamptz not null default now()
);

create index if not exists stage_history_opp_idx on public.stage_history (opportunity_id, occurred_at desc);
create index if not exists stage_history_stage_idx on public.stage_history (to_stage, occurred_at desc);

-- ---------------------------------------------------------------------------
-- enrolment_blockers -- what is still missing before somebody can be enrolled
-- ---------------------------------------------------------------------------
-- One row per missing piece; no rows when nothing is missing. The console
-- prints them, and the write path refuses the transition while any remain.
--
-- A FUNCTION rather than a flag on the row, for the reason at the top of this
-- section: enrolment is derived from evidence. Ask the question at the moment
-- it matters and the answer cannot go stale, cannot be set by hand, and cannot
-- disagree with the tables it is drawn from.

create or replace function public.enrolment_blockers(p_opportunity_id uuid)
returns table (code text, detail text)
language sql stable as $fn$
  select 'no_offer'::text, 'No approved offer.'::text
  where not exists (
    select 1 from public.offers o where o.opportunity_id = p_opportunity_id
  )
  union all
  select 'offer_not_accepted'::text, 'The approved offer has not been marked accepted.'::text
  where exists (select 1 from public.offers o where o.opportunity_id = p_opportunity_id)
    and not exists (
      select 1 from public.offers o
       where o.opportunity_id = p_opportunity_id and o.accepted
    )
  union all
  select 'no_admission'::text, 'No admission decision recorded. Only Sunil can record one.'::text
  where not exists (
    select 1 from public.admissions a
     where a.opportunity_id = p_opportunity_id and a.decision = 'admitted'
  )
  union all
  select 'no_payment'::text, 'No finance-confirmed payment. Only finance can record one.'::text
  where not exists (
    select 1 from public.payments p
     where p.opportunity_id = p_opportunity_id and p.type = 'receipt'
  );
$fn$;

alter table public.meetings      enable row level security;
alter table public.offers        enable row level security;
alter table public.payments      enable row level security;
alter table public.admissions    enable row level security;
alter table public.attendance    enable row level security;
alter table public.nominations   enable row level security;
alter table public.stage_history enable row level security;

drop trigger if exists meetings_touch on public.meetings;
create trigger meetings_touch before update on public.meetings
  for each row execute function public.touch_updated_at();

drop trigger if exists offers_touch on public.offers;
create trigger offers_touch before update on public.offers
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- Communications -- everything up to the moment of sending, and not the send
-- ===========================================================================
-- Stage 4 of the cohort rebuild. Five tables: the approved wordings, the
-- sequences, the outbox, the suppression list and the provider event log.
--
-- ---------------------------------------------------------------------------
-- NOTHING HERE SENDS ANYTHING. THAT IS THE DESIGN, NOT AN UNFINISHED EDGE.
-- ---------------------------------------------------------------------------
--
-- Decision D2 is open: there is no sending provider, no verified sending
-- domain and no monitored reply mailbox. The handoff package ships the twelve
-- templates marked "disabled_pending_exact_version_approval_and_route_tests",
-- and the brief names sender verification, reply handling and suppression as
-- launch dependencies rather than as nice-to-haves.
--
-- So a row in comms_messages is a message that WOULD go, held at the last
-- step. Everything a real outbox has to get right -- idempotency, the calendar
-- clock, the second eligibility check, bounded retries, one-way suppression,
-- out-of-order callbacks -- is here and exercisable. The only missing piece is
-- the provider adapter, and it is one named function in src/lib/comms/outbox.ts.
--
-- ---------------------------------------------------------------------------
-- THE THREE PROPERTIES THIS SCHEMA MAKES STRUCTURAL RATHER THAN CAREFUL
-- ---------------------------------------------------------------------------
--
--   1. AN APPROVED WORDING CANNOT BE EDITED. message_templates content columns
--      are frozen by a trigger from the moment the row exists. "What went out
--      and which wording it used must be answerable later" is only true if the
--      row a message points at still says what it said.
--
--   2. A MESSAGE STATE ONLY EVER MOVES ONE WAY. The brief: "A delivered
--      callback must not override a later bounce, complaint or unsubscribe
--      suppression." A rank function plus a trigger makes a regression
--      impossible rather than unlikely, with exactly one door in the other
--      direction: a reconciled unknown outcome, which is the brief's rule that
--      you never blind-retry a send that may have landed.
--
--   3. SUPPRESSION IS ONE-WAY. comms_suppressions refuses UPDATE and DELETE.
--      A stale callback, a race, or somebody clicking the wrong button cannot
--      put an address back on a list it came off.

-- ---------------------------------------------------------------------------
-- message_templates -- approved by version, never edited in place
-- ---------------------------------------------------------------------------
-- One row per (key, version). The twelve from the handoff package are loaded
-- by the console, UNAPPROVED, because approval is a person's act and neither a
-- schema file nor a loader can perform it. approved_at is null is what every
-- eligibility check reads, and it is why nothing is sendable today even with a
-- provider wired.
--
-- The body is stored as it arrived, character for character. content_hash is
-- computed by the application over version|key|subject|body|actions and
-- re-checked on read: it is how the console proves the row still matches the
-- package rather than trusting that nobody ran an UPDATE.

create table if not exists public.message_templates (
  template_id   uuid        primary key default gen_random_uuid(),
  -- The package's own id: 'application-day2', 'enquiry-receipt', ...
  template_key  text        not null,
  -- The package version the wording came from, e.g. 'LC-LAUNCH-2026-09-10'.
  -- A new form of words is a NEW ROW with a new version, never an edit.
  version       text        not null,
  route         text        not null check (route in ('application', 'enquiry', 'enterprise')),
  -- 0 for a receipt; 2, 5 or 9 for nurture. Calendar days, not hour multiples.
  day_offset    int         not null check (day_offset >= 0),
  purpose       text        not null check (purpose in ('transactional', 'marketing')),
  subject       text        not null,
  body          text        not null,
  -- Action KEYS, not links. The implementation reference: "The unsubscribe
  -- action key must be rendered as a signed one-action link by the chosen email
  -- integration; no literal token belongs in a sent email."
  actions       text[]      not null default '{}',
  content_hash  text        not null,
  -- Approval is a fact with an author and a time, or it is absent. There is no
  -- 'pending' state -- an unapproved template simply has no approval recorded.
  approved_at   timestamptz,
  approved_by   text,
  -- Withdrawing approval is allowed and is NOT an edit: the wording is
  -- untouched, it simply stops being sendable. A wording found to be wrong has
  -- to be stoppable in one action without rewriting history.
  revoked_at     timestamptz,
  revoked_by     text,
  revoked_reason text,
  created_at    timestamptz not null default now()
);

create unique index if not exists message_templates_key_version
  on public.message_templates (template_key, version);
create index if not exists message_templates_route_idx
  on public.message_templates (route, day_offset);
create index if not exists message_templates_approved_idx
  on public.message_templates (approved_at desc nulls last);

-- The content columns are frozen. Approval columns are not -- approving and
-- revoking are the only two things anybody may do to a template row.
create or replace function public.message_templates_are_immutable() returns trigger
language plpgsql as $trg$
begin
  if new.template_key is distinct from old.template_key
     or new.version      is distinct from old.version
     or new.route        is distinct from old.route
     or new.day_offset   is distinct from old.day_offset
     or new.purpose      is distinct from old.purpose
     or new.subject      is distinct from old.subject
     or new.body         is distinct from old.body
     or new.actions      is distinct from old.actions
     or new.content_hash is distinct from old.content_hash
  then
    raise exception 'message_templates wording is immutable: a new form of words is a new version row, not an edit to an approved one';
  end if;
  return new;
end;
$trg$;

drop trigger if exists message_templates_no_content_update on public.message_templates;
create trigger message_templates_no_content_update before update on public.message_templates
  for each row execute function public.message_templates_are_immutable();

-- ---------------------------------------------------------------------------
-- comms_sequences -- one per person for this programme, and it does not restart
-- ---------------------------------------------------------------------------
-- "A person has one active sequence for this programme; an enquiry-to-
-- application change stops the enquiry sequence and creates a human review task
-- rather than restarting marketing."
--
-- The partial unique index below is that sentence in the database. Two forms
-- posted seconds apart cannot both open a sequence, which is exactly the case
-- an application-level check loses.
--
-- 'stopped' IS TERMINAL AND NOTHING IN THE CODE MOVES IT BACK. "Stopped
-- sequences do not restart automatically." Resume exists only for 'paused',
-- only by hand, and it never replays what was missed -- see the cancel-on-resume
-- rule in src/lib/comms/outbox.ts.

create table if not exists public.comms_sequences (
  sequence_id    uuid        primary key default gen_random_uuid(),
  person_id      uuid        not null references public.people(person_id) on delete cascade,
  opportunity_id uuid        references public.opportunities(opportunity_id) on delete set null,
  -- The submission that started it. The anchor for every calendar-day offset.
  submission_id  uuid        references public.form_submissions(submission_id) on delete set null,
  route          text        not null check (route in ('application', 'enquiry', 'enterprise')),
  cohort_id      uuid        references public.cohorts(cohort_id) on delete set null,
  state          text        not null default 'active'
                             check (state in ('active', 'paused', 'stopped', 'completed')),
  -- The saved submission's time. Offsets are calendar days from ITS
  -- Asia/Kolkata date, not 24-hour multiples from this instant.
  anchor_at      timestamptz not null,
  started_at     timestamptz not null default now(),
  paused_at      timestamptz,
  paused_reason  text,
  stopped_at     timestamptz,
  stopped_reason text,
  resumed_at     timestamptz,
  resumed_by     text,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- One live sequence per person, full stop. A paused sequence still occupies the
-- slot: pausing is not a way to start a second one.
create unique index if not exists comms_sequences_one_live
  on public.comms_sequences (person_id)
  where state in ('active', 'paused');

create index if not exists comms_sequences_state_idx on public.comms_sequences (state, started_at desc);
create index if not exists comms_sequences_person_idx on public.comms_sequences (person_id, started_at desc);
create index if not exists comms_sequences_opp_idx on public.comms_sequences (opportunity_id);

-- ---------------------------------------------------------------------------
-- comms_messages -- the durable outbox
-- ---------------------------------------------------------------------------
-- The data dictionary's communication record: "message_id; person/opportunity
-- link; purpose; template/version; sequence step; recipient; queued/sent/
-- delivered/replied/bounced states and timestamps; provider ID; failure
-- reason."
--
-- WHY THE SUBJECT AND BODY ARE COPIED ONTO THE ROW. The template is already
-- immutable, so this is not protection against an edit -- it is so that a
-- message can be read a year later without resolving anything. "What went out"
-- is one row.
--
-- idempotency_key IS THE WHOLE DUPLICATE STORY, the same mechanism as
-- form_submissions.request_key. It is derived from sequence + template + step,
-- so a scheduler that runs twice, a retried queue call and a double-clicked
-- manual send all collapse to one row. Nothing else prevents a duplicate send
-- and nothing else needs to.
--
-- recipient is a snapshot of the address at queue time. If somebody corrects
-- their address afterwards the queued message is cancelled and re-queued rather
-- than silently re-aimed -- a message approved for one address is not approved
-- for another.

create table if not exists public.comms_messages (
  message_id       uuid        primary key default gen_random_uuid(),
  idempotency_key  text        not null unique,
  sequence_id      uuid        references public.comms_sequences(sequence_id) on delete set null,
  person_id        uuid        references public.people(person_id) on delete cascade,
  opportunity_id   uuid        references public.opportunities(opportunity_id) on delete set null,
  submission_id    uuid        references public.form_submissions(submission_id) on delete set null,
  template_key     text        not null,
  template_version text        not null,
  purpose          text        not null check (purpose in ('transactional', 'marketing')),
  -- 0 for a receipt, 2/5/9 for a nurture step, null for a manual message.
  sequence_step    int,
  recipient        text        not null,
  subject          text        not null,
  -- Rendered at queue time and stored as text. The unsubscribe ACTION KEY is
  -- still a key here; the signed link is materialised by the provider adapter
  -- at the moment of dispatch, so no token is ever written to this table.
  body             text        not null,
  state            text        not null default 'queued'
                               check (state in ('queued', 'cancelled', 'sending', 'unknown',
                                                'sent', 'delivered', 'replied', 'failed',
                                                'bounced', 'complained')),
  -- The moment it becomes due. 10:00 Asia/Kolkata on the offset calendar day
  -- for nurture; the save instant for a receipt.
  scheduled_for    timestamptz not null,
  queued_at        timestamptz not null default now(),
  -- Set when a dispatcher claims it. A stale claim is reconciled, never simply
  -- taken back -- see the trigger below.
  claimed_at       timestamptz,
  sent_at          timestamptz,
  delivered_at     timestamptz,
  failed_at        timestamptz,
  cancelled_at     timestamptz,
  cancel_reason    text,
  -- Bounded retries. MAX_ATTEMPTS lives in outbox.ts; this is the count.
  attempts         int         not null default 0,
  next_attempt_at  timestamptz,
  last_error       text,
  -- Whose reference this is, and the reference itself. Reconciliation asks the
  -- provider about THIS id before any retry.
  provider            text,
  provider_message_id text,
  reconciled_at    timestamptz,
  reconciled_note  text,
  -- The failure queue's "staff alert" half: set once, so the same failure does
  -- not alert on every sweep.
  alerted_at       timestamptz,
  -- A message produced by the console's "send test" path. Excluded from every
  -- count, the same way form_submissions.is_test is.
  is_test          boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists comms_messages_due_idx
  on public.comms_messages (scheduled_for) where state = 'queued';
create index if not exists comms_messages_state_idx
  on public.comms_messages (state, scheduled_for desc);
create index if not exists comms_messages_sequence_idx
  on public.comms_messages (sequence_id, sequence_step);
create index if not exists comms_messages_person_idx
  on public.comms_messages (person_id, scheduled_for desc);
create index if not exists comms_messages_opp_idx
  on public.comms_messages (opportunity_id, scheduled_for desc);
create index if not exists comms_messages_provider_idx
  on public.comms_messages (provider, provider_message_id);
-- The failure queue, as an index rather than a second table: a message that
-- needs a human is one whose outcome is unknown or which gave up.
create index if not exists comms_messages_failures_idx
  on public.comms_messages (updated_at desc)
  where state in ('unknown', 'failed', 'bounced', 'complained');

-- How final a state is. Higher is more final. A message may only move UP.
--
-- The ordering is the brief's rule made arithmetic: delivered (40) can become
-- bounced (70), because a bounce can genuinely arrive after a delivery
-- notification; bounced can never become delivered, because a stale callback
-- must not lift a suppression. 'cancelled' sits at 15 so it is reachable from
-- 'queued' and from nowhere else -- a message already handed to a provider
-- cannot be un-sent by clicking cancel.
create or replace function public.comms_state_rank(s text) returns int
language sql immutable parallel safe as $fn$
  select case s
    when 'queued'     then 10
    when 'cancelled'  then 15
    when 'sending'    then 20
    when 'unknown'    then 25
    when 'sent'       then 30
    when 'delivered'  then 40
    when 'replied'    then 50
    when 'failed'     then 60
    when 'bounced'    then 70
    when 'complained' then 80
    else 0
  end;
$fn$;

-- THE ONE-WAY RULE, AND ITS SINGLE DOOR.
--
-- A state may stay where it is or move up. The one permitted descent is
-- unknown -> queued, and only as part of a reconciliation that established the
-- message never left: reconciled_at must be newly set and provider_message_id
-- must be null. That is the brief's "on a provider timeout with unknown send
-- outcome, reconcile using the provider message reference before retrying",
-- enforced rather than documented.
create or replace function public.comms_messages_state_is_one_way() returns trigger
language plpgsql as $trg$
begin
  if new.state = old.state then
    return new;
  end if;

  if old.state = 'unknown' and new.state = 'queued' then
    if new.reconciled_at is null or new.reconciled_at is not distinct from old.reconciled_at then
      raise exception 'a message returns to the queue only as part of a reconciliation: set reconciled_at';
    end if;
    if new.provider_message_id is not null then
      raise exception 'this message has a provider reference, so it may have landed: resolve it to sent or failed rather than re-queueing it';
    end if;
    return new;
  end if;

  if public.comms_state_rank(new.state) < public.comms_state_rank(old.state) then
    raise exception 'message state is one-way: % cannot become % (a stale callback must never lift a later bounce, complaint or unsubscribe)', old.state, new.state;
  end if;

  return new;
end;
$trg$;

drop trigger if exists comms_messages_one_way on public.comms_messages;
create trigger comms_messages_one_way before update on public.comms_messages
  for each row execute function public.comms_messages_state_is_one_way();

-- ---------------------------------------------------------------------------
-- comms_suppressions -- one-way, and deliberately not cascaded
-- ---------------------------------------------------------------------------
-- Keyed on the normalised address, NOT on person_id, and the person link is
-- on delete set null. That is on purpose, and it is the brief's: "Deletion and
-- unsubscribe are different actions; retain only necessary suppression and
-- audit evidence under the agreed policy."
--
-- If suppression cascaded with the person, erasing somebody who had complained
-- would make them sendable again the next time they touched a form. The address
-- and the reason are the minimum that prevents it, and NOTHING ELSE about the
-- person is kept here -- no name, no answers, no opportunity.
--
-- THE RETENTION OF THAT ADDRESS AFTER AN ERASURE NEEDS THE DATA OWNER'S
-- AGREEMENT. It belongs with the outstanding privacy facts. Do not treat this
-- comment as the sign-off.
--
-- SCOPE IS THE ONE DISTINCTION WORTH A COLUMN:
--   'marketing' -- an unsubscribe. Receipts still go: somebody who asks us to
--                  do something is still owed the acknowledgement that we did.
--   'all'       -- a hard bounce or a complaint. Nothing goes, transactional
--                  included. Mail to a dead address is pointless; mail to
--                  somebody who reported us as spam is harmful.

create table if not exists public.comms_suppressions (
  suppression_id   uuid        primary key default gen_random_uuid(),
  normalised_email text        not null unique,
  -- Null once the person is erased. The suppression outlives them by design.
  person_id        uuid        references public.people(person_id) on delete set null,
  reason           text        not null check (reason in ('unsubscribe', 'hard_bounce', 'complaint', 'manual')),
  scope            text        not null check (scope in ('marketing', 'all')),
  -- Where it came from: 'unsubscribe-link', a provider name, or a staff actor.
  source           text,
  -- Never the provider's raw payload, which carries the address and often the
  -- original body. A category and a reference only.
  detail           text,
  created_at       timestamptz not null default now()
);

create index if not exists comms_suppressions_reason_idx
  on public.comms_suppressions (reason, created_at desc);
create index if not exists comms_suppressions_person_idx
  on public.comms_suppressions (person_id);

-- One-way, structurally. There is no console path that lifts a suppression, and
-- this is why: neither a race, a stale provider callback nor a mis-click can put
-- an address back on a list it came off. Re-subscription is a deliberate act
-- outside this application, taken with the data owner.
create or replace function public.comms_suppressions_are_one_way() returns trigger
language plpgsql as $trg$
begin
  raise exception 'comms_suppressions is one-way: an address is never un-suppressed by this application';
end;
$trg$;

drop trigger if exists comms_suppressions_no_update on public.comms_suppressions;
create trigger comms_suppressions_no_update before update on public.comms_suppressions
  for each row execute function public.comms_suppressions_are_one_way();

drop trigger if exists comms_suppressions_no_delete on public.comms_suppressions;
create trigger comms_suppressions_no_delete before delete on public.comms_suppressions
  for each row execute function public.comms_suppressions_are_one_way();

-- ---------------------------------------------------------------------------
-- comms_events -- every provider callback, including the ones we refuse
-- ---------------------------------------------------------------------------
-- "Provider callbacks are authenticated, deduplicated and tolerate out-of-order
-- delivery."
--
--   * AUTHENTICATED happens at the endpoint, not here.
--   * DEDUPLICATED is the unique index on (provider, provider_event_id). A
--     provider that retries its webhook writes one row, not two.
--   * OUT-OF-ORDER is why `applied` exists. A delivered callback arriving after
--     a bounce is STORED, marked not applied, and its outcome says why. Dropping
--     it would leave nothing to point at when somebody asks why the provider's
--     dashboard and this table disagree.
--
-- The payload itself is NOT stored. A provider's bounce payload routinely
-- carries the address, the subject and a chunk of the original body, and this
-- table is read by anybody with console access. A digest is enough to prove two
-- callbacks were the same one.

create table if not exists public.comms_events (
  event_id            uuid        primary key default gen_random_uuid(),
  provider            text        not null,
  -- The provider's own id for this event. The dedupe key.
  provider_event_id   text        not null,
  provider_message_id text,
  message_id          uuid        references public.comms_messages(message_id) on delete set null,
  type                text        not null check (type in ('delivered', 'bounce_hard', 'bounce_soft',
                                                           'complaint', 'reply', 'unsubscribe', 'deferred')),
  -- The provider's clock. received_at is ours. They disagree, which is the whole
  -- reason out-of-order arrival is a case rather than a curiosity.
  occurred_at         timestamptz,
  received_at         timestamptz not null default now(),
  payload_digest      text,
  applied             boolean     not null default false,
  -- Why it was or was not applied, in words, e.g. 'refused: already bounced'.
  outcome             text,
  created_at          timestamptz not null default now()
);

create unique index if not exists comms_events_provider_key
  on public.comms_events (provider, provider_event_id);
create index if not exists comms_events_message_idx on public.comms_events (message_id, received_at desc);
create index if not exists comms_events_type_idx on public.comms_events (type, received_at desc);
create index if not exists comms_events_received_idx on public.comms_events (received_at desc);

alter table public.message_templates  enable row level security;
alter table public.comms_sequences    enable row level security;
alter table public.comms_messages     enable row level security;
alter table public.comms_suppressions enable row level security;
alter table public.comms_events       enable row level security;

drop trigger if exists comms_sequences_touch on public.comms_sequences;
create trigger comms_sequences_touch before update on public.comms_sequences
  for each row execute function public.touch_updated_at();

drop trigger if exists comms_messages_touch on public.comms_messages;
create trigger comms_messages_touch before update on public.comms_messages
  for each row execute function public.touch_updated_at();

-- ===========================================================================
-- ===========================================================================
-- V4 ADDENDUM (LC-STRATEGY-V4.0.0, 11 September 2026) -- THE RESOURCE REQUEST
-- ===========================================================================
-- ===========================================================================
--
-- APPENDED SECTION. Nothing above this line was changed, and nothing above it
-- needs to be for the three forms to keep working exactly as they did. One new
-- table, one new function, and one widened CHECK -- called out below because it
-- is the only statement in this section that touches an object created earlier.
--
-- ---------------------------------------------------------------------------
-- WHAT A RESOURCE REQUEST IS, AND THE THREE THINGS IT IS NOT
-- ---------------------------------------------------------------------------
--
-- The addendum, verbatim: "Anonymous resource views/downloads are events, not
-- people. An optional email request creates a resource request attached to an
-- existing or new person using the retained deduplication rules. Keep it
-- distinct from enquiry and application. Never infer marketing permission from
-- downloading."
--
-- So this is a FOURTH RECORD TYPE, and the discipline is entirely in what it
-- does NOT do:
--
--   * IT IS NOT AN APPLICATION AND NOT AN ENQUIRY. It creates no opportunity,
--     moves no stage, opens no task and writes no activity. form_submissions is
--     untouched by this path, so nothing a resource requester does can appear
--     in an application count. That separation is acceptance case V4-E05, and
--     it is structural here rather than a rule somebody follows.
--   * IT IS NOT PERMISSION. No row is written to consents by this path, ever.
--     A person asking for a worksheet has asked for a worksheet. "Do not send a
--     resource requester the cohort nurture solely because an email address
--     exists" is the release controls' own sentence, and the way to guarantee
--     it is to have no code here that could.
--   * IT IS NOT A DOWNLOAD COUNT. A view or a download by somebody who never
--     typed an address is a row in events and nothing else -- no person, no row
--     here. V4-E02. The endpoint that writes this table is its only writer and
--     it requires an address, so an anonymous visitor cannot reach it.
--
-- ---------------------------------------------------------------------------
-- WHY THE ATTRIBUTION COLUMNS ARE ON THIS TABLE AND NOT IN attributions
-- ---------------------------------------------------------------------------
--
-- public.attributions is keyed one-row-per-submission: submission_id is its
-- PRIMARY KEY and a foreign key to form_submissions. Putting a resource request
-- in there would mean making that column nullable, dropping the primary key it
-- is, and adding a second nullable foreign key beside it -- a rewrite of a
-- shipped table, and a table that afterwards cannot say what a row is about
-- without reading two columns.
--
-- The columns below are therefore the SAME COLUMNS BY THE SAME NAMES, held on
-- the row they describe. A union view over the two is three lines whenever
-- somebody wants one, and the two halves stay separate for the same reason they
-- do in attributions itself: first_* is the first touch we were permitted to
-- remember, session_* is the visit that made the request, self_reported is what
-- they said themselves, and none of the three corrects another.
--
-- tracking_permission is false on every row and first_* is therefore null on
-- every row, exactly as for submissions. That is the honest state with no
-- consent surface built (E07), not a gap to fill in -- and it is why acceptance
-- case V4-E01 is answered by keeping a resource request and a later application
-- as two rows with two session sources, rather than by copying one onto the
-- other.

-- ---------------------------------------------------------------------------
-- message_templates.route -- widened to admit 'resource'
-- ---------------------------------------------------------------------------
-- THE ONE STATEMENT IN THIS SECTION THAT ALTERS SOMETHING CREATED ABOVE, and it
-- only ever adds a permitted value. Without it a reviewed resource-delivery
-- wording could never be stored, which would leave every resource delivery
-- permanently unsendable for a reason that has nothing to do with approval.
--
-- Filing that wording under 'enquiry' instead would have needed no DDL and is
-- the thing the addendum forbids in so many words: "Keep it distinct from
-- enquiry and application."
--
-- Drop-then-add rather than a guarded add, so re-running this file is a no-op
-- either way. The constraint name is the one Postgres generates for the inline
-- column check declared above.
alter table public.message_templates
  drop constraint if exists message_templates_route_check;
alter table public.message_templates
  add constraint message_templates_route_check
  check (route in ('application', 'enquiry', 'enterprise', 'resource'));

-- ---------------------------------------------------------------------------
-- resource_requests -- one row per saved request, keyed by its idempotency key
-- ---------------------------------------------------------------------------
-- "The backend remains the record of successful submissions. Persist the
-- request and idempotency key before displaying success; use a durable delivery
-- job/outbox and expose email failures to staff."
--
-- The delivery is NOT a second mechanism. delivery_message_id points at a row
-- in comms_messages -- stage 4's outbox, with its double eligibility check, its
-- suppression list, its one-way state machine and its failure queue. The four
-- delivery columns here are this request's own view of that: what we tried to
-- do about delivery and what happened when we tried. The message's own state
-- lives on the message.

create table if not exists public.resource_requests (
  request_id       uuid        primary key default gen_random_uuid(),
  -- Same mechanism as form_submissions.request_key: the browser sends one key
  -- per attempt, a retry carries the same key, and the unique index is what
  -- makes a double-click one request rather than two. V4-E02's "repeated submit
  -- sends no duplicate receipt" is this column plus the outbox's own
  -- idempotency key, which is derived from request_id.
  request_key      text        not null unique,
  -- Cascades with the person, like every other record about them. Erasing
  -- somebody from the console really erases what they asked for.
  person_id        uuid        not null references public.people(person_id) on delete cascade,
  -- The register's identifier in lower case: 'lc-r01', 'lc-r02', 'lc-r03'.
  -- DELIBERATELY NOT A CHECK CONSTRAINT AGAINST A LIST OF THREE. The released
  -- set is owned by src/data/resources.ts and validated by
  -- src/lib/pipeline/resources.ts before anything reaches here; a fourth
  -- worksheet must not need a migration, and a list of ids in two places is the
  -- four-copies-of-TBD mistake this repo has already paid for once.
  resource_id      text        not null check (btrim(resource_id) <> ''),
  -- Which version of the worksheet the request was made against, so V4-E04's
  -- "downloads match the approved resource version" is answerable a month
  -- later. It is the resource's own revision date, copied at request time.
  resource_version text,
  -- Delivery, as this row sees it.
  --   pending  nothing has been attempted yet
  --   queued   a comms_messages row exists; the outbox owns it from here
  --   blocked  eligibility refused to create one (suppression, a withdrawn or
  --            missing wording), which is a decision and not a fault
  --   failed   the attempt errored. THE REQUEST STILL STANDS. This is the
  --            "expose email failures to staff" half of V4-E03: a saved request
  --            whose delivery did not queue must be visible, not lost.
  delivery_state   text        not null default 'pending'
                               check (delivery_state in ('pending', 'queued', 'blocked', 'failed')),
  -- One staff-facing sentence saying why. NEVER an error object and never an
  -- address: this column is read in the console, and a caught exception can
  -- carry the whole request body.
  delivery_note    text,
  delivery_message_id uuid     references public.comms_messages(message_id) on delete set null,
  delivery_at      timestamptz,
  -- Test traffic, excluded from every count, exactly as form_submissions.is_test.
  is_test          boolean     not null default false,
  requested_at     timestamptz not null default now(),

  -- ---- Attribution. Same names as public.attributions; see the note above. --
  --
  -- resource_id_dimension is the analytics dimension the addendum asks for --
  -- "Add resource_id for the resource interaction" -- captured in the
  -- attribution payload beside the UTMs. It normally equals resource_id above
  -- and is kept separately because they answer different questions: one is what
  -- this record IS, the other is what the measurement was tagged with, and a
  -- disagreement between them is a bug worth being able to see.
  resource_id_dimension text,
  first_source        text,
  first_medium        text,
  first_campaign      text,
  first_content       text,
  first_term          text,
  session_source      text,
  session_medium      text,
  session_campaign    text,
  session_content     text,
  session_term        text,
  entry_path          text,
  -- Bare host, never a full URL, and NULL FOR OUR OWN HOST. That null is what
  -- stops a worksheet read on the way to the cohort page from becoming the
  -- source of the application that follows it (V4-E01).
  referrer_host       text,
  self_reported       text,
  tracking_permission boolean     not null default false,
  first_captured_at   timestamptz,
  session_captured_at timestamptz not null default now(),

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists resource_requests_person_idx
  on public.resource_requests (person_id, requested_at desc);
-- Reporting counts "saved database request IDs, excluding retries" by resource.
create index if not exists resource_requests_resource_idx
  on public.resource_requests (resource_id, requested_at desc);
-- The staff view of the failure queue: everything that is not safely queued.
create index if not exists resource_requests_delivery_idx
  on public.resource_requests (delivery_state, requested_at desc)
  where delivery_state <> 'queued';
create index if not exists resource_requests_campaign_idx
  on public.resource_requests (session_campaign, session_content);

alter table public.resource_requests enable row level security;

drop trigger if exists resource_requests_touch on public.resource_requests;
create trigger resource_requests_touch before update on public.resource_requests
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- resource_request_submit() -- the save, in one transaction
-- ---------------------------------------------------------------------------
-- The same argument as pipeline_submit(), for the same reason: supabase-js
-- speaks PostgREST and PostgREST gives one statement per request, so a person
-- insert followed by a request insert is two transactions with a gap in the
-- middle that a killed function can land in. "Persist the request and
-- idempotency key before displaying success" is only true if the person and the
-- request commit together.
--
-- IT IS DELIBERATELY MUCH SMALLER THAN pipeline_submit(). No organisation, no
-- opportunity, no stage, no task, no activity, no consent. Every one of those
-- would be this record type quietly becoming an application, which is exactly
-- what V4-E05 tests. If a future edit adds one of them here, read the head of
-- this section again first.
--
-- THE DEDUPLICATION RULE IS THE RETAINED ONE and is not restated: the caller
-- passes p_normalised_email, produced by normaliseEmail() in
-- src/lib/pipeline/forms.ts -- trimmed, lower-cased, plus-tags NOT stripped --
-- and the unique index on people.normalised_email does the rest. A second
-- implementation of that rule in SQL is how a+cohort@x.com becomes two people
-- on one path and one person on another.

create or replace function public.resource_request_submit(
  p_request_key      text,
  p_resource_id      text,
  p_name             text,
  p_normalised_email text,
  p_original_email   text,
  p_resource_version text        default null,
  p_attribution      jsonb       default '{}'::jsonb,
  p_is_test          boolean     default false,
  p_actor            text        default 'public_form'
)
returns table (
  request_id      uuid,
  already_existed boolean,
  person_id       uuid
)
language plpgsql
as $fn$
#variable_conflict use_column
declare
  v_request_id uuid;
  v_person_id  uuid;
begin
  if p_normalised_email is null or btrim(p_normalised_email) = '' then
    raise exception 'resource_request_submit: an address is required; an anonymous download is an event, not a person';
  end if;
  if p_resource_id is null or btrim(p_resource_id) = '' then
    raise exception 'resource_request_submit: a resource id is required';
  end if;

  -- 1 -- The request key. A hit returns the original row and writes nothing.
  select r.request_id, r.person_id
    into v_request_id, v_person_id
    from public.resource_requests r
   where r.request_key = p_request_key;

  if v_request_id is not null then
    return query select v_request_id, true, v_person_id;
    return;
  end if;

  -- 2 -- Person, by normalised email and nothing else.
  insert into public.people (name, normalised_email, original_email)
  values (p_name, p_normalised_email, p_original_email)
  on conflict (normalised_email) do nothing
  returning people.person_id into v_person_id;

  if v_person_id is null then
    -- Already known, and NOTHING IS OVERWRITTEN -- not even a blank filled in.
    -- pipeline_submit() fills blanks because an application carries answers an
    -- operator wants. A worksheet request carries a name and an address and is
    -- the weakest evidence in the system; it must never edit a person record
    -- that an application or an operator wrote.
    select p.person_id into v_person_id
      from public.people p
     where p.normalised_email = p_normalised_email;
  end if;

  -- 3 -- The request. Claims the key; a concurrent twin loses here and reads
  --      the winner's row back rather than raising.
  begin
    insert into public.resource_requests (
      request_key, person_id, resource_id, resource_version, is_test,
      resource_id_dimension,
      first_source, first_medium, first_campaign, first_content, first_term,
      session_source, session_medium, session_campaign, session_content, session_term,
      entry_path, referrer_host, self_reported, tracking_permission,
      first_captured_at, session_captured_at
    ) values (
      p_request_key,
      v_person_id,
      p_resource_id,
      nullif(btrim(coalesce(p_resource_version, '')), ''),
      coalesce(p_is_test, false),
      nullif(p_attribution ->> 'resource_id', ''),
      nullif(p_attribution ->> 'first_source', ''),
      nullif(p_attribution ->> 'first_medium', ''),
      nullif(p_attribution ->> 'first_campaign', ''),
      nullif(p_attribution ->> 'first_content', ''),
      nullif(p_attribution ->> 'first_term', ''),
      nullif(p_attribution ->> 'session_source', ''),
      nullif(p_attribution ->> 'session_medium', ''),
      nullif(p_attribution ->> 'session_campaign', ''),
      nullif(p_attribution ->> 'session_content', ''),
      nullif(p_attribution ->> 'session_term', ''),
      nullif(p_attribution ->> 'entry_path', ''),
      nullif(p_attribution ->> 'referrer_host', ''),
      nullif(p_attribution ->> 'self_reported', ''),
      coalesce((p_attribution ->> 'tracking_permission')::boolean, false),
      nullif(p_attribution ->> 'first_captured_at', '')::timestamptz,
      coalesce(nullif(p_attribution ->> 'session_captured_at', '')::timestamptz, now())
    )
    returning resource_requests.request_id into v_request_id;
  exception when unique_violation then
    select r.request_id, r.person_id
      into v_request_id, v_person_id
      from public.resource_requests r
     where r.request_key = p_request_key;

    if v_request_id is null then raise; end if;

    return query select v_request_id, true, v_person_id;
    return;
  end;

  -- 4 -- Audit. Ids and decisions only -- no name, no address, no free text.
  --      record_type is 'resource_request' and never 'form_submission': a
  --      reader counting submissions in this log must not pick these up.
  insert into public.audit_log (record_type, record_id, actor, previous_value, new_value, reason)
  values (
    'resource_request', v_request_id, p_actor, null,
    jsonb_build_object(
      'resource_id',      p_resource_id,
      'resource_version', p_resource_version,
      'person_id',        v_person_id,
      'is_test',          coalesce(p_is_test, false)
    ),
    'Resource request committed. No opportunity, no stage and no consent were created.'
  );

  return query select v_request_id, false, v_person_id;
end;
$fn$;

-- Writes, so no public execute grant -- same rule as pipeline_submit().
revoke all on function public.resource_request_submit from public;
grant execute on function public.resource_request_submit to service_role;
