// The week 2 clock, in one place, because twelve published pages carry it.
//
// WHY THIS FILE EXISTS. Each of week 2's six topics is a pair of pages, and
// check-teaching-pages.mjs requires the two pages of a pair to hold a
// byte-identical clock table. Twelve pages maintained by hand is twelve chances
// for one row to drift, and the drift is invisible until somebody reads the page.
// So the table is generated. Change a time here and rebuild the pair.
//
//   node scripts/teaching-clock.mjs 01:40 01:47 02:00 02:05 02:20
//
// prints the <thead>…</tbody> block with those rows bold, ready to paste between
// the <table> tags on both pages of that topic. Everything else is dimmed and
// labelled with the topic that owns it.
//
// The times here are the same ones in src/content/sessions/week-2.md's runOfShow
// and checkpoints. If you change the session, change this, rebuild the pairs, and
// run check:teaching on each.

export const ROWS = [
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

/** The clock table body, with `mine` (a set of HH:MM) bold and owned. */
export function clock(mine) {
  const out = [
    '<thead>',
    '  <tr><th>time</th><th>what happens</th><th>whose</th></tr>',
    '</thead>',
    '<tbody>',
  ];
  for (const [at, what, whose] of ROWS) {
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
  const mine = new Set(process.argv.slice(2));
  const unknown = [...mine].filter((t) => !ROWS.some(([at]) => at === t));
  if (unknown.length) {
    console.error(`not a row in the clock: ${unknown.join(', ')}`);
    process.exit(2);
  }
  console.log(clock(mine));
}
