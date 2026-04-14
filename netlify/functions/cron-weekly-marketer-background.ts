import { schedule } from '@netlify/functions';
import { handler as dispatcher } from './cron-dispatcher-background.js';

// Monday 02:00 UTC = 07:30 IST Monday
export const handler = schedule('0 2 * * 1', async (event) => {
  return (await dispatcher(
    { ...event, queryStringParameters: { job: 'weekly-marketer' } } as Parameters<typeof dispatcher>[0],
    {} as Parameters<typeof dispatcher>[1],
    () => undefined
  )) ?? { statusCode: 200, body: 'ok' };
});
