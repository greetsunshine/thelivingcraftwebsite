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
-- Capability pulses — the same question either side of one session
-- ---------------------------------------------------------------------------
-- Two ratings a week: one in the run-up to the session, one after it. Each
-- covers ONLY the capabilities that session's `topics` names — three for week 1,
-- not thirteen.
--
-- WHY SCOPED, AND WHY THAT IS THE WHOLE FEATURE. Asking all thirteen twice a
-- week is twelve surveys of thirteen questions across six weeks, and a room of
-- director-level engineers stops answering by week two. Three ratings takes
-- half a minute, and — the part that matters — the delta is ATTRIBUTABLE. A
-- movement on A5 either side of the session that taught A5 says something. The
-- same movement measured six weeks apart says only that time passed.
--
-- This does NOT replace §5.6's week-0 intake and week-6 re-ask. Those are the
-- cohort-level before/after over all thirteen capabilities and remain the
-- evidence for the programme's outcome claims. This is per-session measurement
-- at a different granularity, and week 6 deliberately has no after-pulse
-- because the full re-ask covers that ground more thoroughly on the same day.
create table if not exists public.capability_pulses (
  id           uuid        primary key default gen_random_uuid(),
  learner_id   uuid        not null references public.learners(id) on delete cascade,
  week         int         not null check (week between 1 and 6),
  phase        text        not null check (phase in ('before', 'after')),
  -- { "A1": 3, "A2": 2, "A3": 4 } — keyed by capability id, values 1-5.
  ratings      jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);
create unique index if not exists capability_pulses_learner_week_phase
  on public.capability_pulses (learner_id, week, phase);
create index if not exists capability_pulses_week_idx on public.capability_pulses (week, phase);

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
create table if not exists public.feedback (
  id           uuid        primary key default gen_random_uuid(),
  learner_id   uuid        not null references public.learners(id) on delete cascade,
  week         int         not null check (week between 1 and 6),
  landed       text        not null,
  pacing       text        not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
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
alter table public.capability_pulses enable row level security;
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
revoke all on public.capability_pulses from anon, authenticated;
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
