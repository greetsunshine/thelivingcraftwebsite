# LC-V4-D17 — User isolation

## Caption

A shared table can make a system simpler. It can also make a missing filter much more consequential.

Imagine an assistant that can use shared reference material and a person's private records. A query returns both. Everything works until another endpoint forgets which records belong to whom.

I would want the access boundary to survive that mistake, rather than depend on every caller remembering the same condition.

The storage pattern is only part of the design. We need to know how identity reaches the data layer, where permissions are enforced, and how the same rules apply to retrieval, background jobs, caches and logs.

I would test a request using another person's record identifier. I would also test what changes when someone leaves an organisation or withdraws access.

This is an illustrative example, not a claim that one database pattern fits every application.

Pick one private record in your system. Can you follow its access rules through every path that can return it?
