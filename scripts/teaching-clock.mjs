// Every week's clock, in one place, because a published page carries it and a
// page carrying a hand-typed table drifts.
//
// WHY THIS FILE EXISTS. Each of week 2's six topics is a pair of pages, and
// check-teaching-pages.mjs requires the two pages of a pair to hold a
// byte-identical clock table. Twelve pages maintained by hand is twelve chances
// for one row to drift, and the drift is invisible until somebody reads the page.
// So the table is generated. Change a time here and rebuild the pair.
//
//   node scripts/teaching-clock.mjs 01:40 01:47 02:00 02:05 02:20
//   node scripts/teaching-clock.mjs --week 3 00:15 00:23 00:40 00:48 00:50
//
// `--week` defaults to 2, so every command written before week 3 existed still
// prints the same table. `ROWS` is still week 2's rows for the same reason.
//
// prints the <thead>…</tbody> block with those rows bold, ready to paste between
// the <table> tags on both pages of that topic. Everything else is dimmed and
// labelled with the topic that owns it.
//
// The times here are the same ones in src/content/sessions/week-2.md's runOfShow
// and checkpoints. If you change the session, change this, rebuild the pairs, and
// run check:teaching on each.

// ââ week 1 ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
//
// Seven topics, the same count as week 2, and topic 0 is the frame for the same
// reason: the room draws the loop and watches â¹3,600 leave before anything is
// named, and none of that belonged to a topic when the pages were hand-built in
// August.
//
// Two times carry two rows each. 01:10 is a checkpoint AND a stand-up, and 02:05
// is a checkpoint AND the break. That is week 1's own convention, and dayPlan()
// in src/lib/craft/schedule.ts sorts the checkpoint first, because the words in
// the room are "read these before you stand up".
//
// These times are the same ones in src/content/sessions/week-1.md's runOfShow
// and in docs/teaching/week-1-script.md.
export const ROWS_W1 = [
  ['00:00', 'The five outcomes, and your first rating', 'opening, shared'],
  ['00:08', 'Four questions from the pre-work', 'opening, shared'],
  ['00:15', 'The case that works', 'topic 0'],
  ['00:18', 'Draw what you just watched', 'topic 0'],
  ['00:23', 'Break it once, before anything has a name — ₹3,600', 'topic 0'],
  ['00:31', 'Name what you drew', 'topic 0'],
  ['00:38', 'One run is many calls', 'topic 1'],
  ['00:46', 'Inside one step', 'topic 1'],
  ['00:57', 'Can we not just make the thinking better?', 'topic 1'],
  ['01:03', 'Odds, or what is possible', 'topic 1'],
  ['01:10', 'Checkpoint 1', 'shared'],
  ['01:10', 'Stand up, five minutes', 'shared'],
  ['01:15', 'It pays an account that does not exist — ₹5,000', 'topic 2'],
  ['01:23', 'It follows a rule an attacker wrote — ₹2,50,000', 'topic 2'],
  ['01:36', 'It refuses a customer who was owed the money — ₹0', 'topic 2'],
  ['01:44', 'The pattern', 'topic 2'],
  ['01:53', 'So how would you stop this?', 'topic 2'],
  ['01:58', 'Three ideas, and they are a tour of the harness', 'topic 2'],
  ['02:02', 'The only expectation was written by the attacker', 'topic 2'],
  ['02:05', 'Checkpoint 2', 'shared'],
  ['02:05', 'Break, fifteen minutes', 'shared'],
  ['02:20', 'How every drill runs', 'topic 3'],
  ['02:25', 'Drill 1, make the failure say its name', 'topic 3'],
  ['02:40', 'Drill 2, grade the tools by consequence', 'topic 3'],
  ['02:50', 'Drill 3, check the arguments before you dispatch', 'topic 3'],
  ['03:02', 'Comparing two models', 'topic 4'],
  ['03:12', 'Then stop', 'topic 4'],
  ['03:20', 'Checkpoint 3', 'shared'],
  ['03:20', 'Stand up, five minutes', 'shared'],
  ['03:25', 'The system at forty thousand a month', 'topic 5'],
  ['03:28', 'Five questions, two per pair', 'topic 5'],
  ['03:40', 'Back to the room', 'topic 5'],
  ['03:50', 'Write the boundary down', 'topic 5'],
  ['04:02', "Review another pair's", 'topic 5'],
  ['04:10', "The leader's framing", 'topic 5'],
  ['04:15', 'Checkpoint 4', 'shared'],
  ['04:20', 'The quiz', 'shared'],
  ['04:30', 'What is durable when the models keep moving', 'topic 6'],
  ['04:40', 'Where the demand actually is', 'topic 6'],
  ['04:50', 'Close', 'shared'],
];

