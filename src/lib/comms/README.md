# Communications: how the resource follow-ups run

This is the operator's note. What a follow-up is, what runs it, what to set,
and what to do when something fails. The design arguments are in the file
headers; this file is the short version.

## What happens

1. A visitor asks for a resource on a tool or resource page. The gate takes a
   name, a role and an email address, and an **unticked** marketing box.
2. The request is saved (`resource_requests`, `people`). The resource delivery
   email is queued at once (`comms_messages`, transactional).
3. If the box was ticked, a consent row is written (`consents`, source
   `resource-gate`) and a follow-up sequence opens (`comms_sequences`, route
   `resource`) with its first send at 10:00 Asia/Kolkata on calendar day 2.
4. The worker ticks every few minutes. The **planner** finds sequences whose
   `next_send_at` has arrived, claims each one, picks the next resource from
   the catalogue, queues one message and sets the next send. The **sweep** then
   re-checks every due message against every gate and hands it to the
   provider.
5. This repeats until the catalogue is used up (`completed`), or the person
   unsubscribes, withdraws consent, bounces or complains (`stopped`, with the
   reason).

## What runs it

- `GET|POST /api/comms/worker` with `Authorization: Bearer <secret>`.
- **Production**: `vercel.json` cron, every ten minutes. Vercel sends
  `CRON_SECRET` itself. Sub-daily cron needs a paid Vercel plan.
- **Staging**: `.github/workflows/comms-worker.yml`, every ten minutes, against
  the preview URL, with `COMMS_WORKER_URL` and `COMMS_WORKER_SECRET` as
  repository secrets. Vercel crons never run on previews.
- **By hand**: the "Run the follow-ups" button on `/craft/admin/comms`.

Two workers at once are safe. The planner claims a sequence with a lease and
every message has an idempotency key; the database refuses the second copy.

## What to set (all in `.env.example`, with comments)

| Variable | What it is | Missing means |
|---|---|---|
| `COMMS_PROVIDER` | `resend` | No adapter; dispatch off |
| `RESEND_API_KEY` | The provider key | Every send fails permanently |
| `COMMS_WEBHOOK_SECRET` | The webhook signing secret | Every callback is a 401 |
| `COMMS_FROM_ADDRESS` | Who the mail is from | Dispatch off (`sender` precondition) |
| `COMMS_SENDER_POSTAL_ADDRESS` | The footer's postal address | Dispatch off |
| `COMMS_REPLY_MAILBOX` | The monitored reply address | Nurture disabled |
| `COMMS_SENDING_DOMAIN` | The verified domain | Dispatch off |
| `COMMS_LINK_SECRET` | Signs unsubscribe links | Nurture disabled |
| `COMMS_LINK_ORIGIN` | Where links point | Production origin |
| `COMMS_RECIPIENT_ALLOWLIST` | Staging: who may be mailed | Everybody may |
| `COMMS_WORKER_SECRET` / `CRON_SECRET` | The worker's bearer | Worker closed |
| `COMMS_DRIP_INTERVAL_DAYS` | Days between follow-ups | 3 (placeholder) |
| `COMMS_DISPATCH` | `on` to let mail leave | Off |

Set `COMMS_DISPATCH=on` last, after every line on the console's readiness list
is green and after a test send to an allow-listed address.

## Before deploying

Run the whole of `supabase/schema.sql`. It is idempotent. This change adds
`people.role_code`, a new signature for `resource_request_submit()`, four
columns on `comms_sequences`, the `comms_drip_sends` table, three event types
and the retry door on `comms_messages`. Until it runs, the gate still hands
over files and reports that the request was not saved.

Then, in the console: **Load the follow-up wordings**, read each one, and
**approve** the ones that may go. Nothing sends from an unapproved wording.

## Reading the console

`/craft/admin/comms`, section **Resource follow-ups**:

- one row per sequence: the person, the resource they asked for, their role,
  every resource sent so far with its step, the next send, the state in the
  brief's words (`active`, `paused`, `completed`, `unsubscribed`,
  `suppressed`, `failed`, `stopped`) and any failed or unknown message;
- the wordings, with approve and revoke;
- the buttons: load the wordings, run the follow-ups.

The **Failures** section lists every message that gave up or whose outcome is
unknown. An unknown outcome is reconciled against the provider reference
before any retry; it is never retried blind.

## When something is wrong

- **"table is not answering" banner**: the schema has not been run.
- **Follow-ups are planned but held**: read the gates on the message in the
  outbox. The usual ones: wording not approved, sender not configured,
  recipient not on the allow-list, `COMMS_DISPATCH` not `on`.
- **A person keeps getting mail after unsubscribing**: check
  `comms_suppressions` for the address. The link and the provider's
  unsubscribe both write there; nothing in this codebase removes a row.
- **A webhook returns 401**: the secret in the provider's dashboard and
  `COMMS_WEBHOOK_SECRET` differ, or the request is older than five minutes.
- **The same resource was recommended twice**: it cannot be, by the unique
  index on `comms_drip_sends (sequence_id, resource_id)`. If the console shows
  it, the two rows are two sequences; look at `stopped_reason` on the first.

## Logs

The worker writes one JSON line per tick (`comms_worker`), the webhook one per
event (`comms_webhook`), the request handler one per follow-up decision
(`resource_follow_up`). Counts, ids, gate names and reasons. Never an address,
a name, a subject, a body, a token or a provider payload.

## Tests

`npm test` runs `src/lib/comms/*.test.ts`: selection, scheduling across
daylight saving, the planner with an in-memory store (day 2, exhaustion,
unsubscribe before and during, missing and withdrawn consent, two planners at
once), retry planning, the provider's outcome mapping, webhook signature
verification, unsubscribe tokens and the rendered email.
