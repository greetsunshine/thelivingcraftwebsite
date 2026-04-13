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
