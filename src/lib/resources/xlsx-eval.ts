// A reader and a small formula evaluator for the tool workbooks. TEST SUPPORT
// ONLY: nothing on the site imports this; tool-workbooks.test.ts does.
//
// It exists so a test can prove that a committed workbook scores the way its
// web page does, by reading the formulas out of the file itself rather than
// trusting the script that wrote them. It implements exactly the functions
// scripts/tool-workbooks.py is allowed to use, with Excel's own rules where they
// differ from JavaScript's:
//
//   * text comparison ignores case, and a blank cell equals both "" and 0;
//   * a number is less than any text, and text less than TRUE/FALSE;
//   * ROUND works on the value as Excel sees it, to 15 significant digits,
//     and rounds halves away from zero;
//   * SUM and COUNT skip text in a range; COUNTA counts anything not blank;
//   * COUNTIF with a text criterion matches text cells, ignoring case.
//
// Any other function, a reference to another sheet, or a COUNTIF criterion
// with an operator or a wildcard throws, so a formula the evaluator does not
// understand fails the test instead of passing it by accident.

import { inflateRawSync } from 'node:zlib';

// ── the file ────────────────────────────────────────────────────────────────

/** The entries of a ZIP archive, by name. Stored and deflated entries only. */
export function unzip(buf: Buffer): Map<string, Buffer> {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map<string, Buffer>();
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory');
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + size);
    out.set(name, method === 8 ? inflateRawSync(data) : Buffer.from(data));
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

const unescapeXml = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

export type Value = number | string | boolean | null;

export interface Sheet {
  name: string;
  /** Literal values, by address such as "F15". */
  values: Map<string, Value>;
  /** Formula text without the leading "=", by address. */
  formulas: Map<string, string>;
  /** Sheet-scoped defined names, to the address they point at. */
  names: Map<string, string>;
}

