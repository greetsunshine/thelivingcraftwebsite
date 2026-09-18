---
name: the-living-craft-design
description: Use this skill to generate well-branded interfaces and assets for The Living Craft — Sunil Mathew's cohort programme, field notes, gated course area, agent surfaces and admin console — either for production Astro code or throwaway prototypes and mocks. Contains the token contract, colour and type rules, component inventory, voice rules, and a working applied reference page.
user-invocable: true
---

Read `readme.md` in this skill before designing anything, then explore the other files.

If you are making visual artifacts (slides, mocks, throwaway prototypes), copy the tokens
out and write static HTML. If you are working on production code, copy the tokens and read
the rules here to become an expert in designing with this brand.

If the user invokes this skill with no other guidance, ask what they want to build, ask a
couple of questions, and act as an expert designer who outputs HTML artifacts *or*
production code depending on the need.

## The short version

One direction, every value on `:root`. White cards on a mist ground; **one black hero
surface per view, never two**; sun `#ffc123` for every action; ember `#fd8549` for promos
and secondary feature cards, always carrying ink text and never white; large radii (16px
inner, 24px panel, 28px card, 40px shell, pill buttons); soft wide shadows, and **never a
border and a shadow on the same element**. Type is Figtree (standing in for Sofia Pro) at
800 for display with tight tracking, JetBrains Mono for figures, identifiers and machine
output.

**The geometry is warm; the copy is not.** §2 of the readme governs words and was
deliberately not softened to match the friendlier surface. If a sentence starts sounding
like marketing because the geometry got rounder, the sentence is wrong, not the surface.

## Before you copy a component out of the bundle

`reference/CORRECTIONS.md` lists eight places where the shipped components contradict the
rules the readme states — missing focus rings, a checkbox that paints the "refused" sigil
when checked, caps tracking on sentence-case labels, and a citation mark set at 2.29:1.
`reference/page.css` is a worked example with all eight corrected. Read it before you
reuse component code verbatim.

## Files

    styles.css            entry point, @import list only
    tokens/fonts.css      Figtree + JetBrains Mono (Google CDN stand-in)
    tokens/contract.css   motion, easing, z-layers, breakpoints, focus geometry
    tokens/theme.css      every value, on :root, + the [data-density="compact"] override
    tokens/reset.css      minimal element reset
    readme.md             the whole system — read §2 (voice) and §3 (visual) first
    reference/            a full applied page: programme.html + page.css, and CORRECTIONS.md
    components/           source for each component: core/ structure/ agent/ state/
                          (.jsx + .d.ts + a .prompt.md per component, one .card.html per group)
    guidelines/           one HTML specimen per rule: colors-* type-* geometry-* space-* brand-*
    applied/              the direction on one real surface: cohort-workspace.html
    uploads/              the four reference images the system was retargeted to
    screenshots/          QA capture of the applied workspace
    assets/               empty on purpose — no logo or font binaries were supplied
    _ds_manifest.json     the token and component manifest the tokens were reconstructed from
    _ds_bundle.js         the generated component bundle; do not edit by hand
    thumbnail.html        project tile

`src/styles/ds/` in the site repo is the production copy of `tokens/`. When a token changes,
change both in the same commit. Production is the one that has been measured (see the
contrast notes in `tokens/theme.css`), so when they disagree, production wins.
