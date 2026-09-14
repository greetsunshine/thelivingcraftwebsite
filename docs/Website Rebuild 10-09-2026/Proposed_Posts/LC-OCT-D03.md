# LC-OCT-D03 Where should an agent stop?

A refund recommendation and a refund payment can look like one step on a whiteboard.

The customer’s bank account would disagree.

In this illustrative example, I walk through what changes when an agent gains permission to act. The interesting questions are about evidence, limits and who handles uncertainty.

We practise this reasoning through a working build at The Living Craft. Explore the open cohort if these are decisions you want to own.

Programme and application: https://learning.thelivingcraft.ai/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=cohort_enterprise_v3&utm_content=lc-oct-d03

## Spoken script

Imagine a returns assistant. It reads the policy, checks a request and recommends a refund. So far, you can look at its answer and decide what to do.

Then we connect a tool that can issue the refund. It looks like one more box on the diagram. But that box can move money.

That is where I would stop and ask a few questions. What evidence permits the action? What limits does the tool enforce? If the same request arrives again, can we recognise it? And if the policy does not give us a clear answer, who takes over?

The recommendation and the payment need different controls. Writing a reassuring instruction in the prompt does not, by itself, create those controls in the system.

This is an illustrative example, but it gives us a concrete design to discuss. We can build it, examine its behaviour and change our decisions when the evidence calls for it.

That is the kind of practice we bring into The Living Craft. If you already work with system design and want to strengthen how you design, critique and guide agentic systems, explore the open cohort.
