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
   `resource-gate`, no `confirmed_at`) and a follow-up sequence opens
   (`comms_sequences`, route `resource`) in state **`awaiting_confirmation`**.
   One email is queued: the confirmation request (`confirm-resource-emails`,
   transactional). Nothing else is sent until the person clicks it.
4. The link opens `/confirm-resource-emails`. Opening it changes nothing; the
   person presses the button. That writes a second consent row with
   `confirmed_at` and moves the sequence to `active`.
5. The worker ticks every few minutes. The **planner** finds sequences whose
   `next_send_at` has arrived and claims each one. It re-reads consent and the
   **pause signals** (a reply, a booked call, an open application or enquiry,
   a payment). If the last step has gone and this step's slot has arrived, it
   picks the next resource, queues one message, and looks again within the
   hour. The **sweep** then re-checks every due message against every gate and
   hands it to the provider.
6. The schedule: days **2, 5, 9 and 14** after the confirmation, then **seven
   days after each actual send**. Weekdays only, at 10:00 Asia/Kolkata. At
   least **48 hours** between sends. The next step is never planned while the
   last one is still in the outbox, so a backlog never leaves as a burst.
7. It ends when the catalogue is used up (`completed`, shown as *exhausted*),
   or the person unsubscribes, withdraws consent, bounces or complains
   (`stopped`, with the reason). A pause signal moves it to `paused`, cancels
   what is queued, and only a person resumes it from the console.
8. A person who has had a sequence before is never re-enrolled by another
   tick. Re-enrolment is a reviewed decision.

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
| `COMMS_LINK_SECRET` | Signs unsubscribe and confirmation links | Nurture disabled; no confirmation request can be sent |
| `COMMS_LINK_ORIGIN` | Where links point | Production origin |
| `COMMS_RECIPIENT_ALLOWLIST` | Staging: who may be mailed | Everybody may |
| `COMMS_WORKER_SECRET` / `CRON_SECRET` | The worker's bearer | Worker closed |
| `COMMS_DISPATCH` | `on` to let mail leave | Off |

Set `COMMS_DISPATCH=on` last, after every line on the console's readiness list
is green and after a test send to an allow-listed address.

## Before deploying

Run the whole of `supabase/schema.sql`. It is idempotent. The 6 October
section adds the `awaiting_confirmation` state, `comms_sequences.confirmed_at`
and `consents.confirmed_at`, and moves every resource sequence that was opened
without a confirmation back to `awaiting_confirmation`. The planner then sends
each of those people the confirmation request once.

Then, in the console: **Load the follow-up wordings**, read each one, and
**approve** the ones that may go. Nothing sends from an unapproved wording.
The confirmation request is one of them, and it must be approved before
anybody can confirm.

**Release the resources.** No module is selected until Sunil confirms its
released version. That is `RELEASES` in `src/data/resource-routing.ts`, a
reviewed pull request. While it is empty, confirmed sequences wait rather than
end.

## Reading the console

`/craft/admin/comms`, section **Resource follow-ups**:

- one row per sequence: the person, the resource they asked for, their role,
  every resource sent so far with its step, the next send, the state in the
  brief's words (`awaiting confirmation`, `active`, `paused`, `exhausted`,
  `unsubscribed`, `suppressed`, `failed`, `stopped`), when they confirmed,
  and any failed or unknown message;
- **Pause** is the "manual owner" control: use it when somebody takes the
  conversation over, or when a reply arrived somewhere this system cannot
  see. **Resume** re-checks permission and suppression, and the next send
  waits for the next allowed slot;
- the wordings, with approve and revoke;
- the buttons: load the wordings, run the follow-ups.

The **Failures** section lists every message that gave up or whose outcome is
unknown. An unknown outcome is reconciled against the provider reference
before any retry; it is never retried blind.

## When something is wrong

- **"table is not answering" banner**: the schema has not been run.
- **Nobody moves past "awaiting confirmation"**: the confirmation request is
  not approved, `COMMS_LINK_SECRET` is not set, or dispatch is off. The
  request is an ordinary outbox row; read its gates.
- **Confirmed sequences never plan anything**: nothing is released yet
  (`RELEASES`). The planner's line says so.
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

`npm test` runs `src/lib/comms/*.test.ts`: selection and the release guard;
the calendar (days 2, 5, 9 and 14, weekend roll, the 48-hour floor, weekly
after that); opening and confirming (one confirmation request, a re-send at
most once a day, no re-enrolment, a stopped sequence never confirmed by a
link); the planner with an in-memory store (the full October calendar, no
catch-up burst with dispatch off, pause on a reply and on an open application,
no repeat pause after a reviewed resume, exhaustion, unsubscribe, withdrawn
consent, two planners at once); confirmation and unsubscribe tokens; retry
planning; the provider's outcome mapping; webhook signatures; and the rendered
email.

## What is still not built

- **Reading replies.** Nothing reads the reply mailbox yet. Dispatch refuses to
  switch on without `COMMS_REPLY_MAILBOX`, and a reply recorded as a
  `comms_events` row of type `reply` pauses the sequence. Until a provider's
  inbound feed writes those rows, an operator pauses by hand.
- **The two role sentences the forms cannot reach.** The brief has four. Our
  role list has no architect, and no form asks about employer funding. The
  words are kept in `drip-templates.ts`, unused.
- **Pause on a meeting recorded in the pipeline** is covered through the open
  opportunity it belongs to, not read from `meetings` directly.
