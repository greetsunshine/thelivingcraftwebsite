# V4 reporting and attribution

Use Asia/Kolkata for reports and selectable periods. Retain the 10 September operating guide's detailed metric definitions and currency-separated finance evidence. No baseline or performance is fabricated.

| Metric | Source and counting unit | Date basis |
| --- | --- | --- |
| Published posts | Actual URL per LC-V4 ID; never a draft count | Published timestamp |
| Measured visitors/sessions | Consented analytics IDs; incomplete observation labelled | Session date |
| Resource downloads | Measured successful file requests by resource ID; deduplicate supported session/resource events | Event date |
| Resource requests | Saved database request IDs, excluding retries | Saved date |
| Enquiries/applications | Distinct saved record IDs by route; people may have multiple records | Saved date |
| Qualified applications | Application IDs with a recorded qualification decision | Qualification event date |
| Scheduled/held meetings | Distinct meeting IDs and outcomes, reported separately | Scheduled or held event date |
| Offers | Approved offer IDs, not draft messages | Issued date |
| Paid members | Distinct member/cohort records with finance-confirmed payment evidence and explicit refund handling | Payment date; refunds separately |
| Attendance confirmation/actual attendance | Distinct person/cohort records with roster/session evidence | Confirmation date / actual session date |
| Receipts/refunds | Finance evidence, separate gross receipts and refunds by currency | Finance transaction date |
| Form completion | Tracked sessions with successful save divided by tracked sessions with form start; same period/cohort scope | Form-start session cohort; disclose boundary lag |

Report current stage counts as a snapshot at period end, separate from stage events during the period. A person moving through three stages is not three new people. Show first captured source, submission-session source and self-reported source separately. Avoid adding attributed counts across incompatible models.

Campaign UTM: utm_campaign=lc_v4_cohort; utm_source=linkedin; utm_medium=organic_social; utm_content=lowercase LC-V4 ID. Store account and resource ID as permitted non-personal dimensions. Retain inbound attribution when moving from resource to cohort; do not overwrite it with self-referrals.

Analytics success events fire only after backend save, with duplicate protection and no contact information. Anonymous visitors/downloads never become identified people. Identified resource interest never becomes an application automatically. Track failed notifications and due/unassigned tasks from backend records.

Review weekly: publication and audience questions, route engagement, qualified applications, held conversations, offers, receipts and attendance. If engagement grows without applications, inspect relevance and the application path; if qualified applications do not progress, inspect response, fit and offer questions. These are diagnostic hypotheses, not causal findings.

Wider SEO/AEO/GEO monitoring stays as in the roadmap. Identifiable AI referrals, sampled mentions/citations and actual conversions are separate evidence layers.
