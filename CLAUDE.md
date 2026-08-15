# The Living Craft / Sunil Mathew — practice site

## Purpose
A **live, deployed site** (Astro → Vercel) for Sunil Mathew's teaching + consulting
practice. It started as marketing assets for a cohort landing page destined for Kajabi;
it has since become the production site itself. Three cross-linked surfaces, one design
system. The Kajabi hand-off is **no longer the plan** — build directly in this repo.

## Surfaces (Astro routes)
- **`/`** — *The Living Craft* cohort. Application-only program in agentic & systems
  architecture. Single page; region (India/Dubai/Australia) only changes the pricing
  block via `?region=` param or Vercel geo header. SSR (`prerender = false`).
  Files: [src/pages/index.astro](src/pages/index.astro), [src/components/ProgramPage.astro](src/components/ProgramPage.astro), [src/data/regions.ts](src/data/regions.ts).
- **`/caio`** — *Fractional Chief AI Officer*. Board-facing consulting retainer. Static.
  Files: [src/pages/caio.astro](src/pages/caio.astro), [src/layouts/CaioLayout.astro](src/layouts/CaioLayout.astro).
- **`/assessment`** — *AI Readiness Assessment*. Fixed-scope diagnostic; the front door.
  Static. Files: [src/pages/assessment.astro](src/pages/assessment.astro), [src/layouts/AssessmentLayout.astro](src/layouts/AssessmentLayout.astro).

**Cross-link spine:** assessment ⇄ CAIO ⇄ cohort. Assessment is the front door, the CAIO
retainer is the expansion, the cohort is capability-transfer / lead-gen. The fee-credit
mechanic (assessment fee → first month of the CAIO retainer) must stay consistent on both
the `/assessment` and `/caio` pages.

## Branding
Teaching brand = **The Living Craft** (`/`). Consulting = a brand-neutral **personal
practice** ("Sunil Mathew", mono descriptor "Fractional CAIO" / "AI Readiness"), a distinct
but cross-linked surface. Open decision (flag to Sunil): umbrella vs personal brand vs new
practice name — copy is written brand-neutral so the wordmark can be swapped.

## The facts module — read this before editing any offer
[src/data/facts.ts](src/data/facts.ts) is the **single source of truth** for every offer fact.
Four consumers read it and nothing else: JSON-LD structured data, `/llms.txt`,
`/api/facts`, and the visitor Q&A agent's grounding. Change a price, date, or seat
count there and all four move together. Cohort pricing lives in
[src/data/regions.ts](src/data/regions.ts) and is imported, not restated.

Never state an offer fact directly in a page, a schema block, or an agent prompt —
route it through `facts.ts`. The failure this prevents is subtle and bad: a stale
number that is right on the page but wrong in the answer an AI assistant gives
about us.

## Agents
Two agents, one handoff artefact:
- **Visitor Q&A agent** — [src/pages/api/ask.ts](src/pages/api/ask.ts). Claude Opus 5 tool-use loop on a
  Vercel function. Tools: `search_knowledge` (grounded facts),
  `get_latest_updates`, `capture_visitor` (leads → the same Web3Forms inbox).
  Retrieval in [src/lib/agent/knowledge.ts](src/lib/agent/knowledge.ts) is lexical, not embeddings — the
  corpus is ~20 facts and lexical scoring is auditable. UI: [src/components/AskWidget.astro](src/components/AskWidget.astro).
- **Retriever agent** — [scripts/gather-latest.ts](scripts/gather-latest.ts) (`npm run gather`). Sweeps
  regulatory and agentic-AI developments via Claude's server-side web search and
  writes [src/data/latest.json](src/data/latest.json), which the Q&A agent reads. Scheduled weekly by
  [.github/workflows/gather-latest.yml](.github/workflows/gather-latest.yml), which opens a **PR rather than committing** —
  a human should see what the agent gathered before prospects do.
- The retriever is forbidden from writing our own prices/dates/seat counts. Those
  come from `facts.ts`; two sources could disagree and the Q&A agent would have no
  way to tell which is true.
- **Grounding rule:** the Q&A agent may state a fact only if a tool returned it,
  and must say "I don't know" and offer the handoff otherwise. This is how the
  hard rules below survive contact with a chatbot — the easiest place on a site
  to invent a price.
- Both need `ANTHROPIC_API_KEY` (see [.env.example](.env.example)). Without it `/api/ask` returns
  503 and the widget points visitors at the form — degrades, doesn't break. Set a
  spend limit on the key; that's the real cost ceiling.

## SEO / AISO
- [src/components/SeoHead.astro](src/components/SeoHead.astro) — shared `<head>` for all three layouts: meta,
  canonical, OG/Twitter, and one JSON-LD `@graph`. Pages pass a `schema` prop
  (Course / ProfessionalService / Service + FAQPage); the Person node is shared
  and `@id`-referenced so a crawler learns the surfaces are one practice.
- `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/api/facts` are all generated from
  `facts.ts`. **robots.txt deliberately allows AI crawlers** — buyers here ask an
  assistant before a search engine, and `/llms.txt` + `/api/facts` exist so the
  answer they get is the one we wrote. Only `/api/ask` is disallowed (POST, costs
  money per call, nothing to index).
