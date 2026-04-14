-- Target Accounts seed for The Marketer agent.
-- Run: psql $DATABASE_URL -f db/seed-target-accounts.sql
-- Or paste into the Neon SQL editor.
--
-- Tiers:
--   tier_1 — highest priority; previous-employer ecosystems + known AI-forward F500s
--   tier_2 — F500 / scale-ups actively investing in AI
--   tier_3 — promising but less confirmed signal
--
-- Each row is a prompt for Marketer: "watch this company for signals."
-- Edit why_on_list to reflect YOUR angle on each account.
-- Add/remove rows as your network and ICP evolve.

INSERT INTO target_accounts (company, tier, why_on_list) VALUES
  -- ── Tier 1: previous-employer networks + known AI champions ──────────────
  ('Google',        'tier_1', 'Ex-Google network. AI-first org, Gemini platform adoption. Watch for new AI engineering leadership hires and enterprise GA launches.'),
  ('Amazon',        'tier_1', 'Ex-Amazon network. Bedrock + AWS AI announcements. Watch re:Invent season and VP-level AI org moves.'),
  ('Walmart',       'tier_1', 'Ex-Walmart network. Retail AI transformation underway; large Global Tech org actively hiring AI leaders.'),
  ('Cognizant',     'tier_1', 'Ex-Cognizant network. AI services play + internal transformation needs.'),
  ('Microsoft',     'tier_1', 'Azure + Copilot enterprise adoption. Watch for AI center-of-excellence hires and customer-facing AI transformation announcements.'),
  ('Anthropic',     'tier_1', 'Direct partner signal — Claude ecosystem. Watch for enterprise GTM hires.'),
  ('OpenAI',        'tier_1', 'Enterprise GTM ramp. Watch for F500-facing hires.'),

  -- ── Tier 2: F500 / scale-ups with AI mandate ─────────────────────────────
  ('Target',        'tier_2', 'Retail AI transformation; comparable to Walmart. Watch for Head of AI Engineering hires.'),
  ('Home Depot',    'tier_2', 'Retail ops AI; large tech org.'),
  ('Lowes',         'tier_2', 'Retail AI catching up to Home Depot — hiring signal potential.'),
  ('JPMorgan',      'tier_2', 'Large AI research + deployment org. Watch managing-director AI announcements.'),
  ('Goldman Sachs', 'tier_2', 'AI governance and platform play; conservative adopter — when they move it is a strong signal.'),
  ('Capital One',   'tier_2', 'Tech-forward bank; strong engineering culture and AI investment.'),
  ('Mastercard',    'tier_2', 'Payments AI + data platform modernization.'),
  ('Visa',          'tier_2', 'Fraud AI + agentic risk systems.'),
  ('Salesforce',    'tier_2', 'Agentforce push — enterprise agentic at scale; strong signal source.'),
  ('ServiceNow',    'tier_2', 'Now Assist rollout; enterprise agentic workflows.'),
  ('Workday',       'tier_2', 'HR/finance AI agent rollout.'),
  ('Adobe',         'tier_2', 'Firefly + enterprise creative AI.'),
  ('Cisco',         'tier_2', 'Network AI + Splunk integration; large transformation surface area.'),
  ('Databricks',    'tier_2', 'Mosaic + Agent Bricks — direct agentic play; partner signal.'),
  ('Snowflake',     'tier_2', 'Cortex + agentic data workflows.'),
  ('NVIDIA',        'tier_2', 'Enterprise AI platform; hiring signal for AI leadership across F500 customers.'),
  ('Accenture',     'tier_2', 'Services firm with massive AI bench — partner or competitor depending on framing.'),
  ('Deloitte',      'tier_2', 'Big 4 AI services; hiring senior practitioners.'),

  -- ── Tier 3: high potential, watch lightly ────────────────────────────────
  ('Meta',          'tier_3', 'Llama ecosystem; research-heavy, less enterprise-consulting fit but senior network there.'),
  ('Apple',         'tier_3', 'Intelligence platform; harder to break into, low info flow.'),
  ('Netflix',       'tier_3', 'ML leader but small tech org; low outreach surface.'),
  ('Stripe',        'tier_3', 'Infra AI adoption; strong engineering brand.'),
  ('Shopify',       'tier_3', 'Merchant AI + Sidekick; agentic commerce angle.')
ON CONFLICT (company) DO UPDATE SET
  tier        = EXCLUDED.tier,
  why_on_list = EXCLUDED.why_on_list,
  updated_at  = NOW();
