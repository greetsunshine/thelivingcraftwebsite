// The download gate: every file a resource page hands out, behind a name and
// an email address. This replaced /api/pipeline/resource-pdf on 19 September
// 2026, when Sunil asked for every download option to be gated and the
// requests kept in one table the marketing team can read.
//
// ───────────────────────────────────────────────────────────────────────────
// WHAT IS GATED, AND WHAT THE GATE RECORDS
// ───────────────────────────────────────────────────────────────────────────
//
// The PAGE is still open: anybody can read a tool, fill it in and read the
// result without giving anything. What asks for a name and an address is the
// hand-over of a FILE: a built PDF of a scored copy, a workbook, a kit ZIP, a
// worksheet CSV, a template as Markdown, a text summary. A print button asks
// too (kind 'print') and then opens the print dialogue; no file leaves the
// server for it, and the request is still recorded.
//
// This reverses the V4 addendum's "anonymous downloads are events, not
// people". What it does NOT reverse: a download grants no marketing
// permission. No consent wording has been approved, so the row a request
// writes carries no consent, and the marketing view says `consented = false`
// until one exists. Sending these people anything beyond the resource they
// asked for is a decision that needs that wording first.
//
// ───────────────────────────────────────────────────────────────────────────
// ONE ROUTE, ONE REGISTRY
// ───────────────────────────────────────────────────────────────────────────
//
// `DOWNLOADS` maps a resource id to the kinds it hands out, and each kind to
// how its bytes are built: a PDF renderer with its checks, a CSV from the data
// module, a text file from the rubric, or a static file read from the private
// `downloads/` folder at the repo root. That folder is bundled into the
// function by `includeFiles` in astro.config.mjs and is NOT under `public/`,
// because anything under `public/` is fetchable by URL and a gate on the
// button alone is theatre.
//
// Templates are resolved from the content collection, not the registry, so a
// fifth template needs no entry here.
//
// Same request as /api/pipeline/resource: the same rate limit, honeypot, key,
// fields, save and queued delivery, through `handleResourceRequest()`. The
// payload is parsed and (for a PDF) checked BEFORE the save, so a request
// that would fail leaves no person or queued email behind it. A failed save
// still hands over the file: the person did what was asked, and the console
// banner already reports the fault.

import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { handleResourceRequest } from '../../../lib/pipeline/resource-request';
import {
  isResourceKind,
  resolveResource,
  type RequestableResource,
  type ResourceKind,
} from '../../../lib/pipeline/resources';
import { RESOURCES, csvFilename, csvFor } from '../../../data/resources';
import { parseScores, renderPocScreenPdf, verifyPocScreenPdf, type PdfCheck } from '../../../lib/resources/poc-screen-pdf';
import { parseSheet, renderAuthorityReviewPdf } from '../../../lib/resources/authority-review-pdf';
import { parseInputs, renderRunCostModelPdf, verifyRunCostModelPdf } from '../../../lib/resources/run-cost-model-pdf';
import { parseAssessment, renderModelSelectionPdf, verifyModelSelectionPdf } from '../../../lib/resources/model-selection-pdf';
import { blankTemplateText, templateFilenames, workedTemplateText } from '../../../lib/resources/template-text';
import type { SheetRow } from '../../../data/authority-review';
import type { ModelInputs } from '../../../data/run-cost-model';
import type { Assessment } from '../../../data/model-selection-tool';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const REFUSED = 'We could not accept that request. The page is the resource either way.';
const CHECK_FAILED =
  'The file failed a check before download, so it was not built. Nothing was saved and nothing was sent. Try again in a moment.';
const NOT_BUILT = 'We could not build the file just now. Try again in a moment.';

interface Built {
  bytes: Uint8Array;
  filename: string;
  contentType: string;
}

/**
 * One kind of one resource. `parse` validates the posted `payload` and returns
 * what `render` needs, or null to refuse; a kind with no payload returns `{}`.
 * `verify` runs BEFORE the save. `render` returns the bytes, or the bytes with
 * the checks the render ran on the way.
 */
interface Download<T> {
  parse: (payload: unknown, body: Record<string, unknown>) => T | null;
  verify?: (payload: T, name: string) => PdfCheck[];
  /** The bytes; the bytes with checks; or null when the page builds the file
   *  itself after the request is recorded (see `local()`). */
  render: (payload: T, name: string) => Promise<Built | { file: Built; checks: PdfCheck[] } | null>;
}

/**
 * A file the BROWSER builds, after the gate has recorded the request. Used
 * where the page promises that what the reader typed never reaches a server:
 * the Agent Design Check (the roadmap's "processed in the browser") and the
 * Rule Placement Audit ("your entries stay in this browser"). The gate takes
 * the name and the address and hands nothing back; the page's own script
 * makes the file from its own state. Nothing typed on those pages is posted.
 */
const local = (): Download<Record<string, never>> => ({ parse: () => ({}), render: async () => null });