// Week 2, resequenced 30 September: eight topics, numbered 0 to 7, and each one
// is a single run on the clock.
//
// Rebuilt 30 September against docs/teaching/generation-prompt.md: four topics,
// each ending on its own quiz and a written takeaway, and a fixed close of
// recall, teardown, quiz, spoken takeaway and the second rating. What that cost:
// - topic 0 (the frame) is the opening run of topic 1, because it had no lab;
// - governance is no longer a topic. Its five questions are the teardown at
//   04:15, and the policy table row is built on the board there;
// - "Who is allowed" (11 min) and "The two mistakes" (7 min) are cut from the
//   room. The second is reading inside topic 2, where the ₹8,400 plants it;
// - "Where did the failure move" is the recall at 04:05.
// The full list, with reasons, is at the top of notes/week-2-guardrails.md.
// Revised the same day against the learners' expected topics: 01:09 folded
// into the lab's check step, and 03:18 became the tiered-checker segment.
export const ROWS_W2 = [
  ['00:00', 'The night the money left', 'opening, shared'],
  ['00:10', 'One sealed prediction', 'opening, shared'],
  ['00:15', 'Two decision records on screen', 'topic 1'],
  ['00:23', 'The check, working', 'topic 1'],
  ['00:31', 'Three properties, and your own control fails one', 'topic 1'],
  ['00:37', 'The map, six kinds', 'topic 1'],
  ['00:42', 'Where a control can stand', 'topic 1'],
  ['00:48', 'What did the check have to know', 'topic 1'],
  ['00:54', 'Hands-on lab: build the limit, and count what it does', 'topic 1'],
  ['01:12', 'A second team pays without asking', 'topic 1'],
  ['01:20', 'Move it to the dispatch', 'topic 1'],
  ['01:25', 'The row looks complete, and it is not', 'topic 1'],
  ['01:30', 'The rule this cycle exists to land', 'topic 1'],
  ['01:35', 'Checkpoint 1', 'shared'],
  ['01:35', 'Topic 1 quiz and takeaway', 'topic 1'],
  ['01:39', 'Short break, five minutes', 'shared'],
  ['01:44', 'It refuses ₹8,400 that is genuinely owed', 'topic 2'],
  ['01:51', 'Hands-on lab: build the gate, and the record', 'topic 2'],
  ['02:04', 'Set the timer', 'topic 2'],
  ['02:06', 'Checkpoint 2', 'shared'],
  ['02:09', 'Break, fifteen minutes', 'topic 2'],
  ['02:24', 'What the break did', 'topic 2'],
  ['02:30', 'Topic 2 quiz and takeaway', 'topic 2'],
  ['02:34', 'Hands-on lab: pay once, then watch your fix fail', 'topic 3'],
  ['03:03', 'The fix that holds', 'topic 3'],
  ['03:09', 'Checkpoint 3', 'shared'],
  ['03:09', 'Topic 3 quiz and takeaway', 'topic 3'],
  ['03:13', 'Short break, five minutes', 'shared'],
  ['03:18', 'Layered defence: the tiered gateway, and its latency tax', 'topic 4'],
  ['03:31', 'Hands-on lab: the adversary round', 'topic 4'],
  ['04:01', 'Topic 4 quiz and takeaway', 'topic 4'],
  ['04:05', 'Recall: every control, and where its failure moved', 'close, shared'],
  ['04:15', 'Architectural teardown: the agent at forty thousand a month', 'close, shared'],
  ['04:40', 'Checkpoint 4', 'shared'],
  ['04:40', 'The quiz', 'shared'],
  ['04:50', 'Takeaway, said out loud', 'close, shared'],
  ['04:55', 'Close', 'shared'],
];

