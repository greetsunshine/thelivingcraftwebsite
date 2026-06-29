# Kajabi Porting Checklist — The Living Craft

How to rebuild each landing-page section natively in Kajabi's section editor.
For each section: the **Kajabi section type** to add, the **copy** to paste (source of
truth is `copy.md`), and any **image slot**. Order matches the page top-to-bottom.

**Global setup before porting**
- Theme styles → set brand color (accent) to **`#B0512E`** (terracotta); text **`#221C15`**; page background **`#F4EEE2`**; card/section alt background **`#FBF7EE`** / **`#EFE7D7`**.
- Fonts: Headings **Fraunces**, body **Inter**, labels/eyebrows **JetBrains Mono** (add via Site Details → custom fonts / code if not built in).
- Primary button label everywhere: **"Apply for the cohort"** → link to the application form/funnel. Never "Buy now."
- Replace every `{{COHORT_START}}` and `[PLACEHOLDER: …]` before publishing.
- Add a sticky header (Kajabi navigation) with the **Apply** button pinned.

---

## 1. Hero
- **Kajabi section:** *Hero* (or *Call to Action* with image) — text left, image right.
- **Eyebrow:** `AN APPLICATION-ONLY COHORT · BANGALORE, HYBRID`
- **Headline:** AI can write the code. It can't be accountable for it.
- **Subhead:** (paste hero subhead from copy.md §1)
- **Buttons:** Primary "Apply for the cohort" → application form · Secondary "Read the curriculum" → `#curriculum` anchor.
- **Below buttons (small text):** `Cohort starts {{COHORT_START}} · 8 classes · 8–15 seats · Applications open 5 July · ₹1,20,000`
- **Image slot:** OPTIONAL instructor portrait (4:5), warm/candid. If none, run text-only — do **not** use stock photos.

## 2. Pain block — "Sound familiar?"
- **Kajabi section:** *Content / Columns* — a 2-column grid of 6 text cards. (Alt: *List* section.)
- **Background:** alt (deeper paper `#EFE7D7`) to set it apart.
- **Heading:** You're shipping faster than you can verify. And you know it.
- **Intro + 6 first-person questions:** paste from copy.md §2 (keep the quotation marks — they're in the buyer's voice).
- **Closing line (styled, italic serif):** "None of this is a tooling problem. It's a **judgment problem** — and judgment is the one thing the market isn't selling."
- **Image slot:** none.

## 3. What you'll learn — capability clusters
- **Kajabi section:** *Columns / Feature grid* — 2-col grid of 6 cards.
- **Heading:** Six capabilities that separate directing AI from being replaced by it.
- **Cards:** 6 clusters from copy.md §3. Each = title + outcome line + 3 bullets.
- **Emphasis:** Cards 1 (Evaluate) & 2 (Secure/red-team) get a **FLAGSHIP** badge and accent border — they must read as headline outcomes, listed first.
- **Image slot:** OPTIONAL — the "AI builds / human judges" loop diagram (`assets/ai-judges-loop.png`) can sit above this section or in cluster 3.

## 4. Who this is for / not for
- **Kajabi section:** *Columns* — 2 columns side by side ("For you if" / "Not for you if").
- **Heading:** A small room. It only works if it's the right people.
- **Left column (✓):** 4 "for you" bullets. **Right column (×):** 4 "not for you" bullets. Paste from copy.md §4.
- **Image slot:** none.

## 5. What's included
- **Kajabi section:** *Feature grid / Columns* — 3×2 grid of 6 items.
- **Heading:** Built like a senior review, not a webinar.
- **Items:** 8 live classes · Dual-track assessment (code + architecture writeup, L5/L6) · Office hours · Artifact reviews · Recordings · Certificate. Paste from copy.md §5.
- **Image slot:** none (use simple icons if desired — keep restrained).

## 6. Curriculum — 8 classes
- **Kajabi section:** *Accordion* OR *Columns* (2-col grid of 8). Accordion works well for "8 classes, expandable."
- **Heading:** Eight classes. Evaluation and security lead, because that's where the judgment lives.
- **Items:** Classes 1–8 from copy.md §6 (title + description).
- **Emphasis:** **Class 2 — Evaluation & reliability** carries the **FLAGSHIP** badge / accent highlight.
- **Image slot:** none.

## 7. Instructor bio
- **Kajabi section:** *About / Bio* (image + text) OR *Content* with a stats band. Use a **dark background** (`#221C15`) to make it the visual centerpiece.
- **Heading (lead with the number):** 26 years at the bench. Director / L7-level at Google, Amazon, and Walmart.
- **Stat band (4):** 26+ Years · L7 Director-level · 3 Tier-1 (Google·Amazon·Walmart) · HomeOps (agentic-AI).
- **Body + pullquote + credential line:** paste from copy.md §7. Name HomeOps explicitly. Pullquote = "AI builds. The human judges and directs…"
- **Image slot:** instructor portrait (square or 4:5).
- **⚠ Do not publish** until `[PLACEHOLDER: instructor name]` and exact titles/dates are confirmed.

## 8. Social proof
- **Kajabi section:** *Text* block (NOT a testimonial section yet).
- **Content:** the clearly-labeled placeholder + honest "first cohort" framing from copy.md §8.
- **⚠ Hard rule:** do **not** add a Kajabi testimonial/review component with invented quotes. Swap in a real *Testimonials* section only after the first cohort, with permission.
- **Image slot:** none.

## 9. FAQ
- **Kajabi section:** *Accordion / FAQ*.
- **Heading:** Questions worth answering before you apply.
- **Q&A:** 6 items from copy.md §9 (prerequisites, time commitment, hybrid logistics, application process, refund, who it's not for). Fill `[PLACEHOLDER]` answers (time/hrs, venue, refund) before publish.
- **Image slot:** none.

## 10. Final CTA + price
- **Kajabi section:** *Call to Action* — centered, alt background.
- **Heading:** Direct the AI. Don't be replaced by it.
- **Subhead:** 8 classes. 8–15 seats. Cohort starts {{COHORT_START}}. Applications open 5 July…
- **Price line:** ₹1,20,000 · Bangalore, hybrid · By application only.
- **Buttons:** Primary "Apply for the cohort" → application form · Secondary "Read the curriculum".
- **Microcopy:** "It's an application, not a checkout. We read every one personally."
- **Image slot:** none.

---

## Image slot summary
| Slot | File | Size | Section | Required? |
|------|------|------|---------|-----------|
| Social share | `assets/og-image.png` | 1200×630 | site meta (not on-page) | Yes |
| Loop diagram | `assets/ai-judges-loop.png` | ~1600×900 | §3 (and/or §1) | Optional |
| Instructor portrait | (supply real photo) | 4:5 or 1:1 | §1, §7 | Optional, real photo only |

## Pre-publish checklist
- [ ] Replace all `{{COHORT_START}}` with the real start date.
- [ ] Fill / remove every `[PLACEHOLDER: …]` (instructor name, hours, venue, refund).
- [ ] Confirm instructor titles, dates, and HomeOps framing are accurate — no embellishment.
- [ ] No invented testimonials, logos, client names, metrics, or salary figures anywhere.
- [ ] All primary CTAs link to the application form and read "Apply for the cohort."
- [ ] OG image + meta tags (see `meta.md`) set in Kajabi page settings.
