// What each event key is called in the console, in one place.
//
// The keys are what admin_event_key() in supabase/schema.sql returns: the
// event's own type, except a form start, which is split by form. The funnel on
// /craft/admin/traffic and the page detail at /craft/admin/traffic/page both
// read these labels, so the two can never name one event two ways.
//
// A key with no label here is shown by its raw name rather than dropped.

export const EVENT_LABELS: Record<string, string> = {
  pageview: 'Landed on a page',
  tool_started: 'Started a tool',
  useful_result_completed: 'Reached a tool’s result',
  resource_requested: 'Requested a resource (saved, server)',
  requested_delivery_confirmed: 'Received the requested file',
  resource_download: 'Downloaded a file (before 19 Sep)',
  calculator_interaction: 'Used the calculator',
  cohort_cta_clicked: 'Followed a cohort link',
  cohort_apply_click: 'Pressed Apply at the foot of a resource page (older event)',
  cta_click: 'Followed a link to the consulting pages or a booking',
  ask_open: 'Opened the assistant',
  ask_question: 'Asked the assistant something',
  'form_started:application': 'Started an application',
  'form_started:enquiry': 'Started a cohort enquiry',
  'form_started:enterprise': 'Started a team enquiry',
  'form_started:consulting': 'Started a consulting enquiry (/caio or /assessment)',
  'form_started:other': 'Started another form',
  'form_started:unrecorded': 'Started a form, which one not recorded',
  application_saved: 'Application saved (server)',
  enquiry_saved: 'Enquiry saved (server)',
  apply_submit: 'Submitted a consulting form',
  form_error: 'A form field was refused',
  owner_notified: 'Inbox copy of a saved form sent',
};

export const labelFor = (key: string): string => EVENT_LABELS[key] ?? key;

/**
 * The events the SERVER writes after a commit. They carry no visitor hash, so a
 * count of them is a count of rows, not of visitors. They are stored under the
 * visit's entry page, which is why the page detail leaves them out.
 */
export const SERVER_EVENTS = new Set(['application_saved', 'enquiry_saved', 'resource_requested']);
