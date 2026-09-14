# Ein — V4 campaign and resource addendum

LC-STRATEGY-V4.0.0. Read this alongside the retained 10 September cohort website/backend brief. That functional specification, its data dictionary, 12 communication templates, six staff areas and E01–E18 acceptance cases remain in force. This addendum changes campaign references and phased resources, not the database, consent or delivery safeguards.

## Immediate handoff

Use the revised cohort-page.md and separate vsl-script.md in this folder's public-copy directory. The page still follows outcome/VSL, fit, practical example, outcomes/curriculum, process, Sunil, commitment, FAQs and application. It must work without video. The script is a recording draft; captions and a final transcript must match the eventual recording.

The campaign now has 32 posts and five social videos. The VSL is additional. Read campaign.json for the selected IDs LC-V4-D01–D32, account, resource and destination. Do not reuse LC-OCT IDs for V4 attribution.

## Resource routes

Build three open HTML resources progressively, with optional downloadable PDF and CSV: cost-ceiling worksheet LC-R01, evaluation-gates worksheet LC-R02 and deployment checklist LC-R03. Proposed paths are /resources/cost-ceiling-worksheet/, /resources/evaluation-gates-worksheet/ and /resources/deployment-checklist/. Verify the existing URL inventory before assigning these paths. A /toolkit index can list released resources only; do not display unavailable downloads as available.

LC-R01 must be live and tested before D10; LC-R02 before D16; LC-R03 before D20. Remaining artifacts and browser/Claude/Codex tools are a backlog. Do not put the full library on the critical path to the cohort page.

## Save and attribute correctly

Anonymous resource views/downloads are events, not people. An optional email request creates a resource request attached to an existing or new person using the retained deduplication rules. Keep it distinct from enquiry and application. Never infer marketing permission from downloading.

Retain first captured source, submission-session source, referrer, landing page, UTMs and self-report separately. Use campaign lc_v4_cohort, source linkedin, medium organic_social and lowercase post ID in utm_content. Add resource_id for the resource interaction. No personal details in analytics URLs or payloads.

The backend remains the record of successful submissions. Persist the request and idempotency key before displaying success; use a durable delivery job/outbox and expose email failures to staff. Do not rely on a browser email send followed by an unrelated database write as proof of a saved lead. Inspect the actual current stack and providers before choosing implementation. The PDF's Web3Forms and /api/lead descriptions are unverified implementation claims, not a requirement to copy them.

Keep prior permission checks, stage checks, reply detection, suppression, manual pause and duplicate-send protection. New resource-delivery emails need their own reviewed exact template; the existing cohort nurture must not start from a resource request by default. Reply ingestion must work before nurture can activate.

## Acceptance additions

V4-E01: post IDs and UTMs survive resource → cohort navigation without overwriting first source; no contact details enter analytics.

V4-E02: anonymous download creates no person; optional email request deduplicates a person and creates the correct request type; repeated submit sends no duplicate receipt.

V4-E03: database failure shows no success and sends no unrecorded delivery; email failure retains the saved request and alerts staff.

V4-E04: all three released pages and downloads match the approved resource version, work on mobile and keyboard, and link to the tested cohort/enquiry route.

V4-E05: resource request does not become an application or start marketing without its own permission; reply/unsubscribe suppression remains effective.

All five additions and the retained E01–E18 are NOT RUN against a live implementation. The public URL fetch could not be verified in this session; no form was submitted. Ein proposes the stack and supplies evidence of these tests before publication or activation.
