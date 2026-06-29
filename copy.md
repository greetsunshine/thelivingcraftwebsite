# The Living Craft — Final Copy

> All copy for the cohort landing page, organized by the 10 sections (1:1 with Kajabi sections).
> **Spine:** *AI builds, the human judges and directs.*
> **Placeholders** are in `{{double-braces}}` (substitute before publish) or `[PLACEHOLDER: …]` (do not fabricate).
> Cohort start = `{{COHORT_START}}` everywhere.

---

## Program identity

- **Program name:** The Living Craft
- **Descriptor:** A cohort in engineering judgment for the age of AI.
- **Primary CTA (button):** Apply for the cohort
- **Secondary CTA:** Read the curriculum

---

## 1. Hero

**Eyebrow:** AN APPLICATION-ONLY COHORT · BANGALORE, HYBRID

**Headline:**
AI can write the code. It can't be accountable for it.

**Subhead:**
The Living Craft is an 8-class cohort for engineering leaders who direct AI instead of competing with it — the judgment to evaluate what it builds, harden it against attack, and put your name on the result. Built for L5/L6 engineers, architects, and the managers who sign off on what ships.

**Primary CTA:** Apply for the cohort
**Secondary CTA:** Read the curriculum

**Cohort line:**
Cohort starts {{COHORT_START}} · 8 classes · 8–15 seats · Applications open 5 July · ₹1,20,000

---

## 2. Pain block — *"Sound familiar?"*

**Eyebrow:** THE QUESTIONS YOU'RE ASKING QUIETLY

**Heading:**
You're shipping faster than you can verify. And you know it.

**Intro:**
The tools got good fast. The judgment to govern them didn't come in the box. If any of these are running in the back of your head, you're exactly who this cohort is for.

