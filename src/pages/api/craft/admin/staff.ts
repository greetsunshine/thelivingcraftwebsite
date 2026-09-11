// Console accounts, from the administration screen rather than the command line.
//
// ───────────────────────────────────────────────────────────────────────────
// THIS IS THE SUCCESSOR TO `npm run staff` FOR EVERYTHING EXCEPT THE FIRST
// ACCOUNT, AND THE FIRST ACCOUNT MUST STAY ON THE CLI.
// ───────────────────────────────────────────────────────────────────────────
//
// scripts/add-staff.ts explains why: the screen that manages accounts needs
// `admin.staff`, only a maintainer holds it, and a maintainer account has to be
// created by something. The console cannot bootstrap itself. That something is
// a shell with the service-role key already in it, which is the smallest blast
// radius available — a "create the first administrator" endpoint would exist
// forever afterwards and would be the single most valuable thing on the site to
// find.
//
// ───────────────────────────────────────────────────────────────────────────
// FOUR REFUSALS, AND EACH ONE CLOSES A DIFFERENT HOLE
// ───────────────────────────────────────────────────────────────────────────
//
// 1. NO CAPABILITY, NO WRITE. `admin.staff` is checked here, against the roles
//    on the signed cookie, before anything is read or written. The screen uses
//    the same matrix to decide what to draw and that is a courtesy — the brief
//    says it twice: "Authorisation is enforced server-side on reads, exports
//    and writes" and "hiding a button is insufficient". Middleware has
//    established that there IS a session; it cannot know whether this person
//    may do this.
//
// 2. THE BOOTSTRAP SESSION MAY NOT TOUCH THIS TABLE AT ALL. The shared password
//    grants `ADMIN_BOOTSTRAP_ROLES`, which defaults to `operator` and therefore
//    does not hold `admin.staff` — so by default this refusal is unreachable.
//    It exists for the environment where somebody widened that variable to
//    include `maintainer`, which is one line in a dashboard. In that state a
//    shared password could create a named maintainer, sign in as it, and hold
//    every capability the separation exists to keep apart. Refusing the whole
//    table closes that: an identity with no `staff_id` cannot be attributed,
//    every account it created would be indistinguishable from one a real
//    maintainer created, and the audit trail would say `bootstrap` against the
//    creation of the account that owns the console.
//
// 3. NOBODY CHANGES THEIR OWN ROLES, AND NOBODY DEACTIVATES THEMSELVES. The
//    first is an escalation: `maintainer` deliberately has neither `read.people`
//    nor `read.finance`, and a maintainer who can edit their own row grants
//    themselves both in one click. The second is a lockout — the last
//    maintainer switching themselves off leaves the console with no way back
//    except the CLI. Another maintainer does either; rotating your OWN password
//    stays allowed, because it grants nothing and it is the documented answer to
//    a lost one.
//
//    What this does NOT pretend: `admin.staff` inherently means "can create an
//    account with any roles", so a determined maintainer can always make a new
//    instructor account and sign in as it. That is what the brief's role table
//    grants, and the real control on it is the audit row this file writes, not
//    a check it could add.
//
// 4. NO PASSWORD EVER COMES BACK OUT. A generated password is returned exactly
//    once, in the response to the request that set it, and is stored only as a
//    PBKDF2 hash. There is deliberately no "show password" path: if it is lost
//    the answer is to rotate it, which is what `rotate` is for.
//
// ───────────────────────────────────────────────────────────────────────────
// DELETING IS NOT AN ACTION HERE
// ───────────────────────────────────────────────────────────────────────────
//
// Deactivate, never delete. A deleted staff row turns every action that person
// ever took into "unknown actor", which is worse evidence than the row costs to
// keep. Note the window: deactivation takes effect at the next sign-in, and an
// already-signed-in session survives until its cookie expires — at most twelve
// hours (src/lib/admin/auth.ts explains why the roles are trusted from the
// cookie). Anybody revoking access urgently has to know that, so the screen
// says it beside the button.

import type { APIRoute } from 'astro';
import { db } from '../../../../lib/admin/supabase';
import { can, isRole, refusal, ROLES, type Role } from '../../../../lib/pipeline/roles';
import { hashPassword, type Identity } from '../../../../lib/admin/staff';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/**
 * How a change is attributed. Same shape as the pipeline endpoint so the audit
 * log reads consistently, and `bootstrap` is a string that can only appear
 * against a cohort change — never against a staff one, per refusal 2 above.
 */
const actorOf = (who: Identity): string =>
  who.kind === 'staff' ? `${who.name} <${who.id}>` : 'bootstrap (shared password)';

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim().replace(/[\u0000-\u001f\u007f]/g, '');
  return t ? t.slice(0, max) : null;
};

/** Deliberately loose. The address is a sign-in handle, not a claim we verify. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * A password meant to be pasted into a manager once and never typed.
 *
 * Same unambiguous alphabet as scripts/add-staff.ts, so one read aloud over a
 * call survives. Rejection sampling rather than a bare modulo: 256 does not
 * divide 55, so `byte % 55` would make the first 36 characters measurably more
 * likely than the last 19. It costs nothing to do correctly.
 */