export function readWorkbook(buf: Buffer): Map<string, Sheet> {
  const files = unzip(buf);
  const text = (n: string) => {
    const b = files.get(n);
    if (!b) throw new Error(`missing ${n}`);
    return b.toString('utf8');
  };
  const wb = text('xl/workbook.xml');
  const rels = text('xl/_rels/workbook.xml.rels');
  const target = new Map<string, string>();
  for (const m of rels.matchAll(/<Relationship\b[^>]*>/g)) target.set(attr(m[0], 'Id')!, attr(m[0], 'Target')!);
  const shared: string[] = files.has('xl/sharedStrings.xml')
    ? [...text('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
        unescapeXml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')),
      )
    : [];

  const sheets = new Map<string, Sheet>();
  const order: Sheet[] = [];
  for (const m of wb.matchAll(/<sheet\b[^>]*>/g)) {
    const name = unescapeXml(attr(m[0], 'name')!);
    const rid = attr(m[0], 'r:id')!;
    const path = 'xl/' + target.get(rid)!.replace(/^\/?xl\//, '');
    const xml = text(path);
    const sheet: Sheet = { name, values: new Map(), formulas: new Map(), names: new Map() };
    for (const c of xml.matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const [, ref, attrs, body = ''] = c;
      const t = attr(`<c${attrs}>`, 't');
      const f = body.match(/<f>([\s\S]*?)<\/f>/);
      if (f) {
        sheet.formulas.set(ref, unescapeXml(f[1]));
        continue;
      }
      const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (t === 'inlineStr') sheet.values.set(ref, unescapeXml([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('')));
      else if (t === 's' && v !== undefined) sheet.values.set(ref, shared[Number(v)]);
      else if (t === 'str' && v !== undefined) sheet.values.set(ref, unescapeXml(v));
      else if (t === 'b' && v !== undefined) sheet.values.set(ref, v === '1');
      else if (v !== undefined && v !== '') sheet.values.set(ref, Number(v));
    }
    sheets.set(name, sheet);
    order.push(sheet);
  }
  for (const m of wb.matchAll(/<definedName\b([^>]*)>([^<]*)<\/definedName>/g)) {
    const local = attr(`<x${m[1]}>`, 'localSheetId');
    if (local === undefined) continue;
    const ref = unescapeXml(m[2]).split('!')[1].replace(/\$/g, '');
    order[Number(local)].names.set(attr(`<x${m[1]}>`, 'name')!, ref);
  }
  return sheets;
}

// ── the formulas ────────────────────────────────────────────────────────────

export const FUNCTIONS = ['IF', 'AND', 'OR', 'SUM', 'COUNT', 'COUNTA', 'COUNTIF', 'COUNTIFS', 'CHOOSE', 'ROUND', 'LEN', 'TRIM'] as const;

type Node =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'bool'; v: boolean }
  | { k: 'ref'; a: string }
  | { k: 'range'; a: string; b: string }
  | { k: 'call'; f: string; args: Node[] }
  | { k: 'neg'; x: Node }
  | { k: 'bin'; op: string; l: Node; r: Node };

const TOKEN =
  /\s*(?:(?<num>\d+(?:\.\d+)?)|(?<str>"(?:[^"]|"")*")|(?<fn>[A-Z][A-Z0-9.]*)\(|(?<bool>TRUE|FALSE)\b|(?<range>\$?[A-Z]{1,3}\$?\d+:\$?[A-Z]{1,3}\$?\d+)|(?<ref>\$?[A-Z]{1,3}\$?\d+)|(?<op><=|>=|<>|[=<>&+\-*/(),]))/y;

function tokenize(src: string) {
  const out: { t: string; v: string }[] = [];
  TOKEN.lastIndex = 0;
  let i = 0;
  while (i < src.length) {
    if (/^\s*$/.test(src.slice(i))) break;
    TOKEN.lastIndex = i;
    const m = TOKEN.exec(src);
    if (!m || !m.groups) throw new Error(`cannot read formula at "${src.slice(i, i + 20)}": ${src}`);
    const g = m.groups;
    const [t, v] = Object.entries(g).find(([, val]) => val !== undefined)!;
    out.push({ t, v: t === 'fn' ? v : v });
    i = TOKEN.lastIndex;
  }
  return out;
}

export function parse(src: string): Node {
  // A reference to another sheet ('Sheet'!A1) has no token here, so it throws
  // in tokenize(), which is the point: every formula must stay on its sheet.
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (v?: string) => {
    const t = toks[p++];
    if (!t || (v !== undefined && t.v !== v)) throw new Error(`expected ${v} in ${src}`);
    return t;
  };
  const LEVELS = [['=', '<>', '<', '>', '<=', '>='], ['&'], ['+', '-'], ['*', '/']];
  const level = (n: number): Node => {
    if (n === LEVELS.length) return unary();
    let l = level(n + 1);
    while (peek()?.t === 'op' && LEVELS[n].includes(peek().v)) {
      const op = eat().v;
      l = { k: 'bin', op, l, r: level(n + 1) };
    }
    return l;
  };
  const unary = (): Node => {
    if (peek()?.t === 'op' && peek().v === '-') {
      eat();
      return { k: 'neg', x: unary() };
    }
    return primary();
  };
  const primary = (): Node => {
    const t = eat();
    if (t.t === 'num') return { k: 'num', v: Number(t.v) };
    if (t.t === 'str') return { k: 'str', v: t.v.slice(1, -1).replace(/""/g, '"') };
    if (t.t === 'bool') return { k: 'bool', v: t.v === 'TRUE' };
    if (t.t === 'ref') return { k: 'ref', a: t.v.replace(/\$/g, '') };
    if (t.t === 'range') {
      const [a, b] = t.v.replace(/\$/g, '').split(':');
      return { k: 'range', a, b };
    }
    if (t.t === 'fn') {
      if (!(FUNCTIONS as readonly string[]).includes(t.v)) throw new Error(`function ${t.v} is not supported: ${src}`);
      const args: Node[] = [];
      if (peek()?.v !== ')') {
        args.push(level(0));
        while (peek()?.v === ',') {
          eat(',');
          args.push(level(0));
        }
      }
      eat(')');
      return { k: 'call', f: t.v, args };
    }
    if (t.v === '(') {
      const x = level(0);
      eat(')');
      return x;
    }
    throw new Error(`unexpected "${t.v}" in ${src}`);
  };
  const node = level(0);
  if (p !== toks.length) throw new Error(`trailing input in ${src}`);
  return node;
}

const colNum = (c: string) => [...c].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
const colName = (n: number): string => (n <= 0 ? '' : colName(Math.floor((n - 1) / 26)) + String.fromCharCode(65 + ((n - 1) % 26)));
const split = (a: string) => {
  const m = a.match(/^([A-Z]+)(\d+)$/)!;
  return [colNum(m[1]), Number(m[2])] as const;
};

type Arg = Value | { range: Value[] };
const isRange = (x: Arg): x is { range: Value[] } => typeof x === 'object' && x !== null && 'range' in x;

const rank = (v: Value) => (typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2);
function compare(a: Value, b: Value): number {
  if (a === null) a = typeof b === 'string' ? '' : typeof b === 'boolean' ? false : 0;
  if (b === null) b = typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0;
  if (rank(a) !== rank(b)) return rank(a) - rank(b);
  if (typeof a === 'string') {
    const x = a.toLowerCase();
    const y = (b as string).toLowerCase();
    return x < y ? -1 : x > y ? 1 : 0;
  }
  return Number(a) - Number(b);
}
const num = (v: Value): number => {
  if (v === null) return 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v;
  throw new Error(`#VALUE!: text "${v}" used as a number`);
};
const str = (v: Value): string => (v === null ? '' : typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : String(v));
const truthy = (v: Value): boolean => {
  if (typeof v === 'string') throw new Error(`#VALUE!: text "${v}" used as a condition`);
  return num(v) !== 0;
};
/** Excel's ROUND: the value to 15 significant digits first, then halves away from zero. */
const excelRound = (x: number, d: number) => {
  const v = Number(x.toPrecision(15));
  const f = 10 ** d;
  return (Math.sign(v) * Math.round(Math.abs(v) * f)) / f;
};
function matches(v: Value, crit: Value): boolean {
  if (typeof crit === 'number') return typeof v === 'number' && v === crit;
  if (typeof crit === 'string') {
    if (/^[<>=]|[*?~]/.test(crit)) throw new Error(`COUNTIF criterion with an operator or wildcard is not supported: ${crit}`);
    return typeof v === 'string' && v.toLowerCase() === crit.toLowerCase();
  }
  throw new Error('unsupported COUNTIF criterion');
}

/**
 * One sheet with some inputs set. `value(address)` evaluates on demand, with
 * every formula result memoised for this set of inputs.
 */
export function evaluator(sheet: Sheet, inputs: Map<string, Value>) {
  const memo = new Map<string, Value>();
  const parsed = new Map<string, Node>();
  const cell = (a: string): Value => {
    if (inputs.has(a)) return inputs.get(a)!;
    const f = sheet.formulas.get(a);
    if (f === undefined) return sheet.values.get(a) ?? null;
    if (memo.has(a)) return memo.get(a)!;
    let node = parsed.get(a);
    if (!node) parsed.set(a, (node = parse(f)));
    const v = scalar(node);
    memo.set(a, v);
    return v;
  };
  const range = (a: string, b: string): Value[] => {
    const [c1, r1] = split(a);
    const [c2, r2] = split(b);
    const out: Value[] = [];
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++)
      for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) out.push(cell(`${colName(c)}${r}`));
    return out;
  };
  const arg = (n: Node): Arg => (n.k === 'range' ? { range: range(n.a, n.b) } : n.k === 'ref' ? { range: [cell(n.a)] } : scalar(n));
  const flat = (xs: Arg[]) => xs.flatMap((x) => (isRange(x) ? x.range : [x]));
  const scalar = (n: Node): Value => {
    switch (n.k) {
      case 'num':
      case 'str':
      case 'bool':
        return n.v;
      case 'ref':
        return cell(n.a);
      case 'range':
        throw new Error('a range used where one value is needed');
      case 'neg':
        return -num(scalar(n.x));
      case 'bin': {
        const l = scalar(n.l);
        const r = scalar(n.r);
        switch (n.op) {
          case '+':
            return num(l) + num(r);
          case '-':
            return num(l) - num(r);
          case '*':
            return num(l) * num(r);
          case '/':
            if (num(r) === 0) throw new Error('#DIV/0!');
            return num(l) / num(r);
          case '&':
            return str(l) + str(r);
          case '=':
            return compare(l, r) === 0;
          case '<>':
            return compare(l, r) !== 0;
          case '<':
            return compare(l, r) < 0;
          case '>':
            return compare(l, r) > 0;
          case '<=':
            return compare(l, r) <= 0;
          case '>=':
            return compare(l, r) >= 0;
        }
        throw new Error(`operator ${n.op}`);
      }
      case 'call': {
        const a = n.args;
        switch (n.f) {
          case 'IF':
            return truthy(scalar(a[0])) ? scalar(a[1]) : a.length > 2 ? scalar(a[2]) : false;
          case 'AND':
            return flat(a.map(arg)).every((v) => truthy(v));
          case 'OR':
            return flat(a.map(arg)).some((v) => truthy(v));
          case 'SUM':
            return a.map(arg).reduce<number>((s, x) => s + (isRange(x) ? x.range.filter((v) => typeof v === 'number').reduce<number>((t, v) => t + (v as number), 0) : num(x)), 0);
          case 'COUNT':
            return flat(a.map(arg)).filter((v) => typeof v === 'number').length;
          case 'COUNTA':
            return flat(a.map(arg)).filter((v) => v !== null).length;
          case 'COUNTIF': {
            const r = arg(a[0]);
            const crit = scalar(a[1]);
            return (isRange(r) ? r.range : [r]).filter((v) => matches(v, crit)).length;
          }
          case 'COUNTIFS': {
            const pairs: [Value[], Value][] = [];
            for (let i = 0; i < a.length; i += 2) {
              const r = arg(a[i]);
              pairs.push([isRange(r) ? r.range : [r], scalar(a[i + 1])]);
            }
            const len = pairs[0][0].length;
            let n2 = 0;
            for (let i = 0; i < len; i++) if (pairs.every(([r, c]) => matches(r[i], c))) n2++;
            return n2;
          }
          case 'CHOOSE': {
            const i = Math.trunc(num(scalar(a[0])));
            if (i < 1 || i >= a.length) throw new Error('#VALUE!: CHOOSE index out of range');
            return scalar(a[i]);
          }
          case 'ROUND':
            return excelRound(num(scalar(a[0])), num(scalar(a[1])));
          case 'LEN':
            return str(scalar(a[0])).length;
          case 'TRIM':
            return str(scalar(a[0])).trim().replace(/ {2,}/g, ' ');
        }
        throw new Error(`function ${n.f}`);
      }
    }
  };
  return { value: cell };
}
