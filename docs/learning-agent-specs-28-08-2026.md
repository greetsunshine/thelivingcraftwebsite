# The Living Craft — Learning Agent

**Date:** 28th August 2026
**Author:** Ein Thangaraj
**Status:** Proof of Concept (PoC)

---

## 1. What This Is

The Living Craft Learning Agent is a multi-agent system embedded in the cohort platform. It operates across the entire learner lifecycle — from code review to briefing — as a coordinated pipeline of specialised agents, each with a constrained scope and explicit safety boundaries.

The system does not replace the instructor. It amplifies the instructor's attention across 8 learners by handling the volume work (reading every PR, assembling context, surfacing evidence) while routing all judgement calls to you.

The architectural invariant that everything else follows from:

> **The model produces qualitative findings. Code produces quantitative signals. The model never writes a number.**

This means a compromised, hallucinating, or prompt-injected reviewer literally cannot move a learner's standing. Scores, levels, trends — all computed by deterministic code from the model's qualitative output.

---

## 2. System Architecture

The system is composed of 7 agents (A1–A7), a signal aggregation layer, and a member state store. The agents do not communicate with each other directly. They write to and read from shared data stores, and orchestration is handled by code.

### 2.1 The Agent Pipeline

```
PR submitted → A1 (Reviewer) → Findings → A3 (Grounding Verifier) → A4 (Critic)
                                                                        ↓
                                              Sunil's Gate ← Verified Findings
                                                   ↓
                                           S7 (Signal Aggregation) [CODE]
                                                   ↓
                                            Member State Store
                                                   ↓
                              A7 (Briefing) ←→ A2 (Guide) → Learner
```

### 2.2 The Agents

#### A1 — Code Review Agent (Reviewer)

**Purpose:** Reads every PR and produces structured findings.

**Input:** PR diff + assembled context (boilerplate repo layout, member history, prior findings).

**Output:** An array of `Finding` objects, each tagged to a dimension (D1–D5), with:
- A **question** (what the reviewer is asking the learner to consider)
- A **rationale** (why the reviewer flagged this)
- A **severity** (`concern`, `observation`, `strength`)
- A **confidence** score (0–1)
- An **evidence** block (file path, line range, code quote)

**Key Design Decision — ADR-first review:** When learners use Claude Code (or similar AI coding tools), the reviewer reviews the learner's **Architecture Decision Record (ADR)**, not the code itself. The ADR forces the learner to articulate their reasoning. The reviewer then verifies claims in the ADR against the actual diff — checking for:
- Claims made in the ADR that don't appear in the diff (the learner claimed something they didn't implement)
- Dependencies in the diff that aren't mentioned in the ADR (the "absent-but-implemented" fingerprint of unread AI output)

**Pipeline stages:**

