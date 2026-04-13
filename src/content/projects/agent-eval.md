---
title: "AgentEval"
description: "A lightweight, opinionated framework for building evaluation loops that catch agent failures before production. Designed for teams who need rigour without ceremony."
subtitle: "Evaluation framework for agentic AI systems"
status: "Live"
statusColor: "emerald"
tag: "Open Source"
tagColor: "violet"
stack: ["TypeScript", "Anthropic SDK", "Vitest"]
links:
  - label: "GitHub"
    href: "https://github.com/thelivingcraft/agent-eval"
  - label: "Docs"
    href: "https://github.com/thelivingcraft/agent-eval#readme"
featured: true
---

## The problem

Most agentic AI projects have no evaluation infrastructure until something breaks in production. By then, the cost of adding evaluation — in time, in rework, in trust — is much higher than building it at the start.

AgentEval is an opinionated framework that makes evaluation infrastructure the default, not the afterthought.

## What it does

- **Ground truth case management** — define expected inputs/outputs in YAML, versioned with your code
- **LLM-as-judge scoring** — automated quality scoring using a configurable rubric
- **Regression gates** — fail CI if evaluation pass rate drops below threshold
- **Drift detection** — track performance over time with rolling windows

## What we learned in the first week

The hardest part of evaluation is not the tooling — it's deciding what "correct" means for your specific agent. Teams that skip this step end up with evaluation infrastructure that measures the wrong things.

The framework enforces a `rubric.yaml` at setup time precisely to force this conversation early.

## Design principles

- Zero infrastructure dependencies — runs in CI with no external services
- Test files are plain markdown — readable by anyone on the team, not just engineers
- Scoring is configurable — bring your own judge model or use the default
- Fail loud — ambiguous results are failures, not warnings
