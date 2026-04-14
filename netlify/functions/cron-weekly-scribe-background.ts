import { schedule } from '@netlify/functions';
import { handler as dispatcher } from './cron-dispatcher-background.js';

// Monday 03:00 UTC = 08:30 IST Monday
export const handler = schedule('0 3 * * 1', async (event) => {
  return (await dispatcher(
    { ...event, queryStringParameters: { job: 'weekly-scribe' } } as Parameters<typeof dispatcher>[0],
    {} as Parameters<typeof dispatcher>[1],
    () => undefined
  )) ?? { statusCode: 200, body: 'ok' };
});
