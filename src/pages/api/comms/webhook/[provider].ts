// Provider callbacks land here: /api/comms/webhook/resend.
//
// Public by necessity, and safe because of what lib/comms/webhooks.ts does
// before it reads anything: verifies the provider's signature over the raw
// body. A request without a valid signature gets a bare 401 whatever it
// contains. Nothing here is rendered, cached or indexed.

import type { APIRoute } from 'astro';
import { handleProviderWebhook } from '../../../../lib/comms/webhooks';

export const prerender = false;

export const POST: APIRoute = async ({ params, request }) => {
  const provider = String(params.provider ?? '').toLowerCase();
  const res = await handleProviderWebhook(provider, request);
  res.headers.set('Cache-Control', 'no-store');
  return res;
};

export const GET: APIRoute = async () => new Response('', { status: 405 });