/**
 * A file from the private downloads folder, read at request time. `parse`
 * checks the file is there, because parse runs BEFORE the save: a file that
 * has not been produced yet (the cost-ceiling workbook, today) is refused
 * with nothing written, rather than recorded as a request that got nothing.
 */
const staticFile = (name: string, contentType: string): Download<Record<string, never>> => ({
  parse: () => (existsSync(join(process.cwd(), 'downloads', name)) ? {} : null),
  render: async () => {
    const bytes = await readFile(join(process.cwd(), 'downloads', name));
    return { bytes: new Uint8Array(bytes), filename: name, contentType };
  },
});

const PDF = 'application/pdf';
const CSV = 'text/csv; charset=utf-8';
const MD = 'text/markdown; charset=utf-8';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const ZIP = 'application/zip';
const JSON_T = 'application/json; charset=utf-8';

const text = (s: string, filename: string, contentType: string): Built => ({
  bytes: new TextEncoder().encode(s),
  filename,
  contentType,
});

const now = () => new Date().toISOString();

/** A worksheet's CSV, built from its data module exactly as the page's table is. */
const worksheetCsv = (code: string): Download<Record<string, never>> => ({
  parse: () => ({}),
  render: async () => {
    const r = RESOURCES.find((x) => x.code.toLowerCase() === code);
    if (!r) throw new Error(`no worksheet ${code}`);
    return text(csvFor(r), csvFilename(r), CSV);
  },
});

const DOWNLOADS: Record<string, Partial<Record<ResourceKind, Download<any>>>> = {
  'poc-screen': {
    pdf: {
      parse: (p) => parseScores(p),
      verify: (scores: (number | null)[], name) => verifyPocScreenPdf({ scores, name, builtOn: now() }),
      render: async (scores: (number | null)[], name) => {
        const out = await renderPocScreenPdf({ scores, name, builtOn: now() });
        return { file: { bytes: out.bytes, filename: 'poc-selection-tool-scored.pdf', contentType: PDF }, checks: out.checks };
      },
    } satisfies Download<(number | null)[]>,
  },
  'agent-authority-review': {
    pdf: {
      parse: (p) => parseSheet(p),
      render: async (rows: SheetRow[], name) => ({
        bytes: await renderAuthorityReviewPdf({ rows, name, builtOn: now() }),
        filename: 'agent-authority-review-assessment.pdf',
        contentType: PDF,
      }),
    } satisfies Download<SheetRow[]>,
  },
  'run-cost-model': {
    pdf: {
      // `isExample` only changes one line of the cover; a wrong value cannot
      // change a number, so it is read leniently and the inputs strictly.
      parse: (p) => {
        const o = (p ?? {}) as Record<string, unknown>;
        const inputs = parseInputs(o.inputs);
        return inputs ? { inputs, isExample: o.isExample === true } : null;
      },
      verify: (payload: { inputs: ModelInputs; isExample: boolean }, name) =>
        verifyRunCostModelPdf({ ...payload, name, builtOn: now() }),
      render: async (payload: { inputs: ModelInputs; isExample: boolean }, name) => {
        const out = await renderRunCostModelPdf({ ...payload, name, builtOn: now() });
        return { file: { bytes: out.bytes, filename: 'run-cost-model.pdf', contentType: PDF }, checks: out.checks };
      },
    } satisfies Download<{ inputs: ModelInputs; isExample: boolean }>,
    xlsx: staticFile('agent-run-cost-model.xlsx', XLSX),
  },
  'model-selection-tool': {
    pdf: {
      parse: (p) => parseAssessment(p),
      verify: (assessment: Assessment, name) => verifyModelSelectionPdf({ assessment, name, builtOn: now() }),
      render: async (assessment: Assessment, name) => {
        const out = await renderModelSelectionPdf({ assessment, name, builtOn: now() });
        return { file: { bytes: out.bytes, filename: 'model-selection-tool-scored.pdf', contentType: PDF }, checks: out.checks };
      },
    } satisfies Download<Assessment>,
  },
  'agent-memory-audit-kit': {
    zip: staticFile('agent-memory-audit-kit.zip', ZIP),
    pdf: staticFile('agent-memory-audit-kit.pdf', PDF),
    json: staticFile('memory-record.schema.json', JSON_T),
  },
  'cost-ceiling-workbook': {
    xlsx: staticFile('cost-ceiling-workbook.xlsx', XLSX),
  },
  'rule-placement-audit': { csv: local() },
  'agent-design-check': { txt: local() },
  'lc-r01': { csv: worksheetCsv('lc-r01') },
  'lc-r02': { csv: worksheetCsv('lc-r02') },
  'lc-r03': { csv: worksheetCsv('lc-r03') },
};

/**
 * Two resources the registers do not know: the Agent Design Check under
 * /tools, and the templates, which live in the content collection. Resolved
 * here so the request handler can save against them.
 */
