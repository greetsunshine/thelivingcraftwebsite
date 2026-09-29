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

export const ROWS_W2 = [
  ['00:00', 'The night the money left', 'opening, shared'],
  ['00:10', 'One sealed prediction', 'opening, shared'],
  ['00:15', 'Two decision records on screen', 'block 1, shared'],
  ['00:23', 'The check, working', 'topic 1'],
  ['00:31', 'Three properties, and your own control fails one', 'shared'],
  ['00:37', 'The map, six kinds', 'shared'],
  ['00:42', 'Where a control can stand', 'topic 1'],
  ['00:46', 'Checkpoint 1', 'shared'],
  ['00:48', 'What did the check have to know', 'topic 1'],
  ['00:54', 'Build the limit, and count what it does', 'topic 1'],
  ['01:09', 'One refusal message, read out loud', 'topic 1'],
  ['01:12', 'A second team pays without asking', 'topic 1'],
  ['01:20', 'Move it to the dispatch', 'topic 1'],
  ['01:25', 'The row looks complete, and it is not', 'topic 1'],
  ['01:30', 'The rule this cycle exists to land', 'topic 1'],
  ['01:35', 'Stand up, five minutes', 'shared'],
  ['01:40', 'It refuses ₹8,400 that is genuinely owed', 'topic 2'],
  ['01:47', 'Build the gate, and the record', 'topic 2'],
  ['02:00', 'Set the timer', 'topic 2'],
  ['02:02', 'Checkpoint 2', 'shared'],
  ['02:05', 'Break, fifteen minutes', 'topic 2'],
  ['02:20', 'What the break did', 'topic 2'],
  ['02:26', 'Pay once, then watch your fix fail', 'topic 3'],
  ['02:55', 'The fix that holds', 'topic 3'],
  ['03:01', 'Where did the failure move', 'topic 3'],
  ['03:05', 'When the checker is a model', 'topic 6'],
  ['03:18', 'Checkpoint 3', 'shared'],
  ['03:20', 'Stand up, five minutes', 'shared'],
  ['03:25', 'The adversary round', 'topic 1'],
  ['03:55', 'Forty thousand a month', 'topic 5'],
  ['03:59', 'The policy table', 'topic 5'],
  ['04:19', 'Checkpoint 4', 'shared'],
  ['04:20', 'The quiz', 'shared'],
  ['04:32', 'The two mistakes, and their prices', 'topic 4'],
  ['04:39', 'Who is allowed to say what a system may do', 'topic 5'],
  ['04:50', 'Close', 'shared'],
];

// ── week 3 ──────────────────────────────────────────────────────────────────
// Evidence. Eight blocks, one break, two stand-ups, keyboards live at 00:23.
// Three build-break cycles, the same shape week 2 settled on: cycle A is the
// case set at 00:23, cycle B is the two graders at 01:55, cycle C is the
// agreement rate at 02:48. The review round at 03:17 is what the earlier blocks
// are compressed to pay for, exactly as the adversary round is in week 2.
//
// These times are the same ones in src/content/sessions/week-3.md's runOfShow
// and checkpoints. Change one, change both, rebuild the pair, run check:teaching.
export const ROWS_W3 = [
  ['00:00', "Last week's fix, still passing", 'opening, shared'],
  ['00:10', 'One sealed prediction', 'opening, shared'],
  ['00:15', 'Four kinds of case, and your suite has one', 'topic 1'],
  ['00:23', 'Write the case that already fails', 'topic 1'],
  ['00:40', 'Seven cases pass and the bug is still live', 'topic 1'],
  ['00:48', 'Checkpoint 1', 'shared'],
  ['00:50', 'The rule this cycle exists to land', 'topic 1'],
  ['00:55', 'Run the same case five times', 'topic 2'],
  ['01:05', 'Build the repeat, and report a rate', 'topic 2'],
  ['01:23', 'The case that looks perfect at ten runs', 'topic 2'],
  ['01:35', 'Stand up, five minutes', 'shared'],
  ['01:40', 'The rule is in a document now', 'topic 3'],
  ['01:48', 'Two failures, and one word for both', 'topic 3'],
  ['01:55', 'Build the second grader', 'topic 3'],
  ['02:13', 'Checkpoint 2', 'shared'],
  ['02:15', 'Break, fifteen minutes', 'shared'],
  ['02:30', 'It cites the wrong clause and scores full marks', 'topic 3'],
  ['02:40', 'Your grader agrees with you seven times out of ten', 'topic 4'],
  ['02:48', 'Build the agreement rate', 'topic 4'],
  ['03:05', 'The failure your grader cannot see', 'topic 4'],
  ['03:10', 'Checkpoint 3', 'shared'],
  ['03:12', 'Stand up, five minutes', 'shared'],
  ['03:17', 'The review round', 'topic 4'],
  ['03:46', 'Forty thousand disputes, and what you sample', 'topic 5'],
  ['03:51', 'The gate table', 'topic 5'],
  ['04:08', 'Checkpoint 4', 'shared'],
  ['04:10', 'The quiz', 'shared'],
  ['04:22', 'Cut the context, and watch the cliff', 'topic 6'],
  ['04:40', 'The same cases, a second version', 'topic 6'],
  ['04:50', 'Close', 'shared'],
];

export const WEEKS = { 1: ROWS_W1, 2: ROWS_W2, 3: ROWS_W3 };

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
