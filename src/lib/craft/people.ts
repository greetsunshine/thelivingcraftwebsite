// Display helpers for people and times in the discussion forum.
//
// Kept out of the pages because the thread list, the thread page and the
// console all render the same avatar for the same person, and three copies of
// "take the initials" is three chances for the same person to look like two.

/** "Rahul Sharma" → "RS". Falls back to the email's first letters. */
export function initials(name: string | null | undefined, email = ''): string {
  const source = (name ?? '').trim() || email.split('@')[0].replace(/[._-]+/g, ' ');
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * A stable tint per person, so the same face is the same colour on every page.
 *
 * Deliberately a hash rather than a stored column: a colour is not data worth
 * a migration, and with eight learners a collision is a mild aesthetic
 * coincidence rather than a bug.
 */
const TINTS = 8;
export function tintOf(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % TINTS;
}

/** "2 days ago". Falls back to a date once it stops being useful as a gap. */
export function relativeTime(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  const secs = Math.round((now - then) / 1000);

  if (secs < 45) return 'just now';
  if (secs < 90) return 'a minute ago';

  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins} minutes ago`;

  const hours = Math.round(mins / 60);
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;

  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: new Date(iso).getFullYear() === new Date(now).getFullYear() ? undefined : 'numeric',
  });
}

/** The first line of a post, for a list row that must not become a wall. */
export function excerpt(body: string, max = 180): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max).trimEnd()}…` : flat;
}

/** A thread with no title gets one from its own first sentence. */
export function displayTitle(title: string | null, body: string): string {
  if (title && title.trim()) return title.trim();
  const flat = body.replace(/\s+/g, ' ').trim();
  const stop = flat.search(/[.?!]\s|[.?!]$/);
  const first = stop > 0 ? flat.slice(0, stop + 1) : flat;
  return first.length > 90 ? `${first.slice(0, 90).trimEnd()}…` : first;
}
