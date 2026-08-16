// Drop the session cookie.
//
// Allowlisted in middleware alongside login: signing out must work even when
// the session is already invalid, or a half-expired cookie leaves you at a
// login page with a "Sign out" button that 401s.

import type { APIRoute } from 'astro';
import { COOKIE_NAME } from '../../../lib/admin/auth';

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(COOKIE_NAME, { path: '/' });
  return redirect('/admin/login', 303);
};
