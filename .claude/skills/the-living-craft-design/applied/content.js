/* One body of content, rendered by all three directions, so the comparison is
   about the direction and not about the copy. */
window.TLC = {
  wordmark: "The Living Craft",
  nav: ["Programme", "Field notes", "Apply"],
  facts: [
    { label: "Cohort", value: "04 — Sep" },
    { label: "Seats", value: "8", mono: true },
    { label: "Fee", value: "\u20B91,20,000", mono: true },
    { label: "Length", value: "6 weeks" },
  ],
  claim: "Anyone can show you the agent pattern. I can show you the three times it failed in production.",
  section: { index: "03.2", title: "Where the retry loop failed", note: "Two incidents, six weeks apart, one wrapper that looked idempotent." },
  prose1: "The wrapper was written by someone careful. It checked for an existing job id before it submitted, and under test it never double-submitted once in four thousand runs.",
  prose2: "What the test did not know is that the queue was configured for at-least-once delivery, and the consumer acknowledged before it committed. The pattern was right. The deployment around it was not.",
  cite: { n: 4, source: "queue/config.yaml:31 \u2014 read at run 118" },
  citedText: "the queue was configured for at-least-once delivery",
  agent: "The retry wrapper around submitJob reads as idempotent, but I could not open the consumer, so I have not checked the acknowledgement order.",
  refusal: { reason: "I won't summarise this incident \u2014 the postmortem is a draft and two of its claims contradict each other.", next: "Ask Arun, or read both versions in \u00A7 04." },
  rows: [
    { id: 1, pr: "#4821", finding: "Retry wrapper is not idempotent under at-least-once", who: "reviewer", state: "machine", conf: 0.6 },
    { id: 2, pr: "#4818", finding: "Queue config unread \u2014 finding is partial", who: "reviewer", state: "uncertain", conf: 0.2 },
    { id: 3, pr: "#4802", finding: "Fan-out bound removed; approved with a note", who: "Arun", state: "human", conf: 1 },
    { id: 4, pr: "#4791", finding: "Postmortem is a draft; declined to summarise", who: "scout", state: "refused", conf: 0 },
  ],
};
