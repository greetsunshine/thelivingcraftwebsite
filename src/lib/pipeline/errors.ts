// What may be logged when a database call fails.
//
// ───────────────────────────────────────────────────────────────────────────
// NEVER `error.message`. IT QUOTES THE VALUE IT CHOKED ON.
// ───────────────────────────────────────────────────────────────────────────
//
// This is the rule several files state in their own headers and then broke
// anyway, which is the usual sign that it needed one owner rather than four
// restatements.
//
// A PostgREST or Postgres error message is not a category. It quotes the
// offending literal, because that is what makes it useful to a developer
// holding the query:
//
//     invalid input syntax for type uuid: "sunil@example.com"
//     duplicate key value violates unique constraint … Key (normalised_email)=(a@b.com)
//     value too long for type character varying(200)  ← with the value, on some paths
//
// And a RAISE in our own plpgsql interpolates whatever it was given.
//
// Every literal reaching these functions came out of a public form: a name, an
// address, a phone number, or four paragraphs somebody wrote about their
// architecture. Logging the message copies that into a log aggregator, which is
// a system nobody scoped to hold personal data, which nobody put a retention
// policy on, and which several people can read who cannot read the database.
//
// The SQLSTATE says what went wrong without saying whose data it was. `23505`
// is a unique violation whether the key was an email address or a request key,
// and that is the whole diagnostic value the message was carrying anyway.
//
// ───────────────────────────────────────────────────────────────────────────
// IF YOU NEED THE MESSAGE TO DEBUG SOMETHING
// ───────────────────────────────────────────────────────────────────────────
//
// Reproduce it against synthetic data — `npm run seed` exists for exactly this
// and every row it writes is on a `.invalid` domain. Do not reach for the
// message on a path a real visitor touches, and do not add a "verbose mode"
// flag: the flag gets set on production during an incident, by somebody in a
// hurry, and then never unset.

/**
 * The SQLSTATE, or the error's class name, or 'unknown'.
 *
 * Deliberately returns a string rather than throwing or returning null: this is
 * called inside a `catch`, and a logging helper that can itself fail is a
 * logging helper that turns a handled error into an unhandled one.
 */
export const sqlstate = (error: unknown): string =>
  (error as { code?: string })?.code ??
  (error as { name?: string })?.name ??
  'unknown';