| Stage | Description |
|-------|-------------|
| **S1** | PR webhook triggers the pipeline |
| **S2** | Context assembly — selects relevant files from the boilerplate repo (60k token budget) |
| **S3** | Reviewer model call (Opus 5, 150–250k total input) — produces findings |
| **S4** | Grounding verifier [CODE] — checks every citation against the actual file content |
| **S5** | Formatting pass — structures output for the critic |
| **S6** | Critic — sees findings + evidence only (NOT the reviewer's reasoning), checks for coherence |
| **S7** | Signal aggregation [CODE] — computes scores from findings |
| **S8** | **Sunil's gate** — you review, edit, approve, or reject every finding |
| **S9** | Publish — approved findings become visible to the learner |

**Safety property of S6 (Critic):** The critic sees findings and evidence but *not* the reviewer's reasoning. This prevents the critic from inheriting a framing the reviewer talked itself into. It can only evaluate whether the evidence supports the finding on its own terms.

**Unreviewable field:** The reviewer output schema includes an `unreviewable` array — an explicit list of things the reviewer could not assess and why. Most systems pad when they can't evaluate something. This system reports the gap. Combined with a 30% finding-drop-rate failure threshold, this creates a structural safety net against silent degradation.

---

#### A2 — Guide Agent (Conversational Sidebar)

**Purpose:** The learner's primary interface to the system. A conversational agent docked to the right side of the dashboard.

**Key constraint — "Relay, don't extend":** The guide may relay approved findings (those that have passed through Sunil's gate at S8), but it must never generate a fresh opinion or verdict about the learner's work. This is the critical line between "restating an approved finding" and "generating a fresh judgement."

**Router tiers:** A Haiku-class router classifies every learner question into one of three tiers:

| Tier | Behaviour | Example |
|------|-----------|---------|
| **Factual** | Answer directly from grounded facts | "When is the next session?" |
| **Relay** | Restate an approved finding, cite the source | "What did my last review say about error handling?" |
| **Judgement** | Do NOT answer; use Socratic questioning to help the learner think | "Is a queue the right pattern here?" |

**100% accuracy requirement on `judgement` tier:** The golden set requires perfect classification of judgement-tier questions. The real risk is false negatives — questions that *look* factual but are actually asking for a design choice (e.g., "Is a queue the right pattern here?" sounds factual but is a judgement call).

**Escalation relay:** The guide succeeds by routing learners to Sunil *better informed*, not by absorbing the question. The escalation rate is a health metric where **low is bad** — if nobody is escalating, the guide may be overstepping its bounds.

**Output filter:** A runtime guard that blocks unearned numbers and fresh verdicts from the guide's output. This is the only ungated agent (no human review before the learner sees the response), so the filter is safety-critical.

---

#### A3 — Grounding Verifier [CODE]

**Purpose:** Validates every citation in the reviewer's output against the actual file content. This is not a model — it is deterministic code that checks whether the quoted code at the cited line range actually exists in the repository.

**Why code, not a model:** A model checking another model's citations is turtles all the way down. This must be deterministic.

---

#### A4 — Assessment Agent

**Purpose:** Generates targeted assessment items (questions) based on the learner's current member state, surfacing gaps that PR reviews alone cannot cover.

**Open question:** Whether A4's graded responses count as a "distinct source" for the corroboration rule (see §3.5 below). If not, Level 4 may be structurally unreachable on dimensions where PRs are the only evidence channel.

---

#### A5 — Session Agent

**Purpose:** Processes live session transcripts and extracts evidence events tagged to dimensions.

---

#### A6 — Intake Agent

**Purpose:** Processes the learner's intake questionnaire (completed during onboarding) to establish baseline member state.

---

#### A7 — Briefing Agent

**Purpose:** Generates a personalised daily briefing for each learner.

**Key design decision — mandatory empty state:** If the briefing selector returns empty (nothing new happened), the briefing is a greeting and the state of the week, nothing more. It does not manufacture urgency. The eval for this agent includes "a week where nothing happened — does it invent urgency?" as a failure case.

---

## 3. The Five Dimensions (D1–D5)

Every finding, every signal, every score maps to one of five evaluation dimensions:

| ID | Dimension | What It Measures |
|----|-----------|-----------------|
| **D1** | Architecture & Design | Quality of architectural decisions, pattern selection, trade-off reasoning |
| **D2** | Context Management | How the learner manages context windows, token budgets, and information flow in agentic systems |
| **D3** | Evaluation & Metrics | Ability to build eval harnesses, define quality gates, and measure system performance |
| **D4** | Security & Containment | Threat modelling, prompt injection defence, blast-radius control, failure containment |
| **D5** | Production Operations | Observability, deployment strategy, retry/backoff, operational readiness |

---

## 4. Signal Aggregation — The Math

This is the core mechanism that converts qualitative reviewer findings into quantitative learner standing. All of this is computed by **code**, never by a model.

### 4.1 Signal Generation

Each approved finding produces a signal:

- **Severity mapping:** `strength` → positive signal, `concern` → negative signal, `observation` → weak signal
- **Per-finding confidence** (0–1) from the reviewer, validated by the critic
- **Dimension tag** (D1–D5) — which dimension this finding contributes to

### 4.2 Signal Clamping

> **Per dimension, per PR, signals sum and clamp to ±2.**

This prevents a single PR from dominating a learner's standing. Even if a reviewer finds 10 concerns on D1 in one PR, the maximum negative contribution is –2.

### 4.3 Decay Function

Evidence decays over time. Recent evidence matters more than old evidence.

```
decay(d) = 1.0   if d ≤ 14 days
           0.6   if 15–35 days
           0.3   if 36–90 days
           0.0   if > 90 days
```

**Note:** There is a cliff at day 14 (1.0 → 0.6). A finding from day 14 has full weight; a finding from day 15 loses 40%. In a 6-week program with weekly sessions, this means week-1 findings lose significant weight by week 3.

### 4.4 Confidence Discount

If a finding comes from only one source (e.g., only PR reviews, no session evidence), it receives a **single-source discount** of 0.8×.

### 4.5 Corroboration Rule

Level thresholds require corroboration:

- **Level 4** requires evidence from **≥2 distinct sources** across **≥2 distinct weeks**
- Sources include: PR reviews (A1), sessions (A5), assessments (A4), intake (A6)

### 4.6 Level Thresholds

| Level | Requirements |
|-------|-------------|
| **0** | No evidence |
| **1** | Score > 0, any source |
| **2** | Score > 1, ≥1 source |
| **3** | Score > 2.5, ≥1 source, ≥2 weeks |
| **4** | Score > 4, ≥2 distinct sources, ≥2 distinct weeks |

### 4.7 Worked Example

For the mock learner in the PoC:

```
D4 (Security & Containment): Level 4, Score 5.2, Trend ↗

  PR #14, Finding f-1 (concern, confidence 0.9):
    "What happens to in-flight work if that worker dies mid-loop?"
    → Signal: +1.8 (strength derived from the learner's subsequent fix)
    → Decay: 1.0 (within 14 days)
    → Confidence discount: 0.8 (single source)
    → Contribution: 1.8 × 1.0 × 0.8 = 1.44

  (Additional findings from prior PRs and sessions bring total to 5.2)
```

---

## 5. Safety Architecture

### 5.1 Principle 2: "The model never writes a number"

The clean split between S3 (model produces findings) and S7 (code derives signals) means a compromised or hallucinating reviewer cannot move a learner's standing.

### 5.2 Critic Isolation (S6)

The critic sees findings + evidence only — **not** the reviewer's reasoning. This prevents the critic from inheriting a framing the reviewer talked itself into.

### 5.3 Grounding Verifier as Code (S4)

Every citation is checked by deterministic code, not by another model.

### 5.4 Output Filter on A2

The guide's output is filtered at runtime to block:
- Unearned numeric claims
- Fresh verdicts not sourced from approved findings
- Any response classified as `judgement` tier that attempts to state a conclusion

### 5.5 Sunil's Gate (S8)

Every finding passes through you before the learner sees it. For cohort 1, this is approximately 50 reviews (8 learners × ~6 PRs each). Your edits at this stage are the only ground-truth labels for the eval harness.

### 5.6 Prompt Injection as Teaching Artifact

Structural defences (code-computed signals, critic isolation, grounding verifier) mean even a fully compromised reviewer cannot move standing. Learner injection attempts are logged and — with consent — published as a week-4 teaching artifact about adversarial robustness.

---

## 6. What the Learner Sees

The learner's interface is a three-pane layout:

### 6.1 Left Sidebar — Navigation

A narrow icon sidebar providing access to:

| Icon | Page | Content |
|------|------|---------|
| 🏠 | Dashboard | Briefing, member state, recent PR reviews |
| 🔍 | Search | Full-text search across sessions, PR findings, notes, and material |
| 📦 | Modules | M1–M4 curriculum progress with completion indicators |
| 📝 | Field Notes | Personal learning journal entries |
| 💬 | Messages | Direct threads with Sunil and the Learning Agent |
| 👤 | Profile | Dimension summary, activity stats |
| ⚙️ | Settings | Notification preferences, agent response style |

### 6.2 Centre Pane — Content

The main content area. On the dashboard, this shows:

1. **Your Briefing** — Generated by A7. A short, personalised summary of what needs attention this week.
2. **Your Current Standing** — The 5 dimension cards (D1–D5) with levels, scores, and trends. Includes a "How to read this" legend.
3. **Recent Code Reviews** — PR cards with expandable provenance drawers showing findings, evidence, and code quotes.

**The provenance drawer is the critical UI pattern.** Every number on screen must open to its evidence chain in one interaction. If a learner sees "Level 3" on D1, clicking it should show exactly which PR findings, from which files, at which line numbers, produced that level.

### 6.3 Right Pane — Guide Sidebar (A2)

The conversational interface. Features:
- **Dynamic action chips** that update based on conversation context (e.g., after asking "What's due this week?" and getting a response about PR #14, the chips update to include "Ask Sunil about PR #14")
- **Socratic questioning** for judgement-tier queries
- **Escalation relay** to Sunil with pre-drafted context
- **Clear chat** to reset the conversation

---

## 7. Current State: PoC (28 August 2026)

The PoC is a working front-end built in Astro, running locally at `http://localhost:4321/craft/`. It demonstrates the learner-facing UI and interaction model with mock data. **No agents are running.** All data is hardcoded.

### 7.1 What's Real

| Component | Status |
|-----------|--------|
| Three-pane layout (sidebar, content, guide) | ✅ Implemented |
| All 7 sidebar pages with content | ✅ Implemented |
| Member state visualisation (D1–D5 cards with legend) | ✅ Implemented |
| Provenance drawer (PR findings → evidence → code) | ✅ Implemented |
| Briefing card (A7 output format) | ✅ Implemented |
| Guide sidebar with dynamic action chips | ✅ Implemented |
| Chat interaction with context-aware responses | ✅ Implemented (mock) |
| Search with live filtering | ✅ Implemented (mock) |
| SPA navigation (Astro ViewTransitions) | ✅ Implemented |

### 7.2 What's Mock

| Component | Mock Data Source | Production Source |
|-----------|-----------------|-------------------|
| Briefing text | Hardcoded string | A7 Briefing Agent |
| Member state (D1–D5 scores) | `mock-dashboard.ts` | S7 signal aggregation from Supabase |
| PR findings + evidence | `mock-dashboard.ts` | A1 pipeline (S3→S9) via Supabase |
| Chat responses | Keyword-matched JS | A2 Guide Agent (Claude API) |
| Search results | Static array with client-side filter | Full-text search over Supabase |
| Messages | Hardcoded thread list | Real messaging system |
| Modules progress | Static percentages | Supabase `progress` table |
| Field notes | Hardcoded entries | Learner-authored, stored in Supabase |
| Profile stats | Hardcoded numbers | Computed from `agent_runs`, `evidence_events` |

### 7.3 What Remains to Build

The build path, in dependency order:

| # | Item | Dependencies | Risk |
|---|------|-------------|------|
| 0 | **Boilerplate repository** | None | 🔴 **Highest risk.** Blocks items 5, 6, 7. Determines S2's file-selection map. Members build on it in week 1. |
| 1 | Supabase schema + auth | None | 🟢 Low |
| 2 | Middleware (real auth, not bypassed) | 1 | 🟢 Low |
| 3 | PR webhook → pipeline trigger (S1) | 1 | 🟡 Medium |
| 4 | Context assembly (S2) | 0, 1 | 🔴 **High.** S2's quality is the single highest-leverage quality lever. |
| 5 | Reviewer model call (S3) | 0, 4 | 🟡 Medium |
| 6 | **Golden sets for eval harness** | 0 | 🔴 **High.** Content authoring (deliberately bad ADRs, planted defects). On critical path. |
| 7 | Grounding verifier (S4) + Critic (S6) | 5 | 🟡 Medium |
| 8 | Signal aggregation (S7) | 5 | 🟢 Low (deterministic code) |
| 9 | Sunil's review gate (S8→S9) | 7, 8 | 🟡 Medium |
| 10 | A2 Guide Agent | 9 | 🟡 Medium |
| 11 | A7 Briefing Agent | 9 | 🟢 Low |
| 12 | Live dashboard (replace mock data) | 8, 9 | 🟢 Low |

---

## 8. How to Run the PoC

```bash
cd d:\thelivingcraftwebsite
npm run dev
```

Navigate to `http://localhost:4321/craft/`

The middleware is currently bypassed to inject a mock learner (`context.locals.learner`). In production, this would be gated by Supabase auth.

---

## 9. Key Architectural Decisions

| ID | Decision | Position |
|----|----------|----------|
| **D-A** | Vercel split vs all-Cloudflare | Vercel for the reviewer pipeline (heavy Node runtime). Cloudflare for the public site. Cross-origin cost is low with Access. |
| **D-B** | Every PR through Sunil's gate | Yes for cohort 1. 50 reviews is manageable, and your edits are the only labels for the eval harness. |
| **D-D** | Forks vs branches | One repo, protected branches. Simpler. |
| **D-E** | Anonymised cross-learner comparison | Yes, opt-in. Eight people solving the same boilerplate is genuinely rare data. |
| **D-F** | Publish injection attempts | Yes with consent. On-brand for the program. |
| **D-I** | Coverage matrix to members | Fix D3/D5 evidence sources first. Showing gaps you can't fill is worse than not showing the matrix. |
| **D-J** | Read receipts | Cut. On 8 senior peers it reads as surveillance. |

---

## 10. Summary

The Learning Agent is not a chatbot bolted onto a course. It is a structurally safe, multi-agent system where:

1. **Models produce findings.** Code produces numbers.
2. **Every number traces to evidence.** The provenance drawer is the proof.
3. **The instructor gates everything.** No finding reaches a learner without your approval.
4. **The guide asks, it doesn't tell.** Judgement calls are escalated, not absorbed.
5. **Degradation is honest.** When the system can't assess something, it says so.

The PoC demonstrates the interaction model and UI. The build path starts with the boilerplate repo and the golden sets — both on the critical path, both requiring content authoring before engineering can begin.
