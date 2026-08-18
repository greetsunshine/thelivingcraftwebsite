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
- **`/admin/*`** — the operator console. **Not a public surface**: password-gated,
  `noindex`, its own layout and stylesheet, and no SEO/JSON-LD of any kind. See
  *The admin console* below.
- **`/craft/*`** — the cohort's course area, for people who hold a seat. **Not a public
  surface**: gated per learner by an issued code (not a password), `noindex`, and never
  prerendered — a static file under `dist/` would be served without the middleware, which
  is the gate gone. Session material is Markdown in [src/content/sessions/](src/content/sessions/) (week 0 is the
  pre-work and has no module); the pre-cohort questionnaire is
  [src/pages/craft/intake.astro](src/pages/craft/intake.astro), with its questions, validation and queries in
  [src/lib/craft/intake.ts](src/lib/craft/intake.ts). Read the answers at `/admin/intake`.

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

## The admin console (`/admin`)
Password-gated operator surface. Four jobs: traffic, leads, the questions visitors
asked the Q&A agent, and content review. Nothing on the public site reads from it,
and if every one of its env vars is missing the public pages behave exactly as they
did before it existed.

- **Auth** — one password (`ADMIN_PASSWORD`) exchanged for an HMAC-signed HttpOnly
  cookie ([src/lib/admin/auth.ts](src/lib/admin/auth.ts)). Enforced in
  [src/middleware.ts](src/middleware.ts) over the whole `/admin` + `/api/admin/*`
  prefix, **not per page** — so a new admin page is protected by default. An
  unconfigured console is closed (503), never open.
- **Storage is Supabase** — seven tables (`events`, `leads`, `questions`, `learners`,
  `intake_responses`, `radar_findings`, `radar_runs`), schema in
  [supabase/schema.sql](supabase/schema.sql), reached only with the service-role key,
  RLS on with zero policies so no other key can touch it. Rollups are SQL functions,
  because aggregating in TypeScript means a row cap that silently truncates.
- **Every query degrades to empty on error — so the console probes and says so.**
  That degradation is deliberate (one slow rollup must not 500 the page) but it
  makes a *missing table* and *no rows yet* render identically; `/admin/radar` said
  "never run" in both cases, and that cost a real diagnosis after the schema grew.
  [src/lib/admin/health.ts](src/lib/admin/health.ts) probes every table and rollup, cached 60s, and
  `AdminLayout` shows a red banner when anything is not answering. **If you add a
  table or a rollup, add it to the probe lists** — otherwise it is invisible until
  it breaks. This is the one place in the console where failing loudly is the point.
- **Retention and erasure are separate mechanisms, on purpose.**
  - *Retention* (timer): `events` 180 days, `questions` 365, via `admin_purge()`.
    Windows are SQL function defaults, so shortening them needs no deploy. There is
    a 30-day floor that **raises rather than clamps** — a 0 passed by a bug would
    otherwise empty the table while looking like policy. Run from `/admin`, or
    enable pg_cron (snippet is commented at the foot of the schema). Until then the
    policy is only real if someone presses the button.
  - *Erasure* (per person, deliberate): the **Erase** button on `/admin/leads` and
    `/admin/learners`. Hard delete, never a soft flag — a DPDP deletion request is
    not answered by filing someone differently while their details stay in the
    table. Erasing a learner cascades to `intake_responses`; that `ON DELETE
    CASCADE` is load-bearing, not convenience.
  - `leads` and `learners` are **never** purged on a timer: a real enquiry must not
    be lost to a cron job, and the schema keeps withdrawn seats on purpose.
  - Neither reaches the **Web3Forms inbox copy**. A complete erasure means deleting
    that email thread too, and the console cannot do it for you.
- **Traffic is first-party** ([src/components/Track.astro](src/components/Track.astro) →
  [src/pages/api/track.ts](src/pages/api/track.ts)). `@vercel/analytics` is still
  loaded but its data lives in Vercel's dashboard where the site cannot query it.
  Bots are excluded, raw IPs are never stored, and a visitor is a salted hash of
  IP+UA+**today's date** — so it rotates at midnight and cross-day tracking is not
  reconstructible from what we keep. Referrers are stored as a bare host.
- **Leads are a ledger, not a delivery path.** Web3Forms still delivers every lead
  from the browser, unchanged. `/api/lead` records the same submission *and whether
  the Web3Forms post succeeded* — a row with `delivered: false` is someone who
  believes they applied and never reached the inbox, which was invisible before.
  **The inbox stays the system of record; if the two disagree, the inbox wins.**
- **Content edits go out as pull requests** ([src/lib/admin/github.ts](src/lib/admin/github.ts)).
  A Vercel function cannot write to its own deployment, but the constraint and the
  design agree: what the visitor agent knows should only change through a diff a
  human approved. Console edits land on a long-lived `console/*` branch, so three
  edits are three commits on one PR. **The console deliberately does not change on
  click** — the item goes when the PR merges and the site redeploys.
  Only `title`, `body` and `implication` are editable. **Not `source`, `gatheredAt`
  or `sourceType`** — fixing the prose is editing; changing the citation would be
  fabrication. Rerun the agent instead.
