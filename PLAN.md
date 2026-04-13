# The Living Craft — Website & Agent Crew Plan

**Brand:** The Living Craft  
**Stack:** Astro v6.1.4 · Tailwind CSS v3.4.19 · Netlify  
**Audience:** Engineering Managers · Architects · Staff/Principal Engineers · CTOs · VPs Engineering

### Core Principle: Ultra Fast Learning

> "The most dangerous gap in AI isn't knowledge — it's the speed at which leaders can act on it."

Ultra fast learning is the through-line of everything The Living Craft delivers. The audience is experienced, time-constrained, and impatient with slow ramps. Every service, every page, every content format is designed around a single question: **how fast can this person go from zero context to confident action?**

This manifests differently per service:
- **Training** — compressed, application-first cohorts. No theory without an immediate use case.
- **Mentoring** — accelerated transformation arcs. Compress years of leadership growth into a 90-day sprint.
- **Consulting** — rapid organizational learning loops. Ship a working framework in weeks, not quarters.
- **Blog & Projects** — distilled insights. Every post must be usable the day it is read.

This principle drives UX decisions (scan-first layouts, no filler), content decisions (specific outcomes over abstract concepts), and agent crew design (tight feedback loops that surface what clients need faster).

---

## Table of Contents

1. [Service Pillars](#1-service-pillars)
2. [Site Map](#2-site-map)
3. [Page Content Plan](#3-page-content-plan)
4. [Component Inventory](#4-component-inventory)
5. [Navigation Structure](#5-navigation-structure)
6. [Visual & UX Principles](#6-visual--ux-principles)
7. [SEO Strategy](#7-seo-strategy)
8. [Agent Crew Architecture](#8-agent-crew-architecture)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. Service Pillars

| Pillar | Target Problem | Ultra Fast Learning Angle | Audience |
|--------|---------------|--------------------------|----------|
| **Training on Agentic AI** | Teams experimenting but not shipping; leaders lacking AI implementation strategy | Application-first cohorts — every session produces a usable artifact, not notes | EMs, Architects, Staff Engineers, CTOs |
| **Mentoring & Coaching** | Career transformation — moving into AI leadership roles | Compress a 2-year leadership growth arc into a 90-day structured sprint | Senior Engineers, Managers |
| **Consulting** | Governance gaps, inability to quantify AI ROI, stalled adoption | Rapid org learning loops — working governance framework in weeks, not quarters | VPs, CTOs, Directors |
| **Blog & Projects** | Staying current with practitioner-grade thinking, not tutorials | Distilled field notes — every post is actionable the day it is read | All senior technical roles |
| **Projects** | Interesting ideas requiring senior-level guidance to build together | Learn by building — join a real project to compress implementation learning | All Innovators |
---

## 2. Site Map

### MVP (9 pages)

```
/                           Home
/training/                  Training on Agentic AI (pillar hub)
/mentoring/                 Mentoring & Coaching (pillar hub)
/consulting/                Consulting (pillar hub)
/blog/                      Blog index
/blog/[slug]                Individual blog post
/projects/                  Projects showcase
/projects/[slug]            Individual project detail
/about/                     About
/contact/                   Contact / Intake form
/privacy/                   Privacy policy
/terms/                     Terms of service
```

### Phase 2 additions

```
/training/agentic-strategy/     Course: Agentic AI Project Strategy
/training/team-formation/       Course: Building Agentic Teams
/training/architectures/        Course: Agentic Architectures Deep Dive
/training/implementation/       Course: Managing Implementation Challenges
/admin/                         Owner dashboard (SSR, protected)
/admin/leads/                   Pipeline view
/admin/content/                 Content drafts queue
/admin/feedback/                Feedback & insights
/admin/runs/                    Agent run log
```

---

## 3. Page Content Plan

### 3.1 Home (`/`)

Six sections — qualify and route the visitor, never make them hunt.

**Hero**
- Eyebrow: `PROFESSIONAL SERVICES FOR TECHNICAL LEADERS`
- H1: "Lead the Agentic AI Shift"
- Subhead: "The Living Craft helps Engineering Managers, Architects, and CTOs build the strategy, teams, and governance to ship AI that matters. No tutorials — real-world implementation expertise, designed for ultra fast learning."
- CTAs: `Explore Training` (primary) · `Book a Consultation` (secondary outline)
- Background: subtle radial gradient mesh — no stock photography

**The Gap** _(problem statement)_
- Eyebrow: `THE CHALLENGE`
- H2: "Your team is experimenting. Your org needs results."
- 3 pain-point cards (accent left border):
  - "Agentic AI projects stall at the proof-of-concept stage"
  - "You can't find or form a team that knows what they're doing yet"
  - "The board wants ROI numbers — you need a framework, not a demo"

> **Ultra fast learning anchor:** The Gap section implicitly frames the speed problem — the audience is losing ground every week they spend in experimentation mode. Every pain point card should convey urgency, not just problem description.

**4 Pillars**
- Eyebrow: `HOW WE HELP`
- H2: "Four Ways to Accelerate Your AI Leadership"
- 2×2 card grid — icon, title, 1-sentence value prop, `Learn more →`

**Social Proof**
- Role-title strip in `font-mono`: `Engineering Manager` · `Staff Engineer` · `Principal Architect` · `CTO` · `VP Engineering`
- 2–3 testimonial cards (no photos — initials avatars)

**Blog Teaser**
- Eyebrow: `READ THE LATEST`
- Latest 2 posts as horizontal cards

**Final CTA**
- Full-width `dark-secondary` band
- H2: "Stop waiting for AI clarity. Build it."
- Single button: `Schedule a Discovery Call` → `/contact/`

---

### 3.2 Training (`/training/`)

**Hero**
- H1: "Agentic AI Training for Technical Leaders"
- Subhead: "Leadership-grade programs built for ultra fast learning — not YouTube tutorials. You'll leave with implementation-ready knowledge, frameworks, and a peer cohort of senior engineers doing the same work."

**Differentiators** — 3 columns:
- "Ultra fast learning — every session produces a usable artifact, not just notes"
- "Cohort model — compressed learning alongside peers at your level"
- "Live sessions + async — designed for executives with calendars, not students with time"

> **Ultra fast learning anchor:** Differentiators should explicitly reject the slow ramp. The value prop is time compression — these leaders could learn this over 18 months of trial and error, or in 8–12 weeks of structured cohort work. Make that trade-off explicit.

**4 Course Cards** (2×2 grid):

| Course | For | Key Outcomes | Ultra Fast Learning Design |
|--------|-----|-------------|---------------------------|
| Agentic AI Project Strategy | EMs, PMs, Tech Leads | Define scope, milestones, delivery structure for AI projects that ship | Each session maps to a real project decision the participant faces that week |
| Building Agentic Teams | EMs, CTOs | Hire, form, and structure cross-functional teams for autonomous AI systems | Role templates and hiring rubrics delivered week 1 — usable before cohort ends |
| Agentic Architectures Deep Dive | Staff Engineers, Architects | Orchestration patterns, tool use, memory, evaluation loops | Architecture decision records (ADRs) as the core learning artifact — not slides |
| Managing Implementation Challenges | VPs, CTOs, Senior EMs | Stakeholder alignment, rollout sequencing, incident response for AI | Incident post-mortem simulations in week 2 — learn from synthetic failure before real failure |

**Delivery specs:** `Live Cohorts` · `≤20 Participants` · `8–12 Weeks` · `Application-first Curriculum`

**CTA:** "Not sure which program fits?" → `Book a 30-min scoping call`

---

### 3.3 Mentoring (`/mentoring/`)

**Hero**
- H1: "Career Transformation for Senior Technical Leaders"
- Subhead: "1:1 mentoring designed for ultra fast learning — compress years of AI leadership growth into a structured 90-day arc. Not participation. Transformation."

**Two Tracks** (side-by-side):

| Track | For | Format | Ultra Fast Learning Design |
|-------|-----|--------|---------------------------|
| **A — Engineering to Leadership** | Staff/Principal engineers moving into EM or AI leadership | Bi-weekly sessions · 90-day arc | Concrete leadership reps each fortnight — not reflection, action. Each session ends with a specific thing to do before the next one. |
| **B — Leader to AI Leader** | EMs, Directors, CTOs owning an AI strategy | Monthly strategy sessions + async support | Strategy is stress-tested against real org constraints in session 1 — no generic frameworks handed over |

> **Ultra fast learning anchor:** The 90-day arc is the headline promise. Make the time compression explicit in copy — "What most leaders figure out over 2 years of trial and error, we compress into 90 days of deliberate practice." This is the core differentiator against peer learning, conferences, and self-study.

**Process:** Initial assessment → Gap mapping (week 1) → Bi-weekly sessions with action contracts → Accountability check-ins → Milestone review at day 45 and day 90

**Intake note:** "Spots are limited. I work with a small number of clients at a time to ensure depth, not scale."

**CTA:** `Apply for Mentoring`

---

### 3.4 Consulting (`/consulting/`)

**Hero**
- H1: "Agentic AI Consulting for Organizations That Need to Get It Right"
- Subhead: "Governance frameworks, ROI assessment, and adoption strategy — built with your team, not handed over as a deck. Structured for ultra fast organizational learning."

**3 Engagements:**

| Engagement | Deliverable | Ultra Fast Learning Design |
|-----------|-------------|---------------------------|
| Governance Framework Design | Governance playbook — policies, review processes, risk controls | Team learns by co-building the playbook, not receiving it. Working draft by end of week 2. |
| ROI Assessment & Business Case | Board-ready ROI analysis with defensible model | Finance and engineering aligned in a single structured session — not sequential email threads |
| Agentic AI Adoption Strategy | 90-day sequenced roadmap with org change management | Rapid feedback loop built into the roadmap — checkpoint at day 30, course-correct before day 90 |

> **Ultra fast learning anchor:** Consulting engagements are often slow because the org learns after the consultant leaves. The design principle here is embedded learning — the team builds competence during the engagement, not after it. The deliverable is a capability, not just a document.

**Engagement Models:** Project-based (fixed scope, fixed fee) · Retainer (ongoing advisory — for orgs that want continuous learning loops, not one-off deliverables)

**Process:** Discovery call → Scoping doc → Engagement (with embedded learning milestones) → Deliverable + handoff + retrospective

**CTA:** `Start with a Discovery Call` → `/contact/?source=consulting`

---

### 3.5 Blog (`/blog/`) & Projects (`/projects/`)

- Blog: Astro content collection at `src/content/blog/` — dynamic `/blog/[slug]` route
- Projects: Astro content collection at `src/content/projects/` — dynamic `/projects/[slug]` route
- Blog eyebrow: `PRACTITIONER INSIGHTS`
- Projects eyebrow: `REAL WORK. REAL SYSTEMS.`
- Featured post: large card at top of blog index
- Project cards: tech-tag pills in `font-mono`, outcome metric, `View project →`

> **Ultra fast learning anchor:** Every blog post must pass a "usable today" test — if the reader can't apply something from the post within 48 hours of reading it, the post is too abstract. Posts should lead with the insight, not the backstory. Every project entry should include a "what we learned in the first week" callout — the fastest distillation of hard-won knowledge. Reading time should be surfaced on every card: senior leaders pre-qualify content by the time it costs them.

---

### 3.6 About (`/about/`)

- 2-column hero: bio text left, photo/avatar right
- Credentials timeline (vertical, `font-mono` dates)
- Philosophy section with large pull quote in accent text — **this is where ultra fast learning is stated as a named philosophy**, not just implied. Example pull quote: "The best learning is compressed, applied, and immediately stress-tested. Everything else is entertainment."
- "What I'm working on now" — signals active practitioner, not retired expert
- CTA: `Work with me →` → `/contact/`

---

### 3.7 Contact (`/contact/`)

- H1: "Start the Conversation"
- Netlify Forms with fields: Name, Email, Role/Title, Company, `What are you looking for?` (radio: Training / Mentoring / Consulting / Other), Message
- Note: "I read every message personally."
- LinkedIn link + plain-text email address

---

## 4. Component Inventory

### UI Primitives (build first — everything depends on these)

| Component | Path | Props |
|-----------|------|-------|
| `Button` | `src/components/ui/Button.astro` | `variant: primary\|secondary\|ghost`, `href`, `size: sm\|md\|lg` |
| `Badge` | `src/components/ui/Badge.astro` | `text`, `variant: accent\|neutral` |
| `SectionLabel` | `src/components/ui/SectionLabel.astro` | `text` |
| `SectionContainer` | `src/components/layout/SectionContainer.astro` | `label`, `tight: boolean` |
| `PageHero` | `src/components/layout/PageHero.astro` | `eyebrow`, `title`, `subtitle`, `primaryCta`, `secondaryCta` |
| `TwoColumn` | `src/components/layout/TwoColumn.astro` | `reverse: boolean` |
| `Timeline` | `src/components/ui/Timeline.astro` | `steps: {label, title, description}[]` |
| `StepProcess` | `src/components/ui/StepProcess.astro` | `steps: string[]` |

### Cards

| Component | Path | Used On |
|-----------|------|---------|
| `ServiceCard` | `src/components/cards/ServiceCard.astro` | Home 4-pillar grid |
| `CourseCard` | `src/components/cards/CourseCard.astro` | `/training/` |
| `BlogPostCard` | `src/components/cards/BlogPostCard.astro` | `/blog/` |
| `FeaturedPost` | `src/components/content/FeaturedPost.astro` | `/blog/` hero slot |
| `ProjectCard` | `src/components/cards/ProjectCard.astro` | `/projects/` |
| `TestimonialCard` | `src/components/cards/TestimonialCard.astro` | Home social proof |
| `PainPointCard` | `src/components/cards/PainPointCard.astro` | Home "The Gap" section |

### Navigation & Global

| Component | Path | Notes |
|-----------|------|-------|
| `Navbar` | `src/components/nav/Navbar.astro` | Extract from `BaseLayout.astro` |
| `MobileMenu` | `src/components/nav/MobileMenu.astro` | `<details>` toggle, no JS framework |
| `Footer` | `src/components/Footer.astro` | Extract from `BaseLayout.astro` |

### Data Files

| File | Purpose |
|------|---------|
| `src/data/navigation.ts` | All nav + footer links — single source of truth |
| `src/data/services.ts` | Service pillar objects consumed by home page and footer |

### Admin (Phase 2)

| Component | Path |
|-----------|------|
| `DraftCard` | `src/components/admin/DraftCard.astro` |
| `LeadTable` | `src/components/admin/LeadTable.astro` |
| `FeedbackInsights` | `src/components/admin/FeedbackInsights.astro` |
| `AgentRunLog` | `src/components/admin/AgentRunLog.astro` |

---

## 5. Navigation Structure

### Desktop Nav

```
[The Living Craft]   Training   Mentoring   Consulting   Blog   Projects   About   [Book a Call →]
```

- `[Book a Call →]` is always an accent-filled button (`bg-accent`) — never a plain link
- Sticky with `bg-dark-primary/95 backdrop-blur-sm border-b border-gray-800` — glass effect
- Active page: accent bottom border

### Mobile Nav

- Hamburger → full-screen overlay
- Links listed vertically, 44px minimum tap targets
- Flattened (no nested dropdowns)
- `Book a Call` button full-width at bottom of overlay

### Footer — 4 Columns

```
The Living Craft          Services            Company         Legal
Mission statement         Training            About           Privacy Policy
LinkedIn                  Mentoring           Contact         Terms of Service
                          Consulting          Blog
                          Blog & Projects

© 2026 The Living Craft · "Practitioner-grade AI leadership."
```

---

## 6. Visual & UX Principles

### Color Hierarchy

| Token | Hex | Use |
|-------|-----|-----|
| `dark-primary` | `#0a0a0f` | Page background, footer |
| `dark-secondary` | `#1a1a2e` | Alternating section backgrounds, CTA bands |
| `dark-card` | `#16213e` | Card surfaces, nav dropdown |
| `accent` | `#4f46e5` | Primary buttons, active states, accent borders — **not decorative** |
| `accent-light` | `#6366f1` | Hover states on accent elements, icon fills |

**Section alternation (home page):**
```
Hero          → dark-primary
The Gap       → dark-secondary
4 Pillars     → dark-primary
Social Proof  → dark-secondary
Blog Teaser   → dark-primary
Final CTA     → dark-secondary
```

### Typography

| Element | Style |
|---------|-------|
| H1 (home hero) | Gradient text `from-white to-gray-400`, `text-6xl+`, bold |
| H1 (pillar pages) | White, `text-5xl`, bold, never wraps on mobile |
| H2 (section) | White, `text-4xl`, bold |
| Body | `text-gray-300` — not pure white (reduces eye strain) |
| Eyebrow labels | `text-xs uppercase tracking-widest text-accent` |
| Technical specs | `font-mono text-accent-light` (JetBrains Mono) |
| Card metadata | `text-gray-400 text-sm` |

### Interaction

- Card hover: `hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5`
- Arrow links: `→` translates `+4px` on hover with `transition-transform`
- No load animations — motion is interaction-only
- No carousels — show the 2–3 best options statically

### Premium Signals for Senior Audience

- `py-20–24` between sections — generous whitespace signals quality
- Specific outcome language: "governance playbook", "board-ready ROI analysis", "90-day roadmap"
- `font-mono` for specs: `8 weeks`, `≤20 participants`, `$3,500`
- No stock photography — SVG or abstract geometric backgrounds only
- No vague words: innovative, cutting-edge, revolutionary

### Ultra Fast Learning — UX Expression

The principle must be felt in the interface, not just stated in copy:

- **Scan-first layout:** Every page reveals its full value proposition within the first two screens. Senior leaders decide in seconds whether to keep reading — never bury the point.
- **Reading time on all content:** Blog post cards and project entries display `font-mono` reading time (e.g., `6 min read`). Time is the scarcest resource for this audience.
- **Outcome-first section headers:** Section H2s state what the reader will walk away with, not what the section is about. "You'll leave with a governance playbook" beats "About our consulting process".
- **No progressive disclosure on key facts:** Pricing signals, cohort sizes, and engagement formats are visible on pillar pages without clicking. Friction kills fast learners.
- **"What you'll be able to do" framing:** Course cards and mentoring tracks lead with capability outcomes (`font-mono` bullets: `› Scope an agentic AI project in under a week`), not topic lists.

---

## 7. SEO Strategy

The target audience — CTOs, Engineering Managers, Architects — searches precisely. They use long-tail, problem-specific queries, not broad category terms. Discoverability requires owning the specific language of their problems, not generic AI/leadership keywords.

### 7.1 Keyword Strategy

**Primary keyword clusters (by service pillar):**

| Pillar | Primary Keywords | Long-tail targets |
|--------|-----------------|-------------------|
| Training | `agentic AI training for leaders`, `agentic AI course for engineering managers` | `how to plan an agentic AI project`, `agentic AI team structure`, `agentic architecture course for architects` |
| Mentoring | `AI leadership coaching`, `engineering manager career coaching`, `career transition to AI leadership` | `staff engineer to engineering manager mentoring`, `how to lead AI teams`, `CTO AI strategy mentoring` |
| Consulting | `agentic AI consulting`, `AI governance framework consulting`, `AI ROI assessment` | `how to build an AI governance framework`, `agentic AI adoption strategy`, `AI ROI for engineering teams` |
| Blog | `agentic AI implementation`, `agentic architecture patterns`, `AI project management` | `agentic AI challenges in production`, `how to evaluate agentic AI projects`, `AI team formation best practices` |

**Domain authority angle:** The audience searches for practitioner knowledge, not vendor content. Blog posts targeting "how to" and "what goes wrong with" queries will outperform brand-name landing pages for this cohort.

### 7.2 Technical SEO

**Meta tags — `BaseLayout.astro` props to extend:**
```typescript
interface Props {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;        // absolute URL, 1200×630
  ogType?: 'website' | 'article';
  canonical?: string;
  noindex?: boolean;       // true for /admin/* and /privacy/, /terms/
}
```

**Required `<head>` tags on every page:**
```html
<meta name="description" content="...150 chars max..." />
<meta property="og:title" content="..." />
<meta property="og:description" content="..." />
<meta property="og:image" content="https://thelivingcraft.com/og/home.png" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="canonical" href="https://thelivingcraft.com/..." />
```

**Files to create:**
- `public/robots.txt` — allow all, disallow `/admin/`
- `public/sitemap.xml` — or use `@astrojs/sitemap` integration (auto-generates from Astro routes)
- `public/og/` — pre-generated OG images per pillar page (static PNG, 1200×630)

**`@astrojs/sitemap` integration:** Add to `astro.config.mjs`. Automatically discovers all non-`noindex` pages and generates `/sitemap-index.xml`. Submit to Google Search Console on launch.

### 7.3 Structured Data (JSON-LD)

Structured data enables rich results in Google — course listings, article authorship, organization knowledge panel. Highly relevant for a professional services site with senior technical searchers.

**`Organization` schema — inject in `BaseLayout.astro`:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "The Living Craft",
  "url": "https://thelivingcraft.com",
  "description": "Agentic AI training, mentoring, and consulting for senior technical leaders",
  "founder": { "@type": "Person", "name": "[Owner Name]" },
  "sameAs": ["https://linkedin.com/in/..."]
}
```

**`Course` schema — inject on each `/training/[course]/` page:**
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Agentic AI Project Strategy",
  "description": "...",
  "provider": { "@type": "Organization", "name": "The Living Craft" },
  "educationalLevel": "Advanced",
  "timeRequired": "P8W"
}
```

**`BlogPosting` schema — inject in `/blog/[slug].astro` from frontmatter:**
```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "...",
  "datePublished": "2026-04-10",
  "author": { "@type": "Person", "name": "[Owner Name]" },
  "publisher": { "@type": "Organization", "name": "The Living Craft" }
}
```

**`Person` schema — inject on `/about/`:**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "[Owner Name]",
  "jobTitle": "Agentic AI Consultant & Trainer",
  "url": "https://thelivingcraft.com/about/",
  "sameAs": ["https://linkedin.com/in/..."]
}
```

### 7.4 Content SEO — Blog as Primary Discovery Engine

The blog is the highest-leverage SEO surface. Service pages rank slowly. Blog posts targeting specific problem queries can rank in weeks.

**Content pillars mapped to search intent:**

| Pillar | Search intent | Example post titles |
|--------|--------------|---------------------|
| Agentic AI implementation | Informational / how-to | "How to structure an agentic AI project from scratch", "The 5 architecture decisions that determine whether agents work in production" |
| AI team leadership | Informational / career | "What an engineering manager needs to know about agentic AI (that nobody tells you)", "How to hire your first agentic AI engineer" |
| AI governance & ROI | Informational / business | "How to build an AI governance framework in 30 days", "The ROI calculation your board actually wants for AI projects" |
| Ultra fast learning in AI | Thought leadership | "Why AI leaders who learn slowly get replaced", "The 90-day arc: how to go from AI spectator to AI leader" |

**Content SEO rules for all blog posts:**
- Title: target keyword in first 60 characters
- Meta description: 150 characters, includes primary keyword, ends with a value hook
- H2s: use question formats (`How do you...`, `What is...`) to capture featured snippet slots
- Internal linking: every post links to at least one service pillar page that is relevant to the topic
- Word count: 1,200–2,500 words for evergreen posts; short (600–800) for opinion/insight posts
- Image alt text: descriptive, keyword-adjacent, no keyword stuffing

### 7.5 Performance SEO (Core Web Vitals)

Astro's static output gives a significant head start. Maintain it:

- **LCP (Largest Contentful Paint):** Hero sections use no large images — gradient backgrounds only. Target < 1.5s.
- **CLS (Cumulative Layout Shift):** Declare explicit `width` and `height` on all `<Image />` components. Use `font-display: swap` on Google Fonts (already standard in Astro's `<link>` preload pattern).
- **INP (Interaction to Next Paint):** No heavy client-side JS. Admin dashboard is the only SSR surface — acceptable for a non-public route.
- **Preload critical fonts:** Google Fonts `<link rel="preload">` is already in `BaseLayout.astro`. Verify the `crossorigin` attribute is set correctly.

**Target scores:** Lighthouse performance ≥ 95 on all public pages. Use `astro build && npx lighthouse` in CI to catch regressions.

### 7.6 Authority & Link Building

For a professional services brand targeting senior technical audiences:

- **LinkedIn as primary distribution:** Every blog post published as a LinkedIn article excerpt (Scribe agent produces this variant automatically). LinkedIn content indexes in Google and reaches the exact audience.
- **Guest posts:** Target publications read by EMs and CTOs: LeadDev, The Pragmatic Engineer newsletter, InfoQ. These earn high-authority backlinks and direct referral traffic.
- **Speak-to-rank:** Conference talks and podcast appearances drive branded search volume. Add a `/speaking/` page (Phase 7) that lists past and upcoming appearances — this page itself earns links from event organizers.
- **Internal linking discipline:** Every service page links to 2–3 related blog posts. Every blog post links to the most relevant service page. This distributes page authority and keeps visitors in the funnel.

### 7.7 SEO Component

Add `src/components/SEO.astro` — a single component injected in `BaseLayout.astro` that accepts all metadata props and renders the full `<head>` SEO block including JSON-LD. This keeps meta tag logic out of every individual page.

```
src/components/SEO.astro     Props: title, description, og*, canonical, noindex, schema (JSON-LD object)
```

### 7.8 Analytics & Search Console

- **Google Search Console:** Submit sitemap on launch day. Monitor keyword impressions weekly — the Scribe agent can pull GSC data via API and include it in the Monday content brief to prioritize topics with growing impressions.
- **Plausible Analytics** (Phase 7): Privacy-first, no cookie banner, GDPR-compliant. Appropriate for a professional audience that notices and dislikes surveillance tracking. Lightweight script (~1KB) has zero Core Web Vitals impact.
- **No Google Analytics:** GA4 requires a cookie banner in the EU and adds ~17KB of script. For this audience and brand positioning, Plausible is the right choice.

---

## 8. Agent Crew Architecture

The site is backed by an autonomous crew of 5 AI agents that handle inbound queries, content marketing, CRM, and feedback — so the practice runs without adding headcount.

> **Ultra fast learning anchor:** The agent crew itself is a live demonstration of the practice's philosophy. The Listener closes the feedback loop faster than any human process could — surfacing what clients struggle with, what content resonates, and what programs need adjustment, in days rather than quarters. The Scribe ensures the owner's insights reach the audience at the speed they are formed, not on a editorial publishing delay. The crew is the principle in operation.

### 7.1 The 5 Agents

| Agent | Model | Role |
|-------|-------|------|
| **The Orchestrator** | `claude-opus-4-6` | Entry point for all work — routes tasks, sequences agents, handles failures, escalates to owner via Slack |
| **The Concierge** | `claude-opus-4-6` | Inbound lead handling — classifies seniority & intent, web-enriches context, sends first-response email in owner's voice |
| **The Scribe** | `claude-sonnet-4-6` | Content creation — weekly blog drafts, LinkedIn post variants (3 angles), newsletter segments |
| **The Archivist** | `claude-haiku-4-5` | CRM & pipeline — lead records, deduplication, weekly pipeline summary to Slack |
| **The Listener** | `claude-sonnet-4-6` | Feedback — post-engagement surveys, theme synthesis, monthly insight brief, testimonial pipeline. **Closes the ultra fast learning loop** by surfacing what clients actually struggled with before the next cohort or engagement starts. |

Model tier rationale: Opus where the output faces prospects or requires judgment. Sonnet for quality prose at volume. Haiku for bookkeeping. Cost is bounded.

### 7.2 Trigger Surfaces

**Event-driven — Contact Form Submission**
```
Netlify Form submission
  → netlify/functions/submission-created.ts  (Netlify magic name, invoked automatically)
  → returns 200 immediately
  → Orchestrator runs async in Netlify Background Function (15-min timeout)
  → Concierge → Archivist → (Slack notification)
```

**Scheduled Cron** (`netlify.toml [[cron]]` entries)
```
Monday    07:00 UTC  → Scribe: review content calendar, draft week's content
Friday    08:00 UTC  → Archivist: send pipeline summary to Slack
1st/month 09:00 UTC  → Listener: synthesize feedback, generate insight brief
*/5 min              → Health check (lightweight ping)
```

**Owner-Triggered — Admin Dashboard**
```
POST /api/agents/trigger  { agentId, task, params }
  → Orchestrator constructs task graph
  → Target agent runs
  → Output lands in admin dashboard (draft queue, lead view, etc.)
```

### 7.3 Agent-to-Agent Communication

Direct sequential calls within the same execution context — no message queue at this scale:

```typescript
// Orchestrator inner loop (pseudo-code)
const conciergeResult = await invokeAgent('concierge', { lead: formPayload });

const [archivistResult, slackResult] = await Promise.all([
  invokeAgent('archivist', { action: 'write', data: conciergeResult.enrichedLead }),
  invokeAgent('notifier', { message: conciergeResult.ownerSummary }),
]);
```

Introduce Upstash QStash as a durable task queue only if async multi-step flows spanning hours are needed (e.g., drip email sequences). Architecture is designed to make that migration a seam, not a rewrite.

### 7.4 Tool Inventory

**Concierge tools**

| Tool | Action | Service |
|------|--------|---------|
| `classify_lead` | Score seniority (1–5), intent (service line), urgency | Internal LLM inference |
| `enrich_lead_web` | Fetch LinkedIn/company context | Brave Search API |
| `send_email` | Send personalized first-response as owner | Resend API |
| `write_crm_record` | Create/update lead in DB | Turso |
| `notify_owner_slack` | Post lead summary card | Slack Webhook |

**Scribe tools**

| Tool | Action | Service |
|------|--------|---------|
| `search_web_for_research` | Fetch current context on a topic | Brave Search API |
| `read_content_calendar` | Read upcoming scheduled topics | Turso |
| `write_draft_to_store` | Save draft with status `draft` | Turso |
| `publish_to_cms_queue` | Mark draft `ready_for_review` | Turso |
| `log_content_produced` | Append to content log | Turso |

> **Ultra fast learning anchor for Scribe:** The Scribe system prompt must encode the "usable today" content standard. Every blog draft it produces should have: a lead insight in the first paragraph (no warm-up), a concrete takeaway before the 500-word mark, and a "what to do with this" closing section. The Scribe is not just generating content — it is enforcing the ultra fast learning content standard at production speed.

**Archivist tools:** `read_crm_record`, `write_crm_record`, `query_pipeline_stats`, `send_slack_summary`

**Listener tools:** `send_survey_email`, `read_feedback_store`, `write_feedback_store`, `synthesize_themes`, `write_insight_report`, `flag_testimonial`

**Orchestrator tools:** `invoke_agent`, `read_run_log`, `write_run_log`, `send_owner_approval_request`, `check_agent_health`

### 7.5 Data Layer — Turso (libSQL)

SQLite over libSQL with a Netlify-compatible HTTP API. Zero infra, generous free tier (1GB storage, 1B row reads/month), SQL query capability.

**Tables:**

```sql
leads               -- Lead records: email, title, company, seniority_score,
                    -- service_intent, urgency, pipeline_stage, enrichment_json

content_drafts      -- Blog/LinkedIn/newsletter drafts: format, topic, body,
                    -- status (draft → ready_for_review → approved → published)

feedback            -- Survey responses: theme_tags, sentiment_score,
                    -- is_testimonial_candidate, owner_approved

agent_runs          -- Audit log: trigger_type, agents_invoked, status,
                    -- error_details, duration_ms

content_calendar    -- Planned topics: scheduled_date, format, status, draft_id
```

### 7.6 New Integrations Required

| Service | Purpose |
|---------|---------|
| Anthropic API (direct) | All agent LLM calls — replace OpenRouter |
| Turso | Persistent data layer |
| Resend | Transactional email |
| Brave Search API | Web grounding for Concierge + Scribe |
| Slack Incoming Webhook | Owner notifications |
| Upstash Redis | Rate limiting on webhook endpoint |

### 7.7 Astro Configuration Changes

```javascript
// astro.config.mjs
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'hybrid',          // static pages + SSR for /admin/*
  adapter: netlify({ edgeMiddleware: true }),
  integrations: [tailwind()],
});
```

### 7.8 New File Structure

```
netlify/
  functions/
    submission-created.ts       ← Netlify magic name: auto-invoked on form POST
  edge-functions/
    webhooks/
      form-submission.ts
    agents/
      orchestrator.ts
      concierge.ts
      scribe.ts
      archivist.ts
      listener.ts
    cron/
      content-schedule.ts       ← Monday
      weekly-pipeline.ts        ← Friday
      monthly-synthesis.ts      ← 1st of month
    lib/
      turso-client.ts
      anthropic-client.ts
      agent-loop.ts             ← Reusable agentic tool-use loop
      tool-executor.ts
      prompts/
        concierge.ts
        scribe.ts
        archivist.ts
        listener.ts
        orchestrator.ts

src/
  pages/
    admin/
      index.astro               ← prerender: false (SSR, bearer token protected)
      leads.astro
      content.astro
      feedback.astro
      runs.astro
    api/
      agents/
        trigger.ts
      feedback/
        submit.ts
      health.ts
```

### 7.9 Human-in-the-Loop Gates

- Concierge holds emails if classification confidence < 0.8 — posts approve/send buttons to owner Slack
- All Scribe output lands in `draft` status — nothing auto-publishes; owner is the publication gate
- Listener flags testimonial candidates — owner approves before they appear on the site
- Every sent email is stored verbatim in Turso — immutable audit trail

### 7.10 Key Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Brand voice corruption with prospects | Concierge system prompt: never quote prices, never confirm availability. Confidence gate holds emails for owner review. Owner reviews first 20 before gate opens. |
| Runaway API cost from spam | Netlify spam filtering (honeypot + reCAPTCHA), rate limiter (10 Orchestrator calls/hour/IP), Anthropic console usage cap, `max_tokens` ceilings per agent |
| Content factual drift (fast-moving AI field) | Brave Search grounding, all content in `draft` status, 30-day freshness flag on stale drafts |
| Data privacy (PII in lead records) | Bearer token on admin routes, Turso credentials as Netlify secrets only, no PII in agent run logs (UUID references only) |
| Edge function timeouts (Opus calls can take 60–90s) | Use Netlify Background Functions (15-min timeout), return 200 immediately and work async |
| Vendor concentration on OpenRouter | Switch to direct Anthropic API — lower latency, prompt caching (up to 90% cost reduction on stable system prompts), no markup |

### 7.11 New Packages

```bash
npm install @astrojs/netlify @anthropic-ai/sdk @libsql/client resend @upstash/redis
```

---

## 9. Implementation Phases

### Phase 1 — Website MVP (Weeks 1–2)

**Goal:** Credible, professional 9-page site that can receive inbound leads and is SEO-ready from day one.

1. Structural cleanup: delete unused `Layout.astro`, extract `Navbar.astro` + `Footer.astro` from `BaseLayout.astro`, create `src/data/navigation.ts`
2. Build UI primitives: `Button`, `Badge`, `SectionLabel`, `SectionContainer`, `PageHero`
3. Build `SEO.astro` component — all meta tags, OG tags, JSON-LD schema, canonical URL in one place
4. Extend `BaseLayout.astro` with full SEO props; inject `Organization` JSON-LD globally
5. Rebuild `index.astro` — 6-section home page using new component system
6. Build pillar hub pages: `/training/`, `/mentoring/`, `/consulting/` — each with unique `title`, `description`, and `Course`/`Service` JSON-LD
7. Set up Astro content collections (`src/content/config.ts`) → `/blog/[slug]` + `/projects/[slug]` + 2–3 seed posts (each with full SEO frontmatter)
8. Build `/about/` (with `Person` JSON-LD) and `/contact/` (Netlify Forms — zero backend)
9. Add `@astrojs/sitemap` integration → auto-generates `/sitemap-index.xml`
10. Create `public/robots.txt` — allow all, disallow `/admin/`
11. Wire all nav/footer links, update copyright to 2026, add mobile menu
12. Generate OG images for each pillar page (`public/og/*.png`)

**Validation:** Fully navigable site, contact form submits, Lighthouse ≥ 95, sitemap accessible at `/sitemap-index.xml`, JSON-LD valid in Google's Rich Results Test.

### Phase 2 — Agent Foundation (Weeks 3–4)

**Goal:** Concierge responds to real leads, owner sees pipeline in admin dashboard.

1. Install `@astrojs/netlify` adapter, switch to `output: 'hybrid'`
2. Provision Turso, run DDL schema, add all env vars to Netlify
3. Build `lib/turso-client.ts`, `lib/anthropic-client.ts`, `lib/agent-loop.ts`
4. Build Archivist agent (DB reads/writes only — simplest first)
5. Build `submission-created.ts` Netlify function bridge
6. Build Concierge agent with `classify_lead` + `write_crm_record` only (no email yet)
7. Build minimal admin dashboard (`/admin/leads.astro`) — SSR, bearer token protected

**Validation:** Form submission → lead record in Turso with classification → visible in admin dashboard.

### Phase 3 — Outbound Voice (Weeks 5–6)

**Goal:** Leads receive a real first-response email; owner gets Slack notification for hot leads.

1. Add Resend, Slack, Brave Search integrations + env vars
2. Upgrade Concierge with all 5 tools (enrich + email + Slack)
3. Build Orchestrator, wire as entry point in `submission-created.ts`
4. Write Concierge system prompt with owner's voice, service descriptions, pricing guardrails
5. Build confidence gate: hold emails < 0.8 confidence, post approve/send to Slack

**Validation:** Form submit → Slack notification within 60s → personalized email sent → lead classified correctly.

### Phase 4 — Content Engine (Weeks 7–8)

**Goal:** Scribe producing weekly content drafts visible in admin for owner approval.

1. Build Scribe agent with all 5 tools
2. Write Scribe system prompt with editorial voice, content pillars, audience persona
3. Add Monday cron entry in `netlify.toml`, build `cron/content-schedule.ts`
4. Seed `content_calendar` table with 8 weeks of planned topics
5. Build `/admin/content.astro` — draft cards with approve/reject actions

**Validation:** Monday cron fires → blog draft + 2 LinkedIn variants in admin dashboard before 9am.

### Phase 5 — Feedback Loop (Weeks 9–10)

**Goal:** Listener closing the ultra fast learning loop — surfacing client struggles before the next cohort or engagement begins, so programs improve continuously.

1. Build Listener agent with all 6 tools
2. Survey email template + unique token URL (`/survey?token=xxx`)
3. Build `/api/feedback/submit.ts` edge function
4. Add 1st-of-month cron entry, build `cron/monthly-synthesis.ts`
5. Build `/admin/feedback.astro` — theme view + testimonial flagging
6. Owner-approval workflow → approved testimonials render on service pages

**Validation:** Test feedback entry → synthesized report in admin → testimonial candidate flagged.

### Phase 6 — Hardening (Weeks 11–12)

**Goal:** Production-grade reliability, cost controls, and monitoring.

1. Confidence scoring + human-in-the-loop gates for Concierge
2. Agent run log dashboard (`/admin/runs.astro`)
3. Retry logic in agent loop (max 2 retries, exponential backoff)
4. Rate limiting on webhook endpoint (Upstash Redis)
5. Anthropic token usage logging to Turso per run — cost visibility
6. Slack alert if weekly token spend exceeds threshold

### Phase 7 — Growth (Weeks 13+)

- **Training sub-pages:** Individual course detail pages at `/training/[course]/` — each with `Course` JSON-LD and keyword-targeted title/description
- **Blog tag filtering:** Static tag links + minimal client-side `data-tag` filtering
- **GSC integration for Scribe:** Pull Google Search Console impressions via API into the Monday content brief — Scribe prioritizes topics with growing impressions and low click-through rates (easy ranking wins)
- **Speaking page:** `/speaking/` — lists past and upcoming conference talks and podcast appearances; earns backlinks from event organizers and drives branded search volume
- **Newsletter:** ConvertKit or Buttondown embedded on blog + home — subscribers signal high-intent audience for future content
- **Course enrollment:** Stripe via Netlify Function when cohorts open
- **Search:** Pagefind (static, Astro-native) — improves time-on-site for blog readers
- **Analytics:** Plausible (privacy-first, no cookie banner, no GA4 bloat)
- **Guest post backlink campaign:** Submit to LeadDev, The Pragmatic Engineer, InfoQ — 3 placements in first 6 months to build domain authority

---

## Environment Variables

```toml
# netlify.toml [build.environment]
OPENROUTER_API_TOKEN    = "@openrouter_api_token"    # existing (keep as fallback)
ANTHROPIC_API_KEY       = "@anthropic_api_key"       # new: direct Anthropic
TURSO_DATABASE_URL      = "@turso_database_url"
TURSO_AUTH_TOKEN        = "@turso_auth_token"
RESEND_API_KEY          = "@resend_api_key"
SLACK_WEBHOOK_URL       = "@slack_webhook_url"
BRAVE_SEARCH_API_KEY    = "@brave_search_api_key"
ADMIN_SECRET_TOKEN      = "@admin_secret_token"
```

---

## Architecture Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Agent comms | Direct sequential calls | Low volume, simpler ops, no queue infra needed at this scale |
| Database | Turso (libSQL) | SQL queries needed, edge-compatible, zero ops, generous free tier |
| Email | Resend | Best DX for transactional email |
| Web grounding | Brave Search | Privacy-respecting, cheap, JSON API |
| Admin auth | Bearer token + Astro middleware | Minimal ops for single owner |
| AI API | Anthropic direct (not OpenRouter) | Lower latency, prompt caching, no markup |
| Astro mode | `hybrid` | Static public pages + SSR admin routes |
| Background work | Netlify Background Functions | 15-min timeout vs. 10s regular function limit |
| Message queue | Deferred (Upstash QStash) | Introduce only when multi-hour async flows are needed |
