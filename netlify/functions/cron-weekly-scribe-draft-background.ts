import { schedule } from '@netlify/functions';
import { handler as dispatcher } from './cron-dispatcher-background.js';

// Wednesday 03:00 UTC = 08:30 IST Wednesday
// Runs 2 days after Scribe's Monday trend scan, giving the owner ~48 hours to
// approve topics before drafting fires.
export const handler = schedule('0 3 * * 3', async (event) => {
  return (await dispatcher(
    { ...event, queryStringParameters: { job: 'weekly-scribe-draft' } } as Parameters<typeof dispatcher>[0],
    {} as Parameters<typeof dispatcher>[1],
    () => undefined
  )) ?? { statusCode: 200, body: 'ok' };
});
