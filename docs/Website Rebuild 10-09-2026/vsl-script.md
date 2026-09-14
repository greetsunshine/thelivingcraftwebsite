# A working system and the decisions behind it

Imagine you are watching an agent handle a customer’s return. It finds a policy, explains the options and recommends a refund. The conversation looks good. You can follow the answer, and it is easy to see how the idea could be useful.

Then someone asks a perfectly reasonable question. Can it issue the refund as well?

On a diagram, that might look like one more connection. In the real world, the system can now move money. And that changes the conversation.

What gives it permission? Which evidence is enough? What happens when the same customer sends the same request twice? What if the tool times out and we cannot tell whether the refund happened?

This is an illustrative example. But it captures the kind of question I want us to spend time on: how do we connect what an agent can do with a design we can understand, examine and explain?

I’m Sunil Mathew. My engineering and leadership experience includes Google, Amazon, Walmart and startups. At The Living Craft, I bring that perspective into a practical programme on designing and critiquing agentic systems, and guiding a team’s architecture decisions.

If you already work with system design, you know that the interesting part is often the trade-off. A design can look clean until you put it next to a real constraint. A useful review helps you understand which decision matters and what evidence would change your mind.

Let’s go back to the returns example for a moment. I would first separate the recommendation from the action. The assistant might gather policy evidence and prepare an answer. The refund tool needs its own controls over what it will actually allow.

Then I would look at uncertainty. Suppose the request falls outside the policy we have. We need a clear next step. Suppose the tool responds slowly or gives us an ambiguous result. We need a way to examine the state of the action before deciding whether to repeat it.

And I would want to see more than a successful final answer. Which evidence did the system use? What did the tool do? Did the workflow stay within its intended boundaries? If something went wrong, can the team explain where and why?

Once we can see those things, evaluation becomes useful to the design. It can tell us where a permission is too broad, where evidence is missing or where a person needs to make a decision. We can make a change and examine the behaviour again.

That connection between building, reasoning and evidence is central to The Living Craft. You work on a functioning agentic system, and you practise explaining the choices behind it. The working system gives us something concrete to discuss and revise.

We explore purpose and constraints, tools and authority, evaluation, reliability, cost and accountability. The aim is to strengthen your ability to design and critique the system, and to help a team reason through its own design decisions.

Guiding a team does not mean replacing every idea with your preferred architecture. It means understanding the decision in front of the team, asking useful questions and helping identify the next piece of work. Perhaps that is a test. Perhaps it is a narrower permission. Perhaps it is a clearer explanation of the trade-off.

Continuous feedback supports that practice. We look at strengths, gaps and what to work on next. There is no certificate. The focus is the capability you develop through the work and the discussions around it.

The programme includes 30 live hours with me, plus independent work. Before joining, we will need to confirm the session schedule, the independent-work commitment and the complete programme terms with you. Make room for the practical work as well as the live conversations.

You do not need to bring confidential company architecture to apply. Industry-specific practice is the default. A company-specific case needs its own scope and permission. If your organisation wants a team programme, that is a separate enterprise conversation.

For the open cohort, the useful starting point is your experience. What systems have you worked with? Which decisions are you responsible for? What would you like to get better at designing, reviewing or explaining? You may be self-funded or need employer support; the application can help us understand that route too.

If this is the kind of practice you are looking for, explore the open cohort. Tell us about your starting point and one question you want to work on. We can discuss fit, current availability and the full commitment before you decide.