**Questions (first person, the buyer's voice):**

1. "I'm being asked to approve AI-generated code I didn't write and don't fully understand — and my name is on the review."
2. "I review human pull requests with real rigor. I have no equivalent discipline for what an agent produces. Where's my verification parity?"
3. "We ship agent changes and basically hope nothing breaks. I can't tell you our actual reliability — I can tell you it demos well."
4. "Someone could slip an instruction into a document, an issue, or a config file and my agent would just… follow it. I don't know how exposed we are."
5. "Half my team is faster with AI. I genuinely can't tell whose output I can trust and whose I have to re-derive from scratch."
6. "My leadership wants an 'AI strategy.' What I actually need is a way to prove our AI-built systems are correct, safe, and won't embarrass us."

**Close:**
None of this is a tooling problem. It's a judgment problem — and judgment is the one thing the market isn't selling.

---

## 3. What you'll learn — capability clusters

**Eyebrow:** THE CAPABILITIES

**Heading:**
Six capabilities that separate directing AI from being replaced by it.

**Intro:**
Each cluster is a verb-led outcome you can demonstrate — not a topic you've heard of. Evaluation and security come first, on purpose: they're where engineering judgment is now scarcest and most valuable.

### Cluster 1 — Evaluate what AI builds *(flagship)*
**Outcome:** Build evaluation and reliability discipline so you can state — with evidence — whether an AI-built system actually works.
- Design eval suites and graders for non-deterministic systems; measure regressions before users do.
- Establish *verification parity*: hold AI output to the same (or higher) bar as human output, systematically.
- Quantify reliability — failure rates, blast radius, confidence — instead of trusting the demo.

### Cluster 2 — Secure and red-team agentic systems *(flagship)*
**Outcome:** Find and close the attack surface that agentic systems open up — before someone else does.
- Defend against prompt injection from untrusted content (documents, issues, web, tool output).
- Contain malicious project-config / RCE risks: agents that execute code from configs they were "just reading."
- Assess MCP and tool supply-chain exposure: what your agent is permitted to do, and who it implicitly trusts.

### Cluster 3 — Direct AI as a force multiplier
**Outcome:** Run the "AI builds, human judges" loop deliberately — spec, generate, critique, correct — at senior velocity.
- Decompose work into units an agent can build and you can verify.
- Write specs and acceptance criteria precise enough to grade against.
- Know when to direct, when to intervene, and when to throw the output away.

### Cluster 4 — Review AI-generated code with rigor
**Outcome:** Apply review discipline that scales to code no human first-drafted.
- Read for intent, edge cases, and silent failure — not just "does it run."
- Build review checklists and guardrails your whole team can apply consistently.
- Decide what you can responsibly sign off on, and document why.

### Cluster 5 — Architect for reliability and governance
**Outcome:** Design AI-built systems that are observable, controllable, and defensible to leadership and auditors.
- Bound autonomy: permissions, sandboxing, human-in-the-loop checkpoints.
- Instrument for observability and cost; make failure boring and recoverable.
- Put governance — provenance, audit trails, policy — into the architecture, not a slide.

### Cluster 6 — Lead an AI-augmented team
**Outcome:** Set technical direction your team trusts when half the codebase is AI-assisted.
- Calibrate trust across the team: whose AI output is reliable, and how you know.
- Establish standards for evaluation, review, and security that survive contact with deadlines.
- Make the build/verify economics legible to the people you report to.

---

## 4. Who this is for / not for

**Eyebrow:** FIT

**Heading:**
A small room. It only works if it's the right people.

### This is for you if…
- You're an **Engineering Manager, Architect, or Senior Engineer** operating at (or pushing toward) **L5/L6**.
- You already ship real systems and are now accountable for **AI-generated and agentic** work.
- You want **judgment** — evaluation, review, reliability, security — not another tour of tools.
- You're prepared to bring a real system and have it pressure-tested in the room.

### This is *not* for you if…
- You want a "prompt engineering" or "learn ChatGPT" intro. This sits above that market.
- You're looking for a passive, recorded course to watch at 2×.
- You don't yet ship production code or own technical decisions.
- You want certainty that tools will replace judgment. The whole premise here is the opposite.

---

## 5. What's included

**Eyebrow:** WHAT YOU GET

**Heading:**
Built like a senior review, not a webinar.

- **8 live classes** — small-cohort, hands-on, taught live (hybrid: in-person in Bangalore + remote).
- **Dual-track assessment** — graded against an L5/L6 bar on two tracks:
  - *Code track:* an AI-built system you make correct, reliable, and defensible.
  - *Architecture track:* a tradeoff writeup arguing your design decisions under real constraints.
- **Office hours** — direct working time with the instructor between classes.
- **Artifact reviews** — your eval suites, threat models, and writeups reviewed individually.
- **Recordings** — every session recorded for the cohort to revisit.
- **Certificate** — a completion certificate that reflects the dual-track bar, not attendance.

---

## 6. Curriculum — 8 classes

**Eyebrow:** THE 8 CLASSES

**Heading:**
Eight classes. Evaluation and security lead, because that's where the judgment lives.

> Class order is sequenced so the flagship disciplines come early and compound.

- **Class 1 — The judgment loop: AI builds, the human directs.** The operating model for the cohort: how to spec, generate, critique, and correct at senior velocity — and where accountability sits.
- **Class 2 — Evaluation & reliability *(FLAGSHIP)*.** Evals, graders, and reliability measurement for non-deterministic systems. Verification parity: holding AI output to a real bar. *This is the spine of the program.*
- **Class 3 — Security & red-teaming for agentic systems.** Prompt injection, malicious project-config / RCE, MCP and tool supply-chain risk. You attack a system, then defend it.
- **Class 4 — Reviewing AI-generated code.** Review rigor for code no human first-drafted: intent, edge cases, silent failure, and what you can responsibly sign off on.
- **Class 5 — Architecting agentic systems.** Orchestration, tool boundaries, bounded autonomy, observability, and cost — designs you'd put your name on.
- **Class 6 — Governance, safety & controls.** Permissions, sandboxing, human-in-the-loop, provenance, and audit trails — governance built into the architecture.
- **Class 7 — Leading AI-augmented teams.** Calibrating trust, setting team-wide standards, and making build/verify economics legible to leadership.
- **Class 8 — Capstone review.** You present your dual-track work; the cohort and instructor pressure-test it the way a real senior review should feel.

---

## 7. Instructor bio

**Eyebrow:** THE INSTRUCTOR

**Heading (lead with a hard number):**
26 years at the bench. Director / L7-level at Google, Amazon, and Walmart.

**Bio:**
[PLACEHOLDER: instructor name] has spent ~26 years building and directing large-scale systems — at director / L7-level across **Google, Amazon, and Walmart** — and now teaches the judgment those rooms run on. Based in Bangalore.

This isn't theory from the sidelines. They're a hands-on builder: **HomeOps**, a personal agentic-AI project, is where these evaluation, reliability, and security practices get exercised on real, messy, autonomous systems — not slideware. That work runs in parallel with a **live enterprise AI-adoption engagement**, so the material is pressure-tested against both a builder's bench and an organization's reality.

The throughline of the career, and of this cohort, is the same: **AI builds; the human judges and directs.** The Tier-1 credentials aren't the point — they're the reason the judgment is worth ₹1,20,000 of your attention.

**Credential line (placeholder — verify before publish):**
~26 yrs experience · Director / L7-level · Google · Amazon · Walmart · Builder of HomeOps (agentic AI) · Bangalore
[PLACEHOLDER: confirm exact titles, dates, and any figures before publishing — do not embellish.]

---

## 8. Social proof

**[PLACEHOLDER: testimonials — none yet, first cohort]**

This is the inaugural cohort, so there are no testimonials, ratings, or alumni outcomes to show — and we will not invent them. After the first cohort, replace this block with real, attributed quotes (name, role, company, with permission).

*Optional honest framing to use until then (no fabrication):*
"This is the first cohort of The Living Craft. There's no wall of testimonials yet — there's the work, the curriculum, and the person teaching it. Apply on that basis."

---

## 9. FAQ

**Eyebrow:** BEFORE YOU APPLY

**Heading:**
Questions worth answering before you apply.

- **What are the prerequisites?**
  You ship production code or own technical decisions today, and you're working with — or accountable for — AI-generated/agentic systems. No specific framework is required; bring a real system you can work on. Comfortable in at least one programming language and reading code closely.

- **What's the time commitment?**
  8 live classes plus assessment work between sessions: eval suites, a threat model, code, and an architecture tradeoff writeup. Budget meaningful focused time each week — this is graded against an L5/L6 bar, not watched passively. [PLACEHOLDER: confirm exact hours/week and class length.]

- **How does the hybrid format work?**
  Bangalore-based, hybrid: attend in person or join remotely, with every session recorded. [PLACEHOLDER: confirm venue, in-person vs. remote split, and timezone for live sessions.]

- **What's the application process?**
  Applications open **5 July**. You apply (not "buy"), we review fit against the L5/L6 bar and the cohort mix, and selected applicants are invited to enroll. The gate keeps the room small and the level high — 8–15 seats only.

- **What's the refund policy?**
  [PLACEHOLDER: state the exact refund / deferral policy before publishing — do not invent terms.]

- **Who is this *not* for?**
  Anyone wanting a beginner "how to use AI tools" course, a passive recorded program, or a promise that tools remove the need for judgment. This cohort is the opposite of that.

- **Why ₹1,20,000?**
  Small cohort, live instruction, individual artifact reviews, and dual-track assessment against a senior bar — from someone who's been director/L7-level at Google, Amazon, and Walmart. It's priced for the few who'll use it.

---

## 10. Final CTA

**Eyebrow:** THE NEXT COHORT

**Heading:**
Direct the AI. Don't be replaced by it.

**Subhead:**
8 classes. 8–15 seats. Cohort starts {{COHORT_START}}. Applications open 5 July. The room stays small on purpose — apply early.

**Price line:**
₹1,20,000 · Bangalore, hybrid · By application only

**Primary CTA:** Apply for the cohort
**Secondary CTA:** Read the curriculum

**Reassurance microcopy:**
It's an application, not a checkout. We read every one personally.
