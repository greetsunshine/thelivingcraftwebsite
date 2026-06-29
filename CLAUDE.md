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

## Shared infrastructure
- **Design system:** [src/styles/global.css](src/styles/global.css) — imported by every layout. Reuse its
  classes (`hero`, `proofbar`, `cards3/card`, `sec-head`, `eyebrow`, `experience`/`statband`,
  `price-card`, `detail-row`, `faq`, `apply-form`, footer) before inventing new ones.
  Page-specific components (tiers, comparison rows, phase arc, fit/not-fit) live in scoped
  `<style>` blocks in the page files.
- **Forms:** Web3Forms via client `fetch` ([src/data/site.ts](src/data/site.ts) holds the access key + contact
  email). Same inbox (greetsunshine@gmail.com), distinct `subject` per page. Honeypot +
  graceful email fallback. No backend, no other client storage.
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
- No backend, no localStorage/sessionStorage, minimal JS.

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
