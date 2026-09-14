/**
 * Public Google Calendar appointment scheduling configuration.
 *
 * This is intentionally a PUBLIC_ value: the same URL is the visitor-facing
 * fallback when Google's popup script cannot load. It is not a credential and
 * must be the appointment schedule URL from Google's embed, never a general
 * calendar view or an account-management URL.
 */
const configuredUrl = (import.meta.env.PUBLIC_GOOGLE_CALENDAR_APPOINTMENT_URL ?? '').trim();

export const isGoogleCalendarAppointmentUrl = (value: string): boolean => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'calendar.google.com' &&
      url.pathname.includes('/appointments/schedules/')
    );
  } catch {
    return false;
  }
};

/** Empty means scheduling remains unavailable and the existing enquiry route stays visible. */
export const googleCalendarAppointmentUrl = isGoogleCalendarAppointmentUrl(configuredUrl)
  ? configuredUrl
  : '';
