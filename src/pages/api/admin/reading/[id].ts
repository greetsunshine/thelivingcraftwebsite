export const prerender = false;

import type { APIRoute } from 'astro';
import { neon } from '@neondatabase/serverless';

type Action = 'read' | 'reading' | 'unread' | 'archived' | 'dismiss';

function getSql() {
  const url = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL must be set');
  return neon(url);
}

export const POST: APIRoute = async ({ params, request, redirect }) => {
  const id = params.id;
  if (!id) return new Response('Missing id', { status: 400 });

  const form = await request.formData();
  const action = (form.get('action') as Action | null) ?? null;
  if (!action) return new Response('Missing action', { status: 400 });

  // Map UI action names to DB status values
  const statusMap: Record<Action, string> = {
    read: 'read',
    reading: 'reading',
    unread: 'unread',
    archived: 'archived',
    dismiss: 'dismissed',
  };
  const status = statusMap[action];
  if (!status) return new Response('Unknown action', { status: 400 });

  const sql = getSql();
  await sql`
    UPDATE reading_list
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `;

  return redirect('/admin/reading/', 303);
};
