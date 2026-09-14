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
-- 24-byte random code from /craft/admin/learners when someone accepts a seat, and
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
  -- not confirm about its own finding. Never rendered outside /craft/admin.
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
-- Booking — availability rules, blocked time, and booked calls
-- ---------------------------------------------------------------------------
-- The site owns the calendar, not Google. Availability is computed from the
-- rules below, never read back from a Google Calendar free/busy query. That is
-- a deliberate choice with a real consequence: an event Sunil puts directly in
-- his own calendar does NOT close the slot here. Blocking time is an entry in
-- `booking_blocks`, and nothing else.
--
-- Google still receives every booking, because a call nobody gets an invite for
-- is a call nobody attends. The flow is one-way: this table is the truth, and
-- `google_event_id` is the receipt for what was pushed out.
--
-- Meeting TYPES (name, duration, which page shows them) are not here. They live
-- in src/data/meetings.ts, next to the page copy they belong to, because a
-- 30-minute discovery call is an offer fact and offer facts are code here.

-- Weekly availability. One row per band of time on one weekday, in the host's
-- own timezone. "Tuesdays, 16:00 to 18:00" is a single row, and the slot
-- generator cuts it into bookable times using the meeting's duration.
--
-- Minutes from midnight rather than a `time` column: the arithmetic that turns
-- a band into slots is integer arithmetic, and pulling `time` values into JS
-- only to parse them back into minutes was a conversion with nothing to gain.
create table if not exists public.booking_rules (
  id           uuid        primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  -- Matches a `key` in src/data/meetings.ts. Unvalidated on purpose: a rule for
  -- a type that no longer exists generates nothing, which is the safe failure.
  meeting_type text        not null,
  -- 0 = Sunday, to match JavaScript's getDay(). The generator reads the weekday
  -- in the HOST timezone, so this never drifts against the visitor's Monday.
  weekday      int         not null check (weekday between 0 and 6),
  start_min    int         not null check (start_min between 0 and 1439),
  end_min      int         not null check (end_min between 1 and 1440),
  active       boolean     not null default true,
  updated_at   timestamptz not null default now(),
  -- A band that ends before it starts silently produces no slots, and looks
  -- like a rule that is working. Rejected at the door instead.
  constraint booking_rules_band check (end_min > start_min)
);

create index if not exists booking_rules_type_idx on public.booking_rules (meeting_type, weekday);

-- Time taken out of the rules: leave, travel, a conference, a single afternoon.
-- Stored as an instant range rather than a date so a half-day works without a
-- second shape. An all-day block is midnight to midnight in the host timezone,
-- and the console writes it that way.
create table if not exists public.booking_blocks (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  reason      text,
  constraint booking_blocks_range check (ends_at > starts_at)
);

create index if not exists booking_blocks_range_idx on public.booking_blocks (starts_at, ends_at);

-- One row per booked call.
--
-- `manage_token_hash` is an HMAC of the token in the reschedule link, so the
-- database never holds a credential that opens anything — the same reasoning as
-- `learners.code_hash`. Losing this table to a leak does not let anyone move
-- somebody else's call.
create table if not exists public.bookings (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  meeting_type      text        not null,
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  name              text,
  email             text        not null,
  company           text,
  role              text,
  notes             text,
  -- The IANA zone the booker was in when they chose. Kept so a confirmation or
  -- a proposed alternative is shown back in their own time, not in ours.
  timezone          text,
  status            text        not null default 'confirmed',
  -- Set for a booking made inside /craft. Null for a public enquiry. ON DELETE
  -- SET NULL rather than CASCADE: erasing a learner must not silently delete
  -- the record of a call that happened.
  learner_id        uuid        references public.learners (id) on delete set null,
  manage_token_hash text        not null,
  google_event_id   text,
  google_meet_url   text,
  -- Why the calendar push failed, if it did. A booking with a sync error is
  -- confirmed on this site and invisible in Google, which is the one state that
  -- needs to be loud in the console.
  google_error      text,
  -- Alternatives offered when Sunil asks to move a call. Array of ISO instants.
  proposed_slots    jsonb,
  cancelled_reason  text,
  admin_note        text,
  updated_at        timestamptz not null default now()
);

create index if not exists bookings_starts_idx on public.bookings (starts_at desc);
create index if not exists bookings_status_idx on public.bookings (status, starts_at desc);
create index if not exists bookings_email_idx on public.bookings (lower(email));

-- THE DOUBLE-BOOKING GUARD, and the reason it is in Postgres rather than in the
-- API route. Two people pressing Confirm on the same slot in the same second
-- both pass a "is this slot free?" SELECT, and both then INSERT. Checking in
-- TypeScript cannot close that window; a constraint can, because the second
-- INSERT is refused by the database itself.
--
-- 'reschedule_requested' still holds its time: asking someone to move a call
-- does not release the original slot until they actually move.
--
-- No btree_gist extension needed: the constraint compares one range against one
-- range, and gist handles tstzrange out of the box. It would only be required
-- to add a scalar column to the key, and there is deliberately no such column —
-- two calls of different types at the same hour are still one person.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_no_overlap') then
    alter table public.bookings
      add constraint bookings_no_overlap
      exclude using gist (tstzrange(starts_at, ends_at) with &&)
      where (status in ('confirmed', 'reschedule_requested'));
  end if;
end
$$;

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
alter table public.radar_findings enable row level security;
alter table public.radar_runs     enable row level security;
alter table public.booking_rules  enable row level security;
alter table public.booking_blocks enable row level security;
alter table public.bookings       enable row level security;

revoke all on public.events    from anon, authenticated;
revoke all on public.leads     from anon, authenticated;
revoke all on public.questions from anon, authenticated;
revoke all on public.learners  from anon, authenticated;
revoke all on public.intake_responses from anon, authenticated;
revoke all on public.radar_findings from anon, authenticated;
revoke all on public.radar_runs     from anon, authenticated;
revoke all on public.booking_rules  from anon, authenticated;
revoke all on public.booking_blocks from anon, authenticated;
revoke all on public.bookings       from anon, authenticated;

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

drop trigger if exists radar_touch on public.radar_findings;
create trigger radar_touch before update on public.radar_findings
  for each row execute function public.touch_updated_at();

drop trigger if exists booking_rules_touch on public.booking_rules;
create trigger booking_rules_touch before update on public.booking_rules
  for each row execute function public.touch_updated_at();

-- Bookings are never purged on a timer, for the same reason leads are not: a
-- call that happened is a record of the practice, and a cron job must not be
-- able to delete one. Erasure is per person and deliberate, from the console.
drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch before update on public.bookings
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
--              deliberate: the Erase button on /craft/admin/leads.
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
-- Until then it is the button on /craft/admin — which means the policy is only real
-- if someone presses it.
