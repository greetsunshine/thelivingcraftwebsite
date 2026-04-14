import { schedule } from '@netlify/functions';
import { handler as dispatcher } from './cron-dispatcher-background.js';

// 01:30 UTC daily = 07:00 IST
export const handler = schedule('30 1 * * *', async (event) => {
  return (await dispatcher(
    { ...event, queryStringParameters: { job: 'daily-brief' } } as Parameters<typeof dispatcher>[0],
    {} as Parameters<typeof dispatcher>[1],
    () => undefined
  )) ?? { statusCode: 200, body: 'ok' };
});
