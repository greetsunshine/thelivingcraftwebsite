import { schedule } from '@netlify/functions';
import { handler as dispatcher } from './cron-dispatcher-background.js';

// Sunday 22:00 UTC = Monday 03:30 IST — Sunil finds the reading list waiting
// when he opens the laptop Monday morning. Runs BEFORE the Monday trend scan
// so fresh intelligence can inform topic ranking.
export const handler = schedule('0 22 * * 0', async (event) => {
  return (await dispatcher(
    { ...event, queryStringParameters: { job: 'weekly-scribe-intelligence' } } as Parameters<typeof dispatcher>[0],
    {} as Parameters<typeof dispatcher>[1],
    () => undefined
  )) ?? { statusCode: 200, body: 'ok' };
});
