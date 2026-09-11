// Internal teaching schedule for the authenticated /craft learner area.
//
// This is not a public offer source. The public V4 programme copy lives in
// cohort-copy.ts and offer-display.ts and intentionally publishes no start
// date or week count.

export const learnerCohort = {
  name: 'The Living Craft',
  weeks: 6,
  seats: 8,
  startsOn: 'September 2026',
  commitment: '~5 hrs / week',
  format: 'Live online (Bangalore: hybrid — in person or online)',
  admission: 'By application; every application read personally',
  enrollment: 'Rolling until all 8 seats are filled',
  modules: [
    { id: 'M1', weeks: 'Week 1', title: 'Foundations of durable architecture' },
    { id: 'M2', weeks: 'Weeks 2–4', title: "Agentic systems you'd put your name on" },
    { id: 'M3', weeks: 'Week 5', title: 'Scale, consistency & the irreversible trade-offs' },
    { id: 'M4', weeks: 'Week 6', title: 'Your system, reviewed in the room' },
  ],
  outcomes: [
    'Design agentic systems with bounded failure, observability, and defensible cost',
    'Build the evaluation harnesses and quality gates that prove a system works',
    'Engineer reliability for models that are probabilistic by nature',
    'Threat-model and red-team your own system for prompt injection and exfiltration',
    'Govern an AI-native team — risk-tiered review and accountability for AI-written code',
  ],
};