async function resolveExtra(id: string): Promise<RequestableResource | null> {
  if (id === 'agent-design-check') {
    return { id, title: 'The Agent Design Check', path: '/tools/agent-design-check', version: '2026-09-13' };
  }
  const m = /^template-([a-z0-9-]+)$/.exec(id);
  if (m) {
    const entries = await getCollection('templates', (t) => t.data.status === 'ready');
    const entry = entries.find((t) => t.id === m[1]);
    if (!entry) return null;
    return { id, title: entry.data.title, path: `/resources/templates/${entry.id}`, version: entry.data.revisedOn };
  }
  return null;
}

/** A template's Markdown, blank or worked. */
function templateDownload(slug: string): Download<'blank' | 'worked'> {
  return {
    parse: (_p, body) => (body.variant === 'worked' ? 'worked' : body.variant === 'blank' || body.variant === undefined ? 'blank' : null),
    render: async (variant) => {
      const entries = await getCollection('templates', (t) => t.data.status === 'ready');
      const entry = entries.find((t) => t.id === slug);
      if (!entry) throw new Error(`no template ${slug}`);
      const names = templateFilenames(entry);
      return variant === 'worked'
        ? text(workedTemplateText(entry), names.worked, MD)
        : text(blankTemplateText(entry), names.blank, MD);
    },
  };
}

export const POST: APIRoute = async (ctx) => {
  let body: Record<string, unknown>;
  try {
    body = (await ctx.request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: REFUSED }, 400);
  }

  const kind = body.kind;
  if (!isResourceKind(kind) || kind === 'email') return json({ ok: false, error: REFUSED }, 400);

  // Which resource. The two registers first, then the collection.
  const wanted = typeof body.resource === 'string' ? body.resource.trim().toLowerCase() : '';
  let resource: RequestableResource | null = null;
  const lookup = resolveResource(wanted);
  if (lookup.state === 'ok') resource = lookup.resource;
  else if (lookup.state === 'unreleased') {
    return json({ ok: false, error: 'That one is not published yet. Nothing has been saved and nothing will be sent.' }, 409);
  } else resource = await resolveExtra(wanted);
  if (!resource) return json({ ok: false, error: REFUSED }, 400);

  // Which download. A print asks and hands over nothing.
  let download: Download<unknown> | null = null;
  if (kind !== 'print') {
    const tpl = /^template-([a-z0-9-]+)$/.exec(resource.id);
    download = tpl && kind === 'md' ? (templateDownload(tpl[1]) as Download<unknown>) : (DOWNLOADS[resource.id]?.[kind] as Download<unknown> | undefined) ?? null;
    if (!download) return json({ ok: false, error: 'That resource has no file of that kind. The page itself is the copy.' }, 400);
  }

  const payload = download ? download.parse(body.payload, body) : {};
  if (payload === null) return json({ ok: false, error: REFUSED }, 400);

  const name =
    typeof (body.answers as Record<string, unknown> | undefined)?.name === 'string'
      ? String((body.answers as Record<string, unknown>).name).trim().slice(0, 200)
      : '';

  // The content checks, before anything is written.
  const preflight: PdfCheck[] = download?.verify ? download.verify(payload, name) : [];
  const failed = preflight.filter((c) => !c.ok);
  if (failed.length) {
    console.error('download check failed:', failed.map((c) => `${c.name}: ${c.detail ?? ''}`).join('; '));
    return json({ ok: false, error: CHECK_FAILED, checks: preflight }, 500);
  }

  const outcome = await handleResourceRequest(ctx, body, { resource });
  if (outcome.kind === 'refused') return json(outcome.body, outcome.status);

  let built: Built | null = null;
  let checks: PdfCheck[] = [];
  if (download) {
    try {
      const out = await download.render(payload, name);
      if (out && 'file' in out) {
        built = out.file;
        checks = out.checks;
      } else built = out;
    } catch (err) {
      // The request IS saved at this point, so the person still gets their
      // email copy; only the file failed.
      console.error('download render threw:', err instanceof Error ? err.message.slice(0, 120) : 'unknown');
      return json({ ok: false, error: NOT_BUILT }, 500);
    }
  }

  // Base64 in JSON rather than a binary body, so the save outcome and the file
  // travel together and the browser branches on one shape.
  const file = built ? Buffer.from(built.bytes).toString('base64') : null;
  const common = {
    ok: true as const,
    kind,
    file,
    filename: built?.filename ?? null,
    contentType: built?.contentType ?? null,
    checks,
  };

  if (outcome.kind === 'unsaved') {
    return json({ ...common, saved: false, note: outcome.message, delivery: null }, 200);
  }
  return json(
    {
      ...common,
      saved: true,
      alreadyExisted: outcome.alreadyExisted,
      confirmation: outcome.confirmation,
      delivery: outcome.delivery,
    },
    200,
  );
};

/** Everything else is refused. robots.txt already disallows /api/pipeline. */
export const ALL: APIRoute = () =>
  new Response('Method not allowed', { status: 405, headers: { Allow: 'POST' } });