function generatePassword(length = 24): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const limit = 256 - (256 % alphabet.length);
  const out: string[] = [];
  while (out.length < length) {
    for (const b of crypto.getRandomValues(new Uint8Array(length))) {
      if (b >= limit) continue;
      out.push(alphabet[b % alphabet.length]);
      if (out.length === length) break;
    }
  }
  return out.join('');
}

/**
 * Roles, or the reason they were refused.
 *
 * Refuses an unknown name rather than dropping it, exactly as the CLI does. A
 * typo that grants fewer powers than intended presents later as a permissions
 * bug, and whoever debugs it will not think to check the spelling on the form.
 */
function parseRoles(v: unknown): { roles: Role[] } | { error: string } {
  if (!Array.isArray(v)) return { error: 'Which roles?' };
  const names = v.map((r) => (typeof r === 'string' ? r.trim() : '')).filter(Boolean);
  const unknown = names.filter((n) => !isRole(n));
  if (unknown.length) {
    return { error: `Unknown role(s): ${unknown.join(', ')}. Valid: ${ROLES.join(', ')}` };
  }
  const roles = [...new Set(names.filter(isRole))];
  if (!roles.length) {
    return { error: 'At least one role is needed. An account with no roles can see nothing.' };
  }
  return { roles };
}

const BOOTSTRAP_REFUSAL =
  'The shared-password session cannot create or change console accounts. It has no identity to ' +
  'attribute the change to, so an account it created would be indistinguishable from one a ' +
  'maintainer created. Create the first account with `npm run staff`, sign in as that account, ' +
  'and manage the rest here.';

