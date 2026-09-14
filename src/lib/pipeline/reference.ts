// The reference somebody quotes back at you.
//
// ───────────────────────────────────────────────────────────────────────────
// IT IS A LABEL, NOT A KEY. NOTHING MAY EVER BE LOOKED UP BY IT.
// ───────────────────────────────────────────────────────────────────────────
//
// The brief asks for two things that pull in opposite directions: "Show a
// submission reference" and "Never show another person's record from a guessed
// reference." A short, readable, quotable code satisfies the first and, the
// moment anything accepts it as an identifier, breaks the second — because
// short and readable also means guessable, and a `/status?ref=LC-7F3K2M` page
// is an enumeration attack with a friendly URL.
//
// The resolution is not a longer code or a rate limit. It is that NO PUBLIC
// ENDPOINT TAKES A REFERENCE AS INPUT. It exists so a person can say "I applied,
// my reference is LC-7F3K2M" in an email and an operator can find them in the
// console, where the operator is already authenticated. If you ever find
// yourself writing a lookup that accepts one of these, the thing to build is a
// signed link, not a validator.
//
// WHY THE ALPHABET IS SHORT
//
// This code gets read aloud down a phone line, typed from a screenshot, and
// written on paper. So: no I, no O, no 0, no 1 — the four characters people
// transcribe wrongly. No vowels either, which costs almost nothing here and
// removes any chance of the generator producing a word somebody would rather
// not quote back to us. Uppercase only, because mixed case invites "was that a
// capital?" and gains no entropy anyone needs.

/**
 * Twenty-eight characters: consonants and digits, minus the confusable four.
 * Six of them is about 481 million combinations — irrelevant as a security
 * property, since nothing authenticates on it, and ample to keep two of this
 * practice's applicants from ever sharing one.
 */
const ALPHABET = '23456789BCDFGHJKLMNPQRSTVWXZ';

const LENGTH = 6;

/**
 * A fresh reference.
 *
 * Uses the platform CSPRNG rather than Math.random — not because guessing
 * matters (nothing accepts these) but because Math.random on a warm serverless
 * instance is seeded per process, and two applications a second apart are
 * exactly the case where a weak generator embarrasses you.
 *
 * `crypto` is global in Node 18+ and in Vercel's runtime, so there is no import
 * and no fallback: an environment without it is one where far more than this is
 * broken, and a silent downgrade to a weaker source would be worse than the
 * throw.
 */
export function newReference(): string {
  const bytes = new Uint8Array(LENGTH);
  crypto.getRandomValues(bytes);

  let out = '';
  for (let i = 0; i < LENGTH; i += 1) {
    // Modulo bias here is real and completely immaterial: 256 % 28 = 4, so four
    // of the twenty-eight characters are 1.02× more likely. Rejection sampling
    // to fix that would add a loop to a function whose output authenticates
    // nothing. Noted rather than fixed, deliberately.
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }

  return `LC-${out}`;
}

/**
 * Shape check only — for the console's search box, so a typo is caught before
 * it becomes a query.
 *
 * This is NOT permission to build a public lookup. Read the note at the top of
 * this file before using it anywhere a visitor can reach.
 */
export const looksLikeReference = (value: string): boolean =>
  new RegExp(`^LC-[${ALPHABET}]{${LENGTH}}$`).test(value.trim().toUpperCase());
