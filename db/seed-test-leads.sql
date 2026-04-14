-- Synthetic high-conversion leads for smoke-testing The Marketer.
-- All rows have is_test_data = TRUE so they're easy to purge:
--   DELETE FROM leads WHERE is_test_data = TRUE;
--
-- Run: psql $DATABASE_URL -f db/seed-test-leads.sql
-- Or paste into the Neon SQL editor.

INSERT INTO leads (
  email, name, role_title, company, service_intent, message,
  seniority_score, urgency, pipeline_stage, classification_confidence, is_test_data
) VALUES
  -- 1. Director of AI at a tier-1 bank — governance pain, board pressure, budget confirmed
  ('priya.raman@capitalone.com', 'Priya Raman',
   'Director, AI Platform Engineering', 'Capital One',
   'consulting',
   'We''re under board pressure to ship 3 production agents by Q3 and our governance story is thin. Legal and risk have blocked our last two pilots. Need someone who has actually navigated this at scale — not another Big 4 deck. Budget approved for a 90-day engagement.',
   5, 'high', 'new_lead', 0.94, TRUE),

  -- 2. VP Eng at a retail scaleup — team-formation pain, real hiring signal
  ('marcus.chen@instacart.com', 'Marcus Chen',
   'VP Engineering, Fulfillment Platform', 'Instacart',
   'training',
   'Scaling our AI/agents group from 4 to 20 engineers over the next 6 months. I need my staff+ ICs to go from "LLM-curious" to "can scope and ship an agentic system" in 90 days. Open to a private cohort. Heard about your Amazon Bar Raiser background from someone in my network.',
   5, 'high', 'new_lead', 0.92, TRUE),

  -- 3. Staff Engineer at Google targeting L7 — direct fit for Track C interview prep
  ('j.okafor.swe@gmail.com', 'Jide Okafor',
   'Staff Software Engineer', 'Google',
   'mentoring',
   'L6 at Google looking to interview for L7 at a couple of top AI labs this quarter. I need someone who has been on the hiring side at Google senior loops. Specifically want mock system design + behavioral against the real rubric, not generic LeetCode prep. Timeline: 4-6 weeks.',
   4, 'high', 'new_lead', 0.96, TRUE),

  -- 4. CTO at a series-C AI startup — architecture deep-dive for staff team
  ('dana.rivera@northflow.ai', 'Dana Rivera',
   'CTO & Co-founder', 'Northflow AI',
   'training',
   'Series C, 35 engineers, building workflow automation agents. My staff team is strong on classical ML but shaky on orchestration patterns, memory, and eval loops for agentic systems. Want a focused 4-week architecture intensive for my top 6. Can do live cohort or private.',
   5, 'high', 'new_lead', 0.93, TRUE),

  -- 5. Director at Walmart Global Tech — ex-Walmart network, retail transformation
  ('ramesh.iyer@walmartlabs.com', 'Ramesh Iyer',
   'Director, Applied AI — Customer Experience', 'Walmart Global Tech',
   'consulting',
   'Running the AI adoption roadmap for our customer-facing stack. We have a 90-day window to get executive sign-off on the governance + rollout plan before the next quarterly review. Need a thinking partner who has actually shipped agentic systems inside a Fortune 10, not just advised on slides. Someone mentioned your name in the Walmart alumni circle.',
   4, 'high', 'new_lead', 0.91, TRUE)
ON CONFLICT (email) DO UPDATE SET
  name           = EXCLUDED.name,
  role_title     = EXCLUDED.role_title,
  company        = EXCLUDED.company,
  service_intent = EXCLUDED.service_intent,
  message        = EXCLUDED.message,
  seniority_score = EXCLUDED.seniority_score,
  urgency        = EXCLUDED.urgency,
  is_test_data   = TRUE,
  updated_at     = NOW();
