# Agent Memory Audit Kit

Every fact your agent remembers needs three answers: where it came from,
where it applies, and what happens when someone corrects it.

Built by Sunil Mathew, co-authored with Claude · The Living Craft
https://learning.thelivingcraft.ai/resources/agent-memory-audit-kit

## What is in the kit

| Path | What it is |
|---|---|
| `agent-memory-audit-kit.pdf` | The page as a printable document: the schema, 12 audit questions, 7 failure tests, and the decision table |
| `schema/memory-record.schema.json` | The memory record schema, JSON Schema draft 2020-12. Fields for source, evidence, scope, expiry and correction route |
| `examples/` | Four records in that shape: a stated fact scoped to one trip, an instance-scoped correction, a policy pointer, and a tombstone |
| `harness/` | The `MemoryStore` protocol, a naive store that fails all seven tests, a reference store that passes them, and the tests |
| `LICENSE-content.md` | CC BY 4.0, for the written content |
| `LICENSE-code.md` | MIT, for the code |

## Start here

```bash
cd harness
python3 -m venv .venv && source .venv/bin/activate   # Python 3.11 or newer
pip install -e .
pytest                  # reference store: 7 passed
pytest --store=naive    # naive store: 7 failed (on purpose)
```

Then read `harness/README.md` to run the same seven tests against your own
agent's memory layer.

## The four documents, in the order to use them

1. **The schema.** Copy it into your memory layer's design review. Every
   field exists because a real failure needed it.
2. **The 12 audit questions.** Run them against one remembered fact in your
   system. Any red flag is a design task.
3. **The 7 failure tests.** Run them against the naive store and watch all
   seven fail. Then the reference store. Then your own.
4. **The decision table.** Four outcomes: Remember, Revalidate, Ask, Forget.
   One page. Put it next to the design review.

## Licence

Written content (the PDF, this README, the documentation) is licensed under
CC BY 4.0. Code (the schema, the examples, the harness) is licensed under MIT.