// ── week 3 ──────────────────────────────────────────────────────────────────
// Evidence. FIVE topics, not six, and the arithmetic is the reason. Each topic
// carries the six parts the teaching standard asks for: the narrative, the
// concept, components and design, a hands-on lab, what firms at enterprise scale
// use, and a three-question quiz. That is 39 minutes. The close takes 58 minutes
// (recall 10, teardown 28, quiz 10, takeaway 5, the second rating 5), the opening
// takes 15, the break 15 and the two pair discussions 10. That leaves 202 minutes
// for topics. Five fit. Six do not.
//
// The old topics 1 and 2 merged into "LLM evaluation (evals)". A case set and a
// run count are not two ideas. Together they are what an evaluation harness is.
//
// Every row is claimed by a segment in scripts/teaching-content/week-3.mjs, and
// the build fails if one is not. The same times are in
// src/content/sessions/week-3.md's runOfShow and checkpoints, and in the ## HH:MM
// headings of docs/teaching/notes/week-3-evidence.md. Change one, change all four.
//
// Durations add up to exactly 05:00. They were generated rather than typed.
export const ROWS_W3 = [
  ['00:00', "Opening: what today is for", 'opening, shared'],
  ['00:05', "The first self-rating", 'opening, shared'],
  ['00:10', "One sealed prediction", 'opening, shared'],
  ['00:15', "Last week the fix passed and proved nothing", 'topic 1'],
  ['00:21', "What an evaluation harness is", 'topic 1'],
  ['00:27', "Four classes of case, and what each one costs", 'topic 1'],
  ['00:36', "Lab: write the case your tests cannot fail", 'topic 1'],
  ['00:54', "At enterprise scale: who runs evaluations, and the cost", 'topic 1'],
  ['00:57', "Topic quiz: evaluation", 'topic 1'],
  ['01:00', "Evaluation: you can now, and your takeaway", 'topic 1'],
  ['01:01', "Pair discussion: which class is your suite missing", 'shared'],
  ['01:06', "The rule is in a document now", 'topic 2'],
  ['01:11', "What retrieval-augmented generation is", 'topic 2'],
  ['01:16', "Two failures, and one word for both", 'topic 2'],
  ['01:23', "Lab: build the retrieval grader", 'topic 2'],
  ['01:37', "At enterprise scale: retrieval in regulated work", 'topic 2'],
  ['01:40', "Topic quiz: retrieval", 'topic 2'],
  ['01:43', "Retrieval: you can now, and your takeaway", 'topic 2'],
  ['01:45', "It cites the wrong clause and scores full marks", 'topic 3'],
  ['01:50', "What model-based grading is", 'topic 3'],
  ['01:55', "The failure a grader cannot see", 'topic 3'],
  ['02:02', "Lab: measure how far your grader agrees with you", 'topic 3'],
  ['02:16', "At enterprise scale: who grades at volume", 'topic 3'],
  ['02:19', "Topic quiz: model-based grading", 'topic 3'],
  ['02:22', "Model-based grading: you can now, and your takeaway", 'topic 3'],
  ['02:24', "Break", 'shared'],
  ['02:39', "Forty thousand disputes, and what you sample", 'topic 4'],
  ['02:44', "What a release gate is", 'topic 4'],
  ['02:49', "Who owns the pass bar", 'topic 4'],
  ['02:56', "Lab: write one row of the gate table", 'topic 4'],
  ['03:10', "At enterprise scale: evaluation platforms", 'topic 4'],
  ['03:13', "Topic quiz: release gates", 'topic 4'],
  ['03:16', "Release gates: you can now, and your takeaway", 'topic 4'],
  ['03:18', "Pair discussion: who owns your pass bar", 'shared'],
  ['03:23', "Cut the policy text and watch the answers fail", 'topic 5'],
  ['03:28', "What context engineering is", 'topic 5'],
  ['03:33', "Why the curve falls off a cliff", 'topic 5'],
  ['03:40', "Lab: find your own cliff", 'topic 5'],
  ['03:54', "At enterprise scale: context budgets in production", 'topic 5'],
  ['03:57', "Topic quiz: context engineering", 'topic 5'],
  ['04:00', "Context engineering: you can now, and your takeaway", 'topic 5'],
  ['04:02', "Recall: every control the agent gained today", 'close, shared'],
  ['04:12', "Architectural teardown", 'close, shared'],
  ['04:40', "End-of-week quiz", 'close, shared'],
  ['04:50', "Takeaway, said out loud", 'close, shared'],
  ['04:55', "The same five statements again", 'close, shared'],
];

