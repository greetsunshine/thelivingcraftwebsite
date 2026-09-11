# LC-OCT-D03 Where should an agent stop?

Before I ask which model an agent uses, I want to understand its authority.

In this illustrative returns workflow, recommending a refund and issuing one are different responsibilities. A boundary makes that difference visible to the team and testable in the system.

The Living Craft brings this kind of reasoning into a working build, evaluation and design review. Explore the open cohort if these are decisions you want to own.

Programme and application: https://learning.thelivingcraft.ai/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=cohort_enterprise_v3&utm_content=lc-oct-d03

## Spoken script

Before I ask which model an agent uses, I want to understand what it is allowed to do.

Imagine a retail returns assistant. It reads a policy, looks at the request and recommends a refund. Now connect a tool that can issue that refund. The task may sound similar, but the authority has changed.

I would separate the recommendation from the action. What evidence permits the refund? Which limits must the tool enforce? Where does an uncertain request go? And what happens if the same request arrives twice?

These are architecture questions the team should be able to explain. A prompt can describe the intended behaviour, but the action boundary also needs to exist in the system.

This is an illustrative example of the work we discuss at The Living Craft. Members build a working agentic system, examine its behaviour and practise defending the design choices behind it. If you already work with system design and want to develop that judgment, explore the open cohort.