export const POST: APIRoute = async ({ request, locals }) => {
  const who = locals.admin;
  if (!who) return json({ ok: false, error: 'Not signed in.' }, 401);

  // Refusal 2 first: it is the stronger rule, and its sentence is far more
  // useful to somebody on the shared password than "Maintainer can."
  if (who.kind === 'bootstrap') return json({ ok: false, error: BOOTSTRAP_REFUSAL }, 403);

  // Refusal 1. Every branch below is `admin.staff`; there is nothing on this
  // endpoint a lesser role may do, so the check is once, at the top.
  if (!can(who.roles, 'admin.staff')) {
    return json({ ok: false, error: refusal('admin.staff') }, 403);
  }

  const client = db();
  if (!client) {
    return json({ ok: false, error: 'The database is not configured for this deployment.' }, 503);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: 'Could not read that request.' }, 400);
  }

  const action = String(body.action ?? '');
  const actor = actorOf(who);

  /**
   * Best-effort audit. Never fails the change it describes — a refused role
   * edit because its audit row did not insert would leave the console lying
   * about what it did.
   *
   * NOTHING PERSONAL GOES IN THE VALUES. The audit table outlives erasure, so
   * it carries the staff_id as the join and records only `roles` and `active`.
   * Never the address, never the name, and never anything derived from a
   * password.
   */
  const note = async (
    staffId: string,
    reason: string,
    previous: Record<string, unknown> | null,
    next: Record<string, unknown> | null,
  ) => {
    try {
      await client.from('audit_log').insert({
        record_type: 'staff',
        record_id: staffId,
        actor,
        previous_value: previous,
        new_value: next,
        occurred_at: new Date().toISOString(),
        reason,
      });
    } catch (err) {
      console.error('staff audit write failed:', err instanceof Error ? err.name : 'unknown');
    }
  };

  /** The row as it stands, so an audit entry can say what changed from what. */
  const fetchOne = async (staffId: string) => {
    const { data, error } = await client
      .from('staff')
      // password_hash is never selected here. It is never selected anywhere
      // outside authenticate(), and this endpoint must not be the exception.
      .select('staff_id, name, email, roles, active')
      .eq('staff_id', staffId)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: 'No such account.' };
    return { row: data as { staff_id: string; name: string; email: string; roles: string[]; active: boolean } };
  };

  try {
    switch (action) {
      // ---- create -----------------------------------------------------------
      case 'create': {
        const name = clean(body.name, 120);
        const email = clean(body.email, 200)?.toLowerCase() ?? null;
        if (!name) return json({ ok: false, error: 'A name is needed to create an account.' }, 400);
        if (!email || !EMAIL.test(email)) {
          return json({ ok: false, error: 'That does not look like an email address.' }, 400);
        }

        const parsed = parseRoles(body.roles);
        if ('error' in parsed) return json({ ok: false, error: parsed.error }, 400);

        // The CLI upserts, which quietly resets an existing person's password
        // when you meant to add somebody. A screen should not do that silently:
        // changing roles and rotating a password are separate, deliberate acts
        // with their own buttons.
        const { data: existing, error: lookupErr } = await client
          .from('staff')
          .select('staff_id')
          .eq('email', email)
          .maybeSingle();
        if (lookupErr) return json({ ok: false, error: lookupErr.message.slice(0, 300) }, 503);
        if (existing) {
          return json(
            {
              ok: false,
              error:
                'That address already has an account. Change its roles or rotate its password ' +
                'instead — creating over the top would reset a password nobody asked to change.',
            },
            409,
          );
        }

        const password = generatePassword();
        const password_hash = await hashPassword(password);

        const { data, error } = await client
          .from('staff')
          .insert({ email, name, roles: parsed.roles, password_hash })
          .select('staff_id')
          .single();

        if (error || !data) {
          // A unique-violation here is the race the check above cannot close.
          const message = error?.message ?? 'The account was not created.';
          return json({ ok: false, error: message.slice(0, 300) }, /duplicate|unique/i.test(message) ? 409 : 503);
        }

        await note(data.staff_id, 'Account created.', null, { roles: parsed.roles, active: true });

        // The password travels exactly once, in this body. No redirect carries
        // it — a query string would put a live credential into browser history
        // and the platform's request logs.
        return json({ ok: true, staffId: data.staff_id, password }, 200);
      }

      // ---- change somebody's roles -----------------------------------------
      case 'roles': {
        const staffId = clean(body.staffId, 60);
        if (!staffId) return json({ ok: false, error: 'Which account?' }, 400);

        // Refusal 3. The server decides this, not the greyed-out control.
        if (who.id && staffId === who.id) {
          return json(
            {
              ok: false,
              error:
                'You cannot change your own roles. A maintainer editing their own row could grant ' +
                'themselves access to people and finance, which is the separation this table ' +
                'exists to keep. Ask another maintainer.',
            },
            403,
          );
        }

        const parsed = parseRoles(body.roles);
        if ('error' in parsed) return json({ ok: false, error: parsed.error }, 400);

        const found = await fetchOne(staffId);
        if ('error' in found) return json({ ok: false, error: found.error }, 404);

        const { error } = await client
          .from('staff')
          .update({ roles: parsed.roles })
          .eq('staff_id', staffId);
        if (error) return json({ ok: false, error: error.message.slice(0, 300) }, 503);

        await note(
          staffId,
          clean(body.reason, 500) ?? 'Roles changed.',
          { roles: found.row.roles },
          { roles: parsed.roles },
        );

        return json({ ok: true, staffId, roles: parsed.roles }, 200);
      }

      // ---- deactivate / reactivate -----------------------------------------
      case 'active': {
        const staffId = clean(body.staffId, 60);
        if (!staffId) return json({ ok: false, error: 'Which account?' }, 400);
        if (typeof body.active !== 'boolean') {
          return json({ ok: false, error: 'Active or inactive?' }, 400);
        }

        if (who.id && staffId === who.id) {
          return json(
            {
              ok: false,
              error:
                'You cannot change your own access from here. Deactivating the account you are ' +
                'signed in as is how a console ends up with no way back in. Ask another maintainer.',
            },
            403,
          );
        }

        const found = await fetchOne(staffId);
        if ('error' in found) return json({ ok: false, error: found.error }, 404);

        const { error } = await client
          .from('staff')
          .update({ active: body.active })
          .eq('staff_id', staffId);
        if (error) return json({ ok: false, error: error.message.slice(0, 300) }, 503);

        await note(
          staffId,
          clean(body.reason, 500) ?? (body.active ? 'Access restored.' : 'Access revoked.'),
          { active: found.row.active },
          { active: body.active },
        );

        return json(
          {
            ok: true,
            staffId,
            active: body.active,
            // Said in the response as well as on the screen, because this is the
            // fact somebody revoking access urgently needs and the one the UI is
            // most likely to have scrolled past.
            note: body.active
              ? 'They can sign in again now.'
              : 'They cannot sign in again. A session they already hold survives until its cookie expires — at most twelve hours.',
          },
          200,
        );
      }

      // ---- rotate a password ------------------------------------------------
      case 'rotate': {
        const staffId = clean(body.staffId, 60);
        if (!staffId) return json({ ok: false, error: 'Which account?' }, 400);

        const found = await fetchOne(staffId);
        if ('error' in found) return json({ ok: false, error: found.error }, 404);

        const password = generatePassword();
        const password_hash = await hashPassword(password);

        // `active` is deliberately NOT touched. The CLI's upsert sets it true,
        // which would quietly readmit somebody whose access was revoked; a
        // rotation is a new credential for whatever access already exists.
        const { error } = await client
          .from('staff')
          .update({ password_hash })
          .eq('staff_id', staffId);
        if (error) return json({ ok: false, error: error.message.slice(0, 300) }, 503);

        // The audit row records THAT a password changed and nothing about it.
        await note(staffId, 'Password rotated.', null, { password_rotated: true });

        return json({ ok: true, staffId, password, active: found.row.active }, 200);
      }

      default:
        return json({ ok: false, error: 'Unknown action.' }, 400);
    }
  } catch (err) {
    console.error('staff endpoint threw:', err instanceof Error ? err.message : err);
    return json({ ok: false, error: 'That did not complete. Nothing was changed.' }, 500);
  }
};