// Week 4 · Securing AI Agents (renamed from "Attack your own system" on 9 October)
//
// FIVE TOPICS, from bridge 7 of docs/teaching/threads.md (Sunil, 7 October
// 2026): direct injection, indirect injection through retrieval, build an MCP
// server, use and contain one you did not write, and the runaway loop.
//
// Same arithmetic as week 3. The opening takes 15, the close 58, the break 15
// and the two pair discussions 10, which leaves 202 minutes for five topics.
// Topic 4 takes 40, because the adoption questions are a segment of their own.
// Topic 5 takes 46, because the ten-minute production-monitoring segment that
// bridge 6 §4 owes is inside it, after the lab and before the products.
//
// Every row is claimed by a segment in scripts/teaching-content/week-4.mjs, and
// the build fails if one is not. The same times are in
// src/content/sessions/week-4.md's runOfShow and checkpoints, in the ## HH:MM
// headings of docs/teaching/notes/week-4-untrusted-input.md, and in the
// comments above each w4- target in the reference agent's Makefile.
//
// Durations add up to exactly 05:00.
export const ROWS_W4 = [
  ['00:00', "Opening: what today is for", 'opening, shared'],
  ['00:05', "The first self-rating", 'opening, shared'],
  ['00:10', "One sealed prediction", 'opening, shared'],
  ['00:15', "Who added a line to the prompt after week 1", '1 · Direct prompt injection'],
  ['00:21', "What prompt injection is, and the four places to stop it", '1 · Direct prompt injection'],
  ['00:26', "Ten attack vectors, measured on a real model", '1 · Direct prompt injection'],
  ['00:33', "Lab: break the agent level by level, and keep every win as a case", '1 · Direct prompt injection'],
  ['00:47', "At enterprise scale: classifiers and red-team suites, and the cost", '1 · Direct prompt injection'],
  ['00:50', "Topic quiz: direct injection", '1 · Direct prompt injection'],
  ['00:53', "Direct injection: you can now, and your takeaway", '1 · Direct prompt injection'],
  ['00:54', "Pair discussion: which of your fields can an outsider write", 'shared'],
  ['00:59', "A clause nobody reviewed pays ₹50,000", '2 · Indirect injection'],
  ['01:04', "What indirect injection is, and the four layers of defence", '2 · Indirect injection'],
  ['01:09', "Two kinds of check: what the text says, and where it came from", '2 · Indirect injection'],
  ['01:16', "Lab: build the check, and measure its miss rate", '2 · Indirect injection'],
  ['01:30', "At enterprise scale: content scanning and document signing", '2 · Indirect injection'],
  ['01:33', "Topic quiz: indirect injection", '2 · Indirect injection'],
  ['01:36', "Indirect injection: you can now, and your takeaway", '2 · Indirect injection'],
  ['01:37', "The retry that paid ₹1,200 twice", '3 · Building an MCP server'],
  ['01:42', "What an MCP server is", '3 · Building an MCP server'],
  ['01:47', "Tool size, schema, hints, and whose code checks the token", '3 · Building an MCP server'],
  ['01:54', "Lab: expose two tools, and make the hint true", '3 · Building an MCP server'],
  ['02:09', "At enterprise scale: SDKs and hosted servers", '3 · Building an MCP server'],
  ['02:12', "Topic quiz: building an MCP server", '3 · Building an MCP server'],
  ['02:15', "Building an MCP server: you can now, and your takeaway", '3 · Building an MCP server'],
  ['02:16', "Break", 'shared'],
  ['02:31', "Four notes in twenty moved ₹2,50,000 each", '4 · Least privilege for MCP'],
  ['02:36', "What least privilege means for a tool you did not write", '4 · Least privilege for MCP'],
  ['02:41', "Before you adopt it: what to ask its owner", '4 · Least privilege for MCP'],
  ['02:49', "Lab: write the proxy policy", '4 · Least privilege for MCP'],
  ['03:04', "At enterprise scale: MCP gateways and registries", '4 · Least privilege for MCP'],
  ['03:07', "Topic quiz: containing a server you did not write", '4 · Least privilege for MCP'],
  ['03:10', "Containment: you can now, and your takeaway", '4 · Least privilege for MCP'],
  ['03:11', "Pair discussion: which of your tools holds a token it does not need", 'shared'],
  ['03:16', "Twenty-five calls for a ticket that needs two", '5 · Circuit breakers and monitoring'],
  ['03:21', "What a circuit breaker is", '5 · Circuit breakers and monitoring'],
  ['03:25', "Three limits, and what each one misses", '5 · Circuit breakers and monitoring'],
  ['03:31', "Lab: build the breaker", '5 · Circuit breakers and monitoring'],
  ['03:45', "The night it happened: which number moved, and who saw it", '5 · Circuit breakers and monitoring'],
  ['03:55', "At enterprise scale: tracing and monitoring", '5 · Circuit breakers and monitoring'],
  ['03:58', "Topic quiz: the runaway loop", '5 · Circuit breakers and monitoring'],
  ['04:01', "The runaway loop: you can now, and your takeaway", '5 · Circuit breakers and monitoring'],
  ['04:02', "Recall: every attack you ran today, and the control it met", 'close, shared'],
  ['04:12', "Architectural teardown", 'close, shared'],
  ['04:40', "End-of-week quiz", 'close, shared'],
  ['04:50', "Takeaway, said out loud", 'close, shared'],
  ['04:55', "The same five statements again", 'close, shared'],
];

