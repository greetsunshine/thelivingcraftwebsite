export const prerender = false;

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';

type Action = 'done' | 'dismiss' | 'snooze_1d' | 'snooze_1w' | 'reopen';

function getSql() {
  const url = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL must be set');
  return neon(url);
}

export const POST: APIRoute = async ({ params, request, redirect }) => {
  const id = params.id;
  if (!id) {
    return new Response('Missing task id', { status: 400 });
  }

  const adminToken = import.meta.env.ADMIN_SECRET_TOKEN ?? process.env.ADMIN_SECRET_TOKEN;
  if (adminToken) {
    const provided = request.headers.get('x-admin-token') ?? '';
    const cookie = request.headers.get('cookie') ?? '';
    const cookieToken = /admin_token=([^;]+)/.exec(cookie)?.[1] ?? '';
    if (provided !== adminToken && cookieToken !== adminToken) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const form = await request.formData();
  const action = (form.get('action') as Action | null) ?? null;
  if (!action) {
    return new Response('Missing action', { status: 400 });
  }

  const sql = getSql();
  const now = new Date().toISOString();

  switch (action) {
    case 'done':
      await sql`
        UPDATE tasks
        SET status = 'done', completed_at = ${now}, updated_at = NOW()
        WHERE id = ${id}
      `;
      break;
    case 'dismiss':
      await sql`
        UPDATE tasks
        SET status = 'dismissed', updated_at = NOW()
        WHERE id = ${id}
      `;
      break;
    case 'snooze_1d': {
      const until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await sql`
        UPDATE tasks
        SET status = 'snoozed', snoozed_until = ${until}, updated_at = NOW()
        WHERE id = ${id}
      `;
      break;
    }
    case 'snooze_1w': {
      const until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await sql`
        UPDATE tasks
        SET status = 'snoozed', snoozed_until = ${until}, updated_at = NOW()
        WHERE id = ${id}
      `;
      break;
    }
    case 'reopen':
      await sql`
        UPDATE tasks
        SET status = 'open', snoozed_until = NULL, completed_at = NULL, updated_at = NOW()
        WHERE id = ${id}
      `;
      break;
    default:
      return new Response('Unknown action', { status: 400 });
  }

  return redirect('/admin/workspace/#tasks', 303);
};
