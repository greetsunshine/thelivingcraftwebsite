// Drop the learner session cookie.
//
// Allowlisted in middleware alongside login, for the same reason as the admin
// one: signing out must work even when the session is already invalid.

import type { APIRoute } from 'astro';
import { COOKIE_NAME } from '../../../lib/craft/auth';

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(COOKIE_NAME, { path: '/' });
  return redirect('/craft/login', 303);
};
