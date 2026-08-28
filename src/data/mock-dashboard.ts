export const mockBriefing = {
  date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
  body: `Week 4 material landed on Wednesday, so I read it and there are two things worth your ten minutes before Saturday. First, your PR from last week has two new findings on blast radius that need your response. Second, the new material introduces the worker-loop pattern which you'll need for your next PR.`,
  urgent: true,
};

export const mockMemberState = [
  { dimension: 'D1', title: 'Architecture & Design', level: 3, score: 2.8, trend: 'up' },
  { dimension: 'D2', title: 'Context Management', level: 2, score: -1.5, trend: 'flat' },
  { dimension: 'D3', title: 'Evaluation & Metrics', level: 0, score: 0, trend: 'flat' },
  { dimension: 'D4', title: 'Security & Containment', level: 4, score: 5.2, trend: 'up' },
  { dimension: 'D5', title: 'Production Operations', level: 1, score: -3.5, trend: 'down' },
];

export const mockPrReviews = [
  {
    id: 'pr-14',
    url: 'https://github.com/thelivingcraft/cohort-1/pull/14',
    date: 'Oct 12, 2026',
    status: 'approved',
    reviewerConfidence: 0.85,
    findings: [
      {
        id: 'f-1',
        dimension: 'D4',
        severity: 'concern',
        question: 'What happens to in-flight work if that worker dies mid-loop?',
        rationale: 'The worker pulls from the queue and processes, but does not use a visibility timeout or DLQ. If the process is OOM-killed, the message is lost forever.',
        confidence: 0.9,
        evidence: {
          path: 'worker/processor.ts',
          line_start: 45,
          line_end: 48,
          quote: 'const msg = await queue.pop();\nawait process(msg.data);\n// no ack required'
        }
      },
      {
        id: 'f-2',
        dimension: 'D1',
        severity: 'observation',
        question: 'Why not use a standard exponential backoff here?',
        rationale: 'The retry loop uses a fixed 1-second delay. For external API calls, this can lead to throttling.',
        confidence: 0.75,
        evidence: {
          path: 'worker/api.ts',
          line_start: 112,
          line_end: 114,
          quote: 'catch (e) {\n  await new Promise(r => setTimeout(r, 1000));\n  return fetchApi();\n}'
        }
      }
    ]
  }
];

export const mockChatHistory = [
  { role: 'assistant', text: 'How can I help you with your system today?' },
  { role: 'user', text: 'Should I use a queue here for the worker?' },
  { role: 'assistant', text: 'If you use a queue, how do you plan to handle messages that fail processing repeatedly? What happens to the dead letters?' }
];