- **"Run now" dispatches the GitHub Action**, never researches inline: a sweep is
  minutes of Opus web-search calls and has to land as a commit.
- Reading `/admin` needs Supabase; the write-back buttons need `GITHUB_TOKEN` +
  `GITHUB_REPO` and disable themselves with an explanation when absent. Every panel
  degrades on its own — a missing var greys out one thing, not the page.

## Agents
Three agents now — two retrievers and the visitor Q&A agent. The two retrievers
share their machinery ([scripts/lib/research.ts](scripts/lib/research.ts)) and share
none of their audience; that separation is load-bearing, see the radar entry.
- **Visitor Q&A agent** — [src/pages/api/ask.ts](src/pages/api/ask.ts). Claude Opus 5 tool-use loop on a
  Vercel function. Tools: `search_knowledge` (grounded facts),
  `get_latest_updates`, `capture_visitor` (leads → the same Web3Forms inbox).
  Retrieval in [src/lib/agent/knowledge.ts](src/lib/agent/knowledge.ts) is lexical, not embeddings — the
  corpus is ~20 facts and lexical scoring is auditable. UI: [src/components/AskWidget.astro](src/components/AskWidget.astro).
- **Retriever agent** — [scripts/gather-latest.ts](scripts/gather-latest.ts) (`npm run gather`). Tracks
  **trends and skills in the agentic AI space** — architecture patterns, evals
  and reliability, agent security, what teams are hiring for, and releases that
  change how systems get built. Topics map to the cohort's modules, because the
  job they serve is a prospect asking "is this material current?". Writes
  [src/data/latest.json](src/data/latest.json), which the Q&A agent reads. Scheduled weekly by
  [.github/workflows/gather-latest.yml](.github/workflows/gather-latest.yml), which opens a **PR rather than committing** —
  a human should see what the agent gathered before prospects do.
  - It briefly tracked India/EU *regulatory* news instead. That was an
    unrequested inference on my part, and wrong: a practice selling regulatory
    depth citing trade press for an RBI claim is worse than saying nothing.
  - One research call **per topic** — a shared search budget let the first topic
    starve the rest, and the agent reported thin findings rather than admitting
    the coverage gap.
  - Items carry `reviewNote` for Sunil (source quality, what couldn't be
    confirmed). It is excluded from `formatLatest()` **and** from `/api/facts`,
    so his private doubts never reach a visitor or a crawler. Keep it that way.
    (The admin console *does* show it — that's the one place it belongs.)
- **Radar agent** — [scripts/gather-radar.ts](scripts/gather-radar.ts) (`npm run radar`). The second
  retriever. Writes the **`radar_findings` table**, read **only** by `/admin/radar`.
  Six operator-facing categories in [src/data/radar-categories.ts](src/data/radar-categories.ts):
  trends · big-tech investment · what's working · what's failing · India hiring ·
  durable skills. Weekly via [.github/workflows/gather-radar.yml](.github/workflows/gather-radar.yml), which writes
  **straight to the database — no PR**. That gate is right for the visitor
  retriever, whose output a chatbot repeats verbatim; here it meant a merge and a
  deploy before Sunil could read his own notebook. Review moved rather than
  vanished: findings arrive `status = 'new'`, and hiding or correcting one is an
  UPDATE via `/api/admin/radar-item`. The sweep needs `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` as **GitHub Actions secrets**, not just in Vercel.
  - **`/api/ask` must never import [src/lib/agent/radar.ts](src/lib/agent/radar.ts) or query the radar
    tables.** Two stores exist because there are two readers. "Google is investing $N billion in agents" is
    useful to Sunil and off-key from a chatbot answering a cohort question — and
    the categories that make this feed valuable (what's failing, salary and hiring
    numbers) are exactly the ones where a half-sourced claim repeated to a prospect
    does real damage. Keeping it off the agent's tool surface makes that
    structurally impossible instead of a matter of prompt discipline.
  - Unlike `latest.json`, which is replaced wholesale each run, the radar
    **accumulates** — pruned at 120 days. A quarter of hiring signal beats this
    week's slice of it. Deduping is now a unique index on the normalised source
    URL rather than a comparison in the script, so two overlapping sweeps cannot
    race each other into two rows for one story.
  - Items carry `sourceType` (primary/press/vendor/secondhand), graded by the agent
    and shown as a coloured pill. A vendor blog and a peer-reviewed paper are both
    "a link"; only one is safe to quote to a board.
- **Both** retrievers are forbidden from writing our own prices/dates/seat counts.
  Those come from `facts.ts`; two sources could disagree and the Q&A agent would
  have no way to tell which is true.
- **Grounding rule:** the Q&A agent may state a fact only if a tool returned it,
  and must say "I don't know" and offer the handoff otherwise. This is how the
  hard rules below survive contact with a chatbot — the easiest place on a site
  to invent a price.
- All three need `ANTHROPIC_API_KEY` (see [.env.example](.env.example)). Without it `/api/ask` returns
  503 and the widget points visitors at the form — degrades, doesn't break. Set a
  spend limit on the key; that's the real cost ceiling. **All three share it**, which
  is how draining it on retriever iteration took the live site agent down once.

## SEO / AISO
- [src/components/SeoHead.astro](src/components/SeoHead.astro) — shared `<head>` for all three layouts: meta,
  canonical, OG/Twitter, and one JSON-LD `@graph`. Pages pass a `schema` prop
  (Course / ProfessionalService / Service + FAQPage); the Person node is shared
  and `@id`-referenced so a crawler learns the surfaces are one practice.
- `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/api/facts` are all generated from
  `facts.ts`. **robots.txt deliberately allows AI crawlers** — buyers here ask an
  assistant before a search engine, and `/llms.txt` + `/api/facts` exist so the
  answer they get is the one we wrote. Disallowed: `/api/ask` (POST, costs money per
  call), `/api/track` and `/api/lead` (POST-only; indexing the beacon would pollute
  its own data), and `/admin` — politeness only, since robots.txt is a request and
  the real defence is the session check in `middleware.ts`.
- `SeoHead.astro` is for public surfaces only. **`/admin` must never use it** — a
  JSON-LD `@graph` describing the cohort, emitted from a page listing leads, is
  exactly the wrong artefact. `AdminLayout.astro` has its own minimal head.
- Canonical host is `learning.thelivingcraft.ai`. The apex and `www` are
  unattached (404) — flagged to Sunil, not fixed here.

## Shared infrastructure
- **Design system:** [src/styles/global.css](src/styles/global.css) — imported by every *public* layout. Reuse its
  classes (`hero`, `proofbar`, `cards3/card`, `sec-head`, `eyebrow`, `experience`/`statband`,
  `price-card`, `detail-row`, `faq`, `apply-form`, footer) before inventing new ones.
  Page-specific components (tiers, comparison rows, phase arc, fit/not-fit) live in scoped
  `<style>` blocks in the page files.
  The console has its own [src/styles/admin.css](src/styles/admin.css) — same tokens and typefaces at a
  working density (tables and hairlines, not 104px sections). It deliberately does
  **not** import `global.css`: it uses four of those 220 lines, and sharing them
  would mean every change to the public design reflows the console.
- **Forms:** Web3Forms via client `fetch` ([src/data/site.ts](src/data/site.ts) holds the access key + contact
  email). Same inbox (greetsunshine@gmail.com), distinct `subject` per page. Honeypot +
  graceful email fallback. No backend, no other client storage.
- **Web3Forms is client-side only on the free plan.** A server-side POST returns
  `403 {"success":false,"message":"This method is not allowed. Use our API in
  client side..."}`. This bit the agent's lead capture: `/api/ask` ran the post
  from a Vercel function and every handoff failed. The server now only validates
  and returns a payload; [src/components/AskWidget.astro](src/components/AskWidget.astro) posts it from the
  browser, same as the forms. **Don't move any Web3Forms call server-side.** The
  admin lead ledger does not change this: the browser posts to Web3Forms exactly as
  before, then reports the outcome to `/api/lead`.
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
- **No localStorage/sessionStorage — still true, and it survived the console.** The
  admin session is an HttpOnly cookie the page cannot read; the analytics beacon
  writes no client state at all; the Ask widget's history and session id live in a
  closure and die with the tab. Minimal JS on public pages: the forms, the Ask
  widget, and [src/components/Track.astro](src/components/Track.astro) (the third, and the only way the console
  can see anything). Track captures most events by delegation, so adding a section
  or a link does not mean remembering to instrument it.
- **The no-backend rule has been widened once, deliberately.** It was: `/api/*`
  routes for the Q&A agent and the facts endpoint, no database. It is now those
  plus **Supabase for the admin console** — because a lead history that outlives an
  inbox and traffic the site can read back are things a static site genuinely
  cannot do. The exception is bounded, and the boundary is the point:
  - Visitor-facing pages read **nothing** from Supabase. Every write is
    fire-and-forget; a failed write loses a row, never a lead.
  - Nothing in Supabase feeds the Q&A agent's grounding. Facts still come only
    from `facts.ts`.
  - Web3Forms is still the delivery path for every lead.
  Don't widen it again without a reason as good.

## Positioning spine (cohort)
"**AI builds, the human judges and directs.**" Differentiation = engineering **judgment**,
not tools. Outcomes = (1) evaluation & reliability, (2) security / red-teaming for agentic
systems. Position *above* the commoditizing "how to use AI tools" market.

## Offer facts (single source of truth)
### Cohort (`/`)
- **6-week** program · live online (Bangalore: hybrid) · **8 seats, capped** · ~5 hrs/week
- Pricing per region (founding rate): India **₹1,20,000** (standard ₹1,50,000) ·
  Dubai **AED 8,000** · Australia **AUD 3,000**. Edit in [src/data/regions.ts](src/data/regions.ts).
- Starts **September 2026**; enrollment rolling until all 8 seats are filled. Admission
  by application. These numbers live in `cohort` in [src/data/facts.ts](src/data/facts.ts) — this list
  restates them for a reader, it does not define them.

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