export const WEEKS = { 1: ROWS_W1, 2: ROWS_W2, 3: ROWS_W3, 4: ROWS_W4 };

// Kept so that anything written against the week 2 export still reads week 2.
export const ROWS = ROWS_W2;

/** The clock table body, with `mine` (a set of HH:MM) bold and owned. */
export function clock(mine, rows = ROWS_W2) {
  const out = [
    '<thead>',
    '  <tr><th>time</th><th>what happens</th><th>whose</th></tr>',
    '</thead>',
    '<tbody>',
  ];
  for (const [at, what, whose] of rows) {
    out.push(
      mine.has(at)
        ? `  <tr><td><strong>${at}</strong></td><td><strong>${what}</strong></td><td><strong>this topic</strong></td></tr>`
        : `  <tr class="quiet" style="color:#526259"><td>${at}</td><td>${what}</td><td>${whose}</td></tr>`,
    );
  }
  out.push('</tbody>');
  return out.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const at = argv.indexOf('--week');
  const week = at < 0 ? 2 : Number(argv[at + 1]);
  const rows = WEEKS[week];
  if (!rows) {
    console.error(`no clock for week ${argv[at + 1]}. Weeks: ${Object.keys(WEEKS).join(', ')}`);
    process.exit(2);
  }
  // Drop the flag and its value, and NOTHING ELSE. `i !== at + 1` alone is
  // wrong when the flag is absent: `at` is -1, so `at + 1` is 0 and the filter
  // silently eats the FIRST time you asked for. Every command in this file's own
  // header uses the no-flag form, so that is the form people type, and the only
  // symptom is one row that should have been bold and is not.
  const times = at < 0 ? argv : argv.filter((_, i) => i !== at && i !== at + 1);
  const mine = new Set(times);
  const unknown = [...mine].filter((t) => !rows.some(([t0]) => t0 === t));
  if (unknown.length) {
    console.error(`not a row in the week ${week} clock: ${unknown.join(', ')}`);
    process.exit(2);
  }
  console.log(clock(mine, rows));
}
