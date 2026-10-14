# Week 4 review, round 3 — 13 October 2026

*For Sunil. Not learner-facing.*

Source: the "Notes Review" sheet, row 76, **Week4 · Building a Model Context Protocol Server ·
What this topic is for?**, Open. The row offered a four-module industry curriculum for MCP and
asked which parts suit topic 3, to include them in the industry's terms.

**Everything below was checked on 13 October against the 2026-07-28 specification** on
modelcontextprotocol.io (overview, architecture, transports, tools, resources, prompts), because
four parts of the offered curriculum describe an older version.

## What went into topic 3

**"What this topic is for"** now opens with two things a person can do by 02:15, then a table,
*Where the rest of MCP is taught*, mapping the row's four modules onto the course:

| Module | Where it is taught now |
|---|---|
| 1 · Architecture and primitives | **01:42, added**: host, client, server (one client per server); JSON-RPC 2.0; the N × M integration problem; the three primitives with who decides to use each and their methods. Tools are built at 01:54; resources and prompts are named, not built |
| 2 · Transports and lifecycle | Pre-work reading, as before. **01:47, added**: cancellation and the Tasks extension, because the 31-second credit is exactly the long-call case. The page says neither undoes a credit that ran |
| 3 · Security and isolation | **01:47, added**: the two kinds of error (protocol versus tool execution with `isError`), the spec's MUST on validating every input (the starting `issue_credit` accepts a negative amount, now an extension question), and the handle pattern for state, which is what the dispute id already is. Least privilege per tool stays in topic 4; injection through tool results stays in topics 2 and 4 |
| 4 · Running many servers | **Topic 4, 02:36, one sentence added** on tool name collisions and prefixing by server. Limits, timeouts and tracing were already in topics 3 and 5 |

**Left out on purpose, and the page says so:** a remote Streamable HTTP server lab, and a client
manager for three or more servers. Each is a lab of its own in a 38-minute topic, and neither
changes the trust boundary the week is about.

## Four corrections to the offered curriculum

The pages do not repeat these, and the notes explain why:

1. **There is no session or `initialize` handshake in 2026-07-28.** Every request carries its own
   version and capabilities; `server/discover` is optional up-front discovery. The row's
   "session handshake", "ping/heartbeats" and "stateful client sessions across stateless HTTP"
   describe earlier versions.
2. **The standalone SSE transport is gone.** The two transports are stdio and Streamable HTTP;
   a reply may stream as SSE inside one request.
3. **Resource updates use `subscriptions/listen`**, not `resources/subscribe`.
4. **Servers no longer send requests to the client.** A server that needs input returns an
   `InputRequiredResult` inside its reply.

## Elsewhere

- The glossary gains eleven MCP terms (host, N × M, JSON-RPC 2.0, the primitives, capability
  negotiation, the transports, the two error kinds, handle, cancellation and Tasks, tool name
  collision, credential isolation).
- **Two stale lines fixed on the way:** topic 3's "broken" list said 25 calls where the rerun
  measured up to 30; the notes' 01:37 trace still showed the old simulated decision instead of
  DeepSeek's.
- The session file's topic 3 summary names the architecture and the two error kinds.

## Nothing measured changed

Row 76 adds explanation, not measurements. No lab, number, outcome or checkpoint changed. The
negative-amount point is from reading `src/w4_mcp_server.py`, where `issue_credit` passes
`float(args["amount"])` straight to the ledger.
