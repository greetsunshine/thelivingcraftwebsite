// The download gate, browser side. One module every resource page shares.
//
// `mountGate()` finds the dialog that <ResourceGate> rendered, wires every
// element carrying data-gate="<kind>" (and, on a page listing several
// resources, data-resource="<id>") to open it, and on submit posts one
// request to /api/pipeline/download: the resource, the kind, the name and
// address, the honeypot, a fresh request key, the attribution the page can
// see, and whatever `payload()` returns for the kind (a scored PDF needs the
// answers; a workbook needs nothing). The answer carries the file as base64,
// plus the list of checks the server ran; or no file, for a print and for the
// two tools whose file the page builds itself so that nothing typed on them
// is posted (`onDone` is where the page does that).
//
// Nothing here is stored in the browser. The name and address live in the
// form fields for the life of the dialog and nowhere else.

export type GateKind = 'pdf' | 'xlsx' | 'zip' | 'json' | 'csv' | 'md' | 'txt' | 'print';

/**
 * Fired on `document` once a hand-over has actually happened: the file is
 * downloading, the print dialogue is opening, or the page is about to build
 * the file itself. A page that counts downloads listens for this rather than
 * for the click on the gate button, because the click only opens the dialog
 * and a reader who cancels it has downloaded nothing.
 */
export const DOWNLOAD_EVENT = 'lc:download';
export interface DownloadDetail {
  resource: string;
  kind: GateKind;
  variant: string | null;
}

export interface GateOptions {
  /** What to post as `payload` for a kind. Absent means no payload. */
  payload?: (kind: GateKind, variant: string | null) => unknown;
  /** Called after a successful hand-over (the file is downloading, or the
   *  print dialogue is about to open). */
  onDone?: (kind: GateKind, variant: string | null) => void;
}

const LABEL: Record<GateKind, string> = {
  pdf: 'PDF',
  xlsx: 'Excel',
  zip: 'ZIP',
  json: 'JSON',
  csv: 'CSV',
  md: 'Markdown',
  txt: 'Text',
  print: 'Print',
};

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

function download(base64: string, filename: string, contentType: string) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: contentType }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function mountGate(opts: GateOptions = {}) {
  const found = document.getElementById('gate-dialog') as HTMLDialogElement | null;
  if (!found) return;
  const dialog: HTMLDialogElement = found;
  const form = document.getElementById('gate-form') as HTMLFormElement;
  const status = document.getElementById('gate-status')!;
  const checksList = document.getElementById('gate-checks')!;
  const submit = document.getElementById('gate-submit') as HTMLButtonElement;
  const cancel = document.getElementById('gate-cancel')!;
  const kindLabel = document.getElementById('gate-kind')!;
  const title = document.getElementById('gate-title')!;
  // The page's resource, unless the control names its own (a page listing
  // several resources puts data-resource on each button).
  const pageResource = dialog.dataset.resource ?? '';
  let resource = pageResource;

  let kind: GateKind = 'pdf';
  let variant: string | null = null;

  const say = (text: string, tone: 'ok' | 'err' | '') => {
    status.textContent = text;
    status.className = `gate-status${tone ? ` ${tone}` : ''}`;
  };

  const showChecks = (checks: { name: string; ok: boolean }[]) => {
    if (!Array.isArray(checks) || !checks.length) return;
    checksList.replaceChildren(
      ...checks.map((c) => {
        const li = el('li', c.ok ? undefined : 'fail');
        li.append(el('b', undefined, c.ok ? 'ok' : 'failed'), document.createTextNode(c.name));
        return li;
      }),
    );
    checksList.hidden = false;
  };

  function open(k: GateKind, v: string | null, r?: string) {
    kind = k;
    variant = v;
    resource = r || pageResource;
    kindLabel.textContent = LABEL[k];
    title.textContent = k === 'print' ? 'Print this page' : `Get the ${LABEL[k]}`;
    submit.textContent = k === 'print' ? 'Continue to print' : `Get the ${LABEL[k]}`;
    say('', '');
    checksList.hidden = true;
    checksList.replaceChildren();
    submit.disabled = false;
    cancel.textContent = 'Cancel';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }

  // Every data-gate control on the page, by delegation, so a control added
  // later needs no wiring.
  document.addEventListener('click', (ev) => {
    const t = (ev.target as HTMLElement | null)?.closest<HTMLElement>('[data-gate]');
    if (!t) return;
    ev.preventDefault();
    const k = t.dataset.gate as GateKind;
    if (!(k in LABEL)) return;
    open(k, t.dataset.variant ?? null, t.dataset.resource);
  });

  cancel.addEventListener('click', () => dialog.close());

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    if (!name || !email) {
      say('Both fields are needed.', 'err');
      return;
    }

    submit.disabled = true;
    say(kind === 'print' ? 'Saving your request.' : 'Checking and building the file.', '');

    // One key per attempt. A retry after a network error is a new attempt; a
    // repeat click while this one runs is stopped by the disabled button.
    const requestKey =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    try {
      const res = await fetch('/api/pipeline/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource,
          kind,
          variant: variant ?? undefined,
          requestKey,
          answers: { name, email },
          botcheck: String(data.get('botcheck') ?? ''),
          payload: opts.payload ? opts.payload(kind, variant) : undefined,
          search: location.search,
          referrer: document.referrer,
          entryPath: location.pathname,
        }),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok || !body.ok) {
        const errs = Array.isArray(body.errors) ? body.errors.map((e: { message: string }) => e.message).join(' ') : '';
        say(errs || body.error || 'We could not build the file just now. Try again in a moment.', 'err');
        showChecks(body.checks);
        submit.disabled = false;
        return;
      }

      const checks = Array.isArray(body.checks) ? body.checks : [];
      const passed = checks.filter((c: { ok: boolean }) => c.ok).length;
      const checkLine = checks.length ? ` Checked before download: ${passed} of ${checks.length} checks passed.` : '';
      const tail = `${body.saved ? (body.delivery ?? '') : (body.note ?? '')}`.trim();
      cancel.textContent = 'Close';

      const done = () => {
        document.dispatchEvent(
          new CustomEvent<DownloadDetail>(DOWNLOAD_EVENT, { detail: { resource, kind, variant } }),
        );
        opts.onDone?.(kind, variant);
      };

      if (kind === 'print') {
        say(`Your request is saved. ${tail}`.trim(), 'ok');
        dialog.close();
        done();
        window.print();
        return;
      }

      if (typeof body.file === 'string') {
        download(body.file, body.filename || `resource.${kind}`, body.contentType || 'application/octet-stream');
        say(`Your ${LABEL[kind]} is downloading.${checkLine} ${tail}`.trim(), 'ok');
        showChecks(checks);
        done();
        return;
      }
      // No file from the server: the page builds it from its own state, so
      // nothing the reader typed was posted. `onDone` is where that happens.
      say(`Your request is saved. ${tail}`.trim(), 'ok');
      dialog.close();
      done();
    } catch {
      say('The request did not reach the server. Check the connection and try again.', 'err');
      submit.disabled = false;
    }
  });
}
