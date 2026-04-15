-- The Living Craft — Neon (Postgres) schema
-- Run via: psql $DATABASE_URL -f db/schema.sql
-- Or paste into the Neon SQL editor in the web console.

-- ─── Leads ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     TEXT NOT NULL UNIQUE,
  name                      TEXT NOT NULL,
  role_title                TEXT,
  company                   TEXT,
  service_intent            TEXT NOT NULL CHECK (service_intent IN ('training','mentoring','consulting','other')),
  message                   TEXT NOT NULL,
  seniority_score           INTEGER NOT NULL CHECK (seniority_score BETWEEN 1 AND 5),
  urgency                   TEXT NOT NULL CHECK (urgency IN ('high','medium','low')),
  pipeline_stage            TEXT NOT NULL DEFAULT 'new_lead',
  classification_confidence REAL NOT NULL,
  enrichment_json           JSONB,                     -- web enrichment blob (Phase 3)
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Content Drafts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_drafts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  format      TEXT NOT NULL CHECK (format IN ('blog','linkedin','newsletter')),
  topic       TEXT NOT NULL,
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','ready_for_review','approved','published')),
  calendar_id UUID,                                     -- FK → content_calendar.id
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Feedback ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                  UUID REFERENCES leads(id) ON DELETE SET NULL,
  survey_token             TEXT UNIQUE,
  responses_json           JSONB,
  theme_tags               TEXT,                       -- comma-separated themes
  sentiment_score          REAL,                       -- -1.0 to 1.0
  is_testimonial_candidate BOOLEAN NOT NULL DEFAULT FALSE,
  owner_approved           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Agent Runs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_runs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type   TEXT NOT NULL CHECK (trigger_type IN ('form_submission','cron','owner_trigger')),
  agents_invoked TEXT NOT NULL,                        -- comma-separated
  status         TEXT NOT NULL CHECK (status IN ('running','success','failed')),
  error_details  TEXT,
  duration_ms    INTEGER,
  input_ref      TEXT,                                 -- opaque ref (no PII)
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Content Calendar ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_calendar (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_date DATE NOT NULL,
  format         TEXT NOT NULL CHECK (format IN ('blog','linkedin','newsletter')),
  topic          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'planned'
                   CHECK (status IN ('planned','in_progress','drafted','published')),
  draft_id       UUID REFERENCES content_drafts(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Bookings (Cal.com discovery calls) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         UUID REFERENCES leads(id) ON DELETE SET NULL,
  cal_booking_uid TEXT NOT NULL UNIQUE,
  event_type      TEXT,
  scheduled_for   TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ,
  meeting_url     TEXT,
  attendee_email  TEXT NOT NULL,
  attendee_name   TEXT,
  status          TEXT NOT NULL DEFAULT 'confirmed'
                    CHECK (status IN ('confirmed','rescheduled','cancelled')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Track when a lead first booked a discovery call (used by Archivist daily brief)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_contact_booked_at TIMESTAMPTZ;

-- ─── Tasks (shared crew to-do queue) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL CHECK (category IN (
                    'lead_followup','outreach','content_review',
                    'learning','pipeline_review','manual')),
  priority        INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
  assignee        TEXT NOT NULL DEFAULT 'owner' CHECK (assignee IN ('owner','agent')),
  created_by      TEXT NOT NULL,
  related_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  related_url     TEXT,
  due_by          TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','in_progress','done','dismissed','snoozed')),
  snoozed_until   TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  context_json    JSONB,
  dedup_key       TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Target Accounts (Marketer watchlist) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS target_accounts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company        TEXT NOT NULL UNIQUE,
  tier           TEXT NOT NULL DEFAULT 'tier_2'
                   CHECK (tier IN ('tier_1','tier_2','tier_3')),
  why_on_list    TEXT,
  signals_json   JSONB,
  last_checked_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Outreach Drafts (Marketer output) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_drafts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           UUID REFERENCES leads(id) ON DELETE SET NULL,
  target_account_id UUID REFERENCES target_accounts(id) ON DELETE SET NULL,
  channel           TEXT NOT NULL CHECK (channel IN ('email','linkedin')),
  signal_context    TEXT,
  draft_subject     TEXT,
  draft_body        TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'ready_for_review'
                      CHECK (status IN ('ready_for_review','approved','sent','rejected')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fit score added by Marketer's weekly ranking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fit_score INTEGER;

-- Mark synthetic / demo leads so they're easy to filter out of real pipeline
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_test_data BOOLEAN NOT NULL DEFAULT FALSE;

-- Concierge first-reply drafting (Phase 3 auto-reply)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_reply_draft        TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_reply_subject      TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_reply_status       TEXT
  CHECK (first_reply_status IN ('drafted','approved','sent','rejected'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS first_reply_sent_at      TIMESTAMPTZ;

-- ─── Content Calendar expansion (Scribe Phase 1) ────────────────────────────
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS heat_score REAL;
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS enterprise_relevance_score REAL;
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS sources_json JSONB;
ALTER TABLE content_calendar ADD COLUMN IF NOT EXISTS angle TEXT;
-- Add 'proposed' to the status CHECK by dropping and recreating the constraint.
-- Safe to re-run: conditional on constraint existing with old definition.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name LIKE '%content_calendar_status_check%'
      AND check_clause NOT LIKE '%proposed%'
  ) THEN
    ALTER TABLE content_calendar DROP CONSTRAINT content_calendar_status_check;
    ALTER TABLE content_calendar ADD CONSTRAINT content_calendar_status_check
      CHECK (status IN ('proposed','planned','in_progress','drafted','published'));
  END IF;
END $$;

-- ─── Reading List (Scribe Intelligence Phase) ──────────────────────────────
CREATE TABLE IF NOT EXISTS reading_list (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  url               TEXT NOT NULL,
  source            TEXT,                                 -- publisher / site name
  author            TEXT,
  published_date    DATE,
  category          TEXT NOT NULL CHECK (category IN ('technical','business')),
  subcategory       TEXT,                                 -- e.g. 'design_patterns','governance','model_release'
  why_it_matters    TEXT NOT NULL,                        -- 1-2 sentence "so what" for Sunil
  relevance_score   REAL NOT NULL,                        -- 0.0-1.0
  status            TEXT NOT NULL DEFAULT 'unread'
                      CHECK (status IN ('unread','reading','read','archived','dismissed')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (url)
);

CREATE INDEX IF NOT EXISTS idx_reading_list_status      ON reading_list (status);
CREATE INDEX IF NOT EXISTS idx_reading_list_category    ON reading_list (category);
CREATE INDEX IF NOT EXISTS idx_reading_list_relevance   ON reading_list (relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_reading_list_created_at  ON reading_list (created_at DESC);

-- ─── Agent Costs (monthly budget guard) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_costs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name    TEXT NOT NULL,
  model         TEXT NOT NULL,
  input_tokens  INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd      REAL NOT NULL DEFAULT 0,
  run_id        UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage  ON leads (pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_service_intent  ON leads (service_intent);
CREATE INDEX IF NOT EXISTS idx_leads_created_at      ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_drafts_status ON content_drafts (status);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at ON agent_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_for ON bookings (scheduled_for);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id      ON bookings (lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_attendee     ON bookings (attendee_email);
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON tasks (status, priority) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_tasks_category        ON tasks (category);
CREATE INDEX IF NOT EXISTS idx_tasks_related_lead    ON tasks (related_lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_snoozed_until   ON tasks (snoozed_until) WHERE status = 'snoozed';
CREATE INDEX IF NOT EXISTS idx_outreach_drafts_status ON outreach_drafts (status);
CREATE INDEX IF NOT EXISTS idx_target_accounts_tier  ON target_accounts (tier);
CREATE INDEX IF NOT EXISTS idx_agent_costs_month     ON agent_costs (created_at);
