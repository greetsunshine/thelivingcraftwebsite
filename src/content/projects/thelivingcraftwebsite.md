---
title: "The Living Craft Website"
description: "Built in public as a reference implementation. An agentic agent crew (concierge, scribe, archivist) handles enquiries, generates content drafts, and surfaces insights to the owner."
subtitle: "This site — built with Astro + Tailwind + a 5-agent crew"
status: "Live"
statusColor: "emerald"
tag: "Tool"
tagColor: "cyan"
stack: ["Astro", "Tailwind CSS", "Netlify", "Turso", "Claude API"]
links:
  - label: "GitHub"
    href: "https://github.com/thelivingcraft/website"
featured: false
---

## What it is

A professional services website for The Living Craft — built in public as a reference implementation of what a small AI-native practice can look like when the infrastructure is designed intentionally.

Beyond the static pages, the site is backed by a 5-agent autonomous crew:

- **The Orchestrator** — routes all tasks, sequences agents, handles failures
- **The Concierge** — classifies inbound enquiries, enriches with web context, sends first-response emails in the owner's voice
- **The Scribe** — drafts blog posts, LinkedIn content, and newsletter segments from a content calendar
- **The Archivist** — manages the CRM (leads, pipeline stage, enrichment data) in Turso
- **The Listener** — synthesises client feedback, identifies themes, flags testimonial candidates

## What we learned in the first week

The hardest architectural decision was confidence gating for the Concierge. Below a confidence threshold, emails are held and posted to Slack for owner approval. Above it, they send automatically.

Getting the threshold right required reviewing the first 20 auto-sent emails manually. It was higher than we expected — most edge cases were ambiguity about service intent, not about seniority classification.

## Stack decisions

- **Astro** — static output for all public pages, SSR only for `/admin/*`. Zero JS on marketing pages keeps Lighthouse scores above 95.
- **Turso (libSQL)** — SQLite over HTTP. No infra, generous free tier, SQL query capability for the admin dashboard.
- **Claude API direct** — replaced OpenRouter for lower latency and prompt caching (up to 90% cost reduction on stable system prompts).
- **Netlify Forms** — contact form with zero server-side code at MVP. Agent crew triggers from `submission-created` Netlify function.
