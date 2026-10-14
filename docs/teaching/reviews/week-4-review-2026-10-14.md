# Week 4 review, round 4 — 14 October 2026: MCP as four modules

*For Sunil. Not learner-facing.*

**The request.** Under the MCP server topic: "Remove the current content and add all the below
mentioned 4 submodules": protocol architecture and core primitives; transports, session flow and
lifecycle; security, isolation and threat mitigation; multi-server orchestration and production
operations.

**Your two decisions**, 14 October:

1. **Replace topics 3 and 4**, both MCP topics, 01:37 to 03:10. Topics 1, 2 and 5 are unchanged.
2. **Teach the current specification** (2026-07-28). Where the module text describes an older
   version, teach what 2026-07-28 does and name the old way once.

## How the four modules fit the clock

Four modules in 78 minutes would be about 19 minutes each if each became its own topic, for six
parts. The teaching standard says cut, not compress, so each topic carries **two modules** and
keeps its six parts and its timings. No clock time moved; four segment titles changed.

| Time | Segment | Module |
|---|---|---|
| 01:37 | The retry that paid ₹1,200 twice (unchanged, measured) | Opens 1 and 2 |
| 01:42 | **Module 1: protocol architecture and the three primitives** | 1 |
| 01:47 | **Module 2: transports, capability negotiation, and a call that runs too long** | 2 |
| 01:54 | Lab: expose two tools, and make the hint true (unchanged) | 1 |
| 02:31 | Eight notes in forty moved ₹2,50,000 each (unchanged, measured) | Opens 3 and 4 |
| 02:36 | **Module 3: the threat landscape, the proxy, and credentials** | 3 |
| 02:41 | **Module 4: many servers, one agent, and what to ask each owner** | 4 |
| 02:49 | Lab: write the proxy policy (unchanged, measured) | 3 |

The topics are renamed *MCP: protocol architecture, primitives and transports* and *MCP:
security, isolation and production operations*. Outcomes 3 and 4 and both checkpoints now name
the modules' skills.

## What each module now covers

- **Module 1.** The N × M integration problem; host, client (one per server) and server; JSON-RPC
  2.0; tools, resources and prompts with who decides to use each and their methods; JSON Schema,
  the MUST on validating inputs, and the two kinds of error; resource URIs, text and binary,
  templates, updates; prompts as templates a person picks.
- **Module 2.** No session: version and capabilities on every request, `server/discover`
  optional; the handle pattern for state; stdio versus Streamable HTTP with what each costs;
  progress, cancellation and the Tasks extension; a cancelled credit still paid.
- **Module 3.** A five-row threat landscape (privilege escalation through a tool result,
  injection in a result, tool poisoning and the rug pull, unauthorised access, context window
  pollution), each tied to the control that limits it; the proxy row; credential isolation and
  the ban on token passthrough; a person confirming calls that change state.
- **Module 4.** Week 2's ownership question, when adopting is right, the day 9 puzzle, the seven
  questions for an owner (bridge 7 requires these, so they moved here rather than going); then
  many servers at once: name collisions, routing, rate limits, timeouts and per-server tracing.

## New in the reference agent (branch `week-4-mcp-modules`, no model calls)

- **The billing server offers resources and prompts**: the seven policy clauses as
  `policy://clauses/{clause}`, and a `dispute_review` prompt. Provided, not part of the lab.
- **`make w4-mcp-wire`** (Module 2): the server as a real stdio subprocess; seven steps on the
  wire, ending with a credit cancelled after 0.3 seconds that the ledger shows was paid.
- **`make w4-mcp-many`** (Module 4): billing, the CRM and a KYC server; the `get_account`
  collision and `server.tool` routing; seven CRM calls refused by a rate limit of five per ten
  seconds; a KYC timeout at 2,000 ms; a per-server trace with estimated tokens (CRM about 175,
  billing 68, KYC 15).
- **A spec fix in the worked answer**: a missing `dispute_id` is now a tool execution error
  (`isError`), not -32602, because the specification places input validation there.

## How the out-of-date parts of the module text were handled

| Module text | What 2026-07-28 does | On the page |
|---|---|---|
| Session handshake, ping and heartbeats | No session, no `initialize`; capabilities on every request | Taught as current; the old way named once |
| SSE / HTTP transport | stdio and Streamable HTTP; SSE only as one request's reply stream | Taught as current; the old transport named once |
| `resources/subscribe` | `subscriptions/listen` | Taught as current; the old method named once |
| Stateful sessions over stateless HTTP | Nothing to manage; state behind a handle | Taught as the handle pattern |

## Left out, and why

- **A remote Streamable HTTP server built in the room**, and **a client manager built from
  scratch**. Each is a lab of its own. `make w4-mcp-wire` and `make w4-mcp-many` show both
  working, and both labs that stayed are measured on DeepSeek.
- **Token consumption per server is estimated** at four characters a token, and the page says
  so. It is the size of what each server adds to the context, not a model's bill.

## Not changed

Every measured number, both labs, topics 1, 2 and 5, and the clock's times.
