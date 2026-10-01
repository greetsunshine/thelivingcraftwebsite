// The browser half of the measured journey, for the events a page has to name
// itself.
//
// SOURCE. The revised outreach readiness handoff (29 September 2026): "Track
// form_started, application_saved, resource_requested,
// requested_delivery_confirmed, tool_started, useful_result_completed and
// cohort_cta_clicked as distinct events. A click is not a download receipt; a
// submit click is not a stored application. ... Deduplicate by event/request
// ID and record environment and consent state."
//
// WHO SENDS WHAT
//   form_started, tool_started, cohort_cta_clicked   Track.astro, by delegation
//   useful_result_completed                          this module, when a tool says so
//   requested_delivery_confirmed                     gate-client.ts, once a file arrived
//   application_saved, resource_requested            the SERVER, after the commit
//
// The two server events are never sent from here. A browser that says "saved"
// is a browser that pressed a button; only the database knows the row exists.
//
// Every event goes to the first-party beacon (`window.lcTrack`, which adds the
// event id) and, only when the tag container is already loaded with consent,
// to Google Tag Manager's data layer under the same name and id. Pushing to the
// data layer before consent would queue the event for a container that loads
// later, which would send a pre-consent event after the fact.

type Meta = Record<string, string | number | boolean | null>;

type Win = Window & {
  lcTagsLoaded?: boolean;
  dataLayer?: unknown[];
};

/** One event, to the beacon and, with consent, to the tag container. */
export function lcEvent(type: string, meta: Meta = {}): void {
  try {
    const w = window as Win;
    const id = w.lcTrack?.(type, meta);
    if (w.lcTagsLoaded && Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: type, event_id: id ?? null, ...meta });
    }
  } catch {
    /* Measurement never breaks a page. */
  }
}

// ── the useful result ───────────────────────────────────────────────────────

const NOTE = '[data-useful-result]';
let resultSent = false;

/**
 * A tool calls this when its result is complete: every question answered, the
 * figures computed, the verdict readable. It shows the cohort sentence that
 * waits under the result (ResultCohortNote.astro) and records
 * `useful_result_completed` once per page view.
 *
 * `example: true` shows the sentence and records nothing. A worked example the
 * reader loaded with one click is not a result they reached.
 */
export function markUsefulResult(tool: string, opts: { example?: boolean } = {}): void {
  document.querySelectorAll<HTMLElement>(NOTE).forEach((n) => {
    n.hidden = false;
  });
  if (opts.example || resultSent) return;
  resultSent = true;
  lcEvent('useful_result_completed', { tool });
}

/** The result is incomplete again (a reset, a cleared answer): hide the sentence. */
export function clearUsefulResult(): void {
  document.querySelectorAll<HTMLElement>(NOTE).forEach((n) => {
    if (n.dataset.usefulResult !== 'always') n.hidden = true;
  });
}