- Canonical host is `learning.thelivingcraft.ai`. The apex and `www` are
  unattached (404) — flagged to Sunil, not fixed here.

## Shared infrastructure
- **Design system:** [src/styles/global.css](src/styles/global.css) — imported by every layout. Reuse its
  classes (`hero`, `proofbar`, `cards3/card`, `sec-head`, `eyebrow`, `experience`/`statband`,
  `price-card`, `detail-row`, `faq`, `apply-form`, footer) before inventing new ones.
  Page-specific components (tiers, comparison rows, phase arc, fit/not-fit) live in scoped
  `<style>` blocks in the page files.
- **Forms:** Web3Forms via client `fetch` ([src/data/site.ts](src/data/site.ts) holds the access key + contact
  email). Same inbox (greetsunshine@gmail.com), distinct `subject` per page. Honeypot +
  graceful email fallback. No backend, no other client storage.
- **Web3Forms is client-side only on the free plan.** A server-side POST returns
  `403 {"success":false,"message":"This method is not allowed. Use our API in
  client side..."}`. This bit the agent's lead capture: `/api/ask` ran the post
  from a Vercel function and every handoff failed. The server now only validates
  and returns a payload; [src/components/AskWidget.astro](src/components/AskWidget.astro) posts it from the
  browser, same as the forms. **Don't move any Web3Forms call server-side.**
- **Deploy:** `@astrojs/vercel` adapter, `output: 'static'`. `npm run dev` to preview
  (`astro preview` is unsupported with the Vercel adapter). Old `/india|/dubai|/australia`
  paths redirect to `/?region=`.
- Legacy reference files at repo root (`copy.md`, `index.html`, `section-map.md`, `meta.md`,
  `assets/`) predate the Astro build — treat as historical, not the source of truth.

## Hard rules
- **NEVER invent** testimonials, client names, logos, student counts, salary figures,
  metrics, or partner names. Use clearly-labeled `[PLACEHOLDER: …]`.
- **All ₹/AED/AUD pricing is a placeholder/anchor** for Sunil to calibrate (India
  mid-market / regulated-enterprise / PE buyers; US fractional-CAIO band $5K–$30K+/mo is a
  ceiling reference, not the India number). Flag pricing for review before publishing; mark
  it in an HTML comment near the figures.
- CTAs: cohort = **APPLY**; consulting = **Book a discovery call / Request a scope call**.
  Never "Buy now."
- Keep regulated-industry depth prominent on consulting pages (DPDP Act, IRDAI, RBI, SEBI,
  NIST AI RMF, ISO 42001, EU AI Act) — it's a core differentiator.
- No localStorage/sessionStorage. Minimal JS — the only client script beyond the
  forms is the Ask widget.
- **The no-backend rule now has exactly one exception:** the `/api/*` routes that
  serve the Q&A agent and the facts endpoint. Still no database and no other
  client storage — agent conversations live in the tab and die with it; leads go
  to the same Web3Forms inbox as the forms. Don't widen the exception without a
  reason as good.

## Positioning spine (cohort)
"**AI builds, the human judges and directs.**" Differentiation = engineering **judgment**,
not tools. Outcomes = (1) evaluation & reliability, (2) security / red-teaming for agentic
systems. Position *above* the commoditizing "how to use AI tools" market.

## Offer facts (single source of truth)
### Cohort (`/`)
- **5-week** program · live online (Bangalore: hybrid) · **15 seats, capped** · ~5 hrs/week
- Pricing per region (founding rate): India **₹1,50,000** · Dubai **AED 8,000** ·
  Australia **AUD 3,000**. Edit in [src/data/regions.ts](src/data/regions.ts).
- Dates: "Announced on application"; enrollment rolling until full. Admission by application.

### Consulting (`/caio`, `/assessment`) — pricing all placeholder
- CAIO tiers: Advisory ~2 d/mo · Embedded ~1 d/wk · Transformation 2–3 d/wk. 90-day min.
- Assessment: fixed-fee, fixed-scope, 2–3 weeks, board-ready roadmap.

### Instructor
~26 yrs, director/L7-level at Google, Amazon, Walmart; Bangalore-based; building a personal
agentic-AI product + a live enterprise AI-adoption engagement. 100M+ users served; 150
engineers led across US/UK/China/India.

## Design tokens
- **Palette** (warm "craft", one accent): paper `#F4EEE2` · surface `#FBF7EE` ·
  ink `#221C15` · ink-soft `#5C5345` · line `#DCD2BE` · **accent (terracotta/clay) `#B0512E`**
  · clay-deep `#8F3F22` · ochre `#C2914A`.
- **Type**: Fraunces (display serif) · Inter (body) · JetBrains Mono (eyebrows/labels).
- **Scale**: body 17px/1.65; H1 clamp(40–72px); H2 clamp(30–46px); display weight ~360.
- **Spacing**: section padding ~104px; max width 1180px; radius 2–3px; hairline borders.
- **Voice**: respected practitioner. Restrained, senior-technical, high whitespace.
  Consulting register a notch more executive (board-facing). Not SaaS-templated, not
  bootcamp-hype.
