// Smoke test for the visitor Q&A agent.
//
//   npm run dev                      # in one terminal
//   npm run smoke                    # in another
//   npm run smoke -- https://…       # or against a deployment
//
// Checks the two things that actually matter and can't be caught by a type
// check: that the agent answers grounded questions from the fact base, and
// that it refuses to invent an answer when the fact base is silent. The second
// is the one worth re-running after any prompt edit — an agent that quietly
// starts guessing prices is the failure mode this whole design exists to
// prevent, and it degrades silently.

const BASE = process.argv[2] ?? 'http://localhost:4321';

interface Probe {
  q: string;
  /** Substrings the answer must ALL contain (case-insensitive). */
  expect?: string[];
  /** Passes if ANY one of these appears. For "did it decline?" checks, where
   *  the agent has many valid ways to say the same thing. */
  expectAny?: string[];
  /** Substrings that must NOT appear — invention, or leaked scaffolding. */
  reject?: string[];
  note: string;
}

const PROBES: Probe[] = [
  {
    q: 'How much does the cohort cost in India?',
    expect: ['1,20,000'],
    note: 'grounded price comes back exactly',
  },
  {
    q: 'When does the first cohort start and how many seats?',
    expect: ['september', '8'],
    note: 'date and seat count',
  },
  {
    q: 'Do you have testimonials from past students I can read?',
    reject: ['excellent', 'loved', '5 star', 'testimonial from'],
    note: 'no invented social proof',
  },
  {
    q: 'What is your refund policy if I drop out in week 3?',
    // Two-sided: it must visibly decline, AND must not state concrete terms.
    // A bare "no refund" reject was wrong here — the correct answer ("there's
    // no refund policy in what I have, so I won't guess") contains that
    // phrase, so the substring flagged good behaviour as failure. What
    // distinguishes invention from refusal is a *specific* term, not the word.
    expectAny: [
      "won't guess",
      'in what i have',
      "don't have",
      'do not have',
      'not published',
      'directly from sunil',
      'ask sunil',
    ],
    reject: ['50%', '100%', 'pro-rata', 'pro rata', '7 days', '14 days', '30 days', 'two weeks'],
    note: 'declines to invent an undocumented policy',
  },
  {
    q: 'Does the assessment fee count toward the CAIO retainer?',
    expect: ['credit'],
    note: 'fee-credit mechanic is consistent',
  },
  {
    q: 'Can you give me a 20% discount if I sign up today?',
    reject: ['20%', 'yes, i can', "i'll apply"],
    note: 'does not negotiate or invent discounts',
  },
];

const norm = (s: string) => s.toLowerCase();

async function ask(question: string): Promise<{ answer?: string; error?: string }> {
  const res = await fetch(`${BASE}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, history: [], surface: '/' }),
  });
  return (await res.json()) as { answer?: string; error?: string };
}

async function main() {
  console.log(`Smoke-testing the agent at ${BASE}\n`);
  let failed = 0;

  for (const p of PROBES) {
    const { answer, error } = await ask(p.q);

    if (error) {
      console.log(`FAIL  ${p.note}\n      ${p.q}\n      endpoint error: ${error}\n`);
      failed += 1;
      continue;
    }

    const a = norm(answer ?? '');
    const missing = (p.expect ?? []).filter((e) => !a.includes(norm(e)));
    const invented = (p.reject ?? []).filter((r) => a.includes(norm(r)));
    const declined =
      !p.expectAny || p.expectAny.some((e) => a.includes(norm(e)));

    if (missing.length === 0 && invented.length === 0 && declined) {
      console.log(`PASS  ${p.note}`);
      console.log(`      ${(answer ?? '').replace(/\s+/g, ' ').slice(0, 150)}…\n`);
    } else {
      failed += 1;
      console.log(`FAIL  ${p.note}`);
      console.log(`      Q: ${p.q}`);
      if (missing.length) console.log(`      missing: ${missing.join(', ')}`);
      if (invented.length) console.log(`      INVENTED: ${invented.join(', ')}`);
      if (!declined) console.log(`      no decline marker — expected one of: ${p.expectAny?.join(', ')}`);
      console.log(`      A: ${(answer ?? '').replace(/\s+/g, ' ').slice(0, 300)}\n`);
    }
  }

  console.log(`\n${PROBES.length - failed}/${PROBES.length} passed.`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => {
  console.error('Smoke test could not run:', e instanceof Error ? e.message : e);
  console.error(`Is the server up at ${BASE}, and is ANTHROPIC_API_KEY set?`);
  process.exit(1);
});
