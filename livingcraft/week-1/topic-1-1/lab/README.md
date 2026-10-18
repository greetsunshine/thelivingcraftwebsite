> **New to the lab?** Start with [RUN_THE_LAB.md](RUN_THE_LAB.md) for Python requirements, downloading or cloning the files, commands to run, expected results, and troubleshooting.

# Topic 1.1 Lab — Draw the Action Boundary
## Learner workbook: exact edits to make

Your goal is to make **two specific changes** to the test file. You do not need to invent code or change the security implementation. Follow the steps exactly.

## What you need

- Python 3.10 or newer
- The files `refund_agent.py` and `test_refund_agent.py` in the same folder
- No extra Python packages

---

## Part 1 — Run the starter code before editing

### Step 1. Open a terminal in this folder

Run:

```bash
python refund_agent.py
```

You should see these outcomes:

- Valid ₹300 refund: allowed
- Read-only caller: blocked
- Refund above amount paid: blocked
- ₹700 refund without approval: blocked

### Step 2. Run the existing tests

Run:

```bash
python -m unittest -v
```

The starter code should pass **9 tests**. This is your baseline. If it does not, stop and fix the setup before editing.

---

## Part 2 — Change 1: add a test for a missing refund scope

### What are you proving?

A person with the job role `refund_operator` must still be denied if they do **not** have the `refund:issue` scope.

### Step 3. Open `test_refund_agent.py`

Find this existing test near the bottom:

```python
def test_scope_without_permitted_role_is_not_enough(self):
    role_mismatch = Principal(
        subject="other", role="read_only_support",
        scopes=frozenset({"refund:issue"}),
        accessible_order_ids=frozenset({"order-100"}),
    )
    with self.assertRaises(AuthorizationError):
        issue_refund(role_mismatch, "order-100", 100)
    self.assertEqual(EXECUTED_REFUNDS, [])
```

### Step 4. Immediately AFTER that method, add this exact new method

Copy and paste the code below at the same indentation level as the other `def test_...` methods. It must be inside the `RefundBoundaryTests` class.

```python
    def test_refund_operator_without_refund_scope_is_denied(self):
        no_scope = Principal(
            subject="support-agent-no-scope",
            role="refund_operator",
            scopes=frozenset({"orders:read"}),
            accessible_order_ids=frozenset({"order-100"}),
        )

        with self.assertRaises(AuthorizationError):
            issue_refund(no_scope, "order-100", 100)

        self.assertEqual(EXECUTED_REFUNDS, [])
```

### Step 5. Check the change

Save the file and run:

```bash
python -m unittest -v
```

You should now see **10 tests pass**.

If you get an `IndentationError`, check that the new method starts with four spaces before `def`, and that its contents are indented by eight spaces. Do not put the method inside another test.

**Why this test matters:** it proves that the role check does not replace the scope check.

---

## Part 3 — Change 2: add a test for approval tied to the wrong order

### What are you proving?

An approval for one order must not authorize a refund for a different order.

### Step 6. Still in `test_refund_agent.py`, find this existing test

```python
def test_approval_for_different_amount_is_denied(self):
    approval = TrustedApproval("approval-10", "order-100", Decimal("650.00"), "manager-2")
    with self.assertRaises(AuthorizationError):
        issue_refund(self.operator, "order-100", 700, trusted_approval=approval)
    self.assertEqual(EXECUTED_REFUNDS, [])
```

### Step 7. Immediately AFTER that method, add this exact new method

```python
    def test_approval_for_different_order_is_denied(self):
        approval = TrustedApproval(
            "approval-11",
            "order-200",
            Decimal("700.00"),
            "manager-2",
        )

        # The approval names order-200, but the requested refund is for order-100.
        with self.assertRaises(AuthorizationError):
            issue_refund(
                self.operator,
                "order-100",
                700,
                trusted_approval=approval,
            )

        self.assertEqual(EXECUTED_REFUNDS, [])
```

### Step 8. Run the tests again

Run:

```bash
python -m unittest -v
```

You should now see **11 tests pass**.

**Why this test matters:** approval is not a general “yes.” It is bound to the exact resource and amount being approved.

---

## Part 4 — Read the main code without changing it

You do **not** need to edit `refund_agent.py` for this exercise. Read these exact functions in order:

1. `issue_refund()` — the overall action boundary.
2. `require_permission()` — checks scope and role.
3. `require_resource_access()` — checks access to the specific order.
4. `validate_refund()` — checks amount and approval.
5. `execute_refund()` — simulates the side effect.

As you read, answer these questions in your own words:

- Which line stops a read-only caller?
- Which line stops a refund greater than the amount paid?
- Why does a ₹700 refund need approval?
- Why is `execute_refund()` called only after all checks?
- Why do negative tests check both the exception and `EXECUTED_REFUNDS == []`?

---

## Part 5 — Final checklist

- [ ] I ran `python refund_agent.py` before editing.
- [ ] The original 9 tests passed before I changed anything.
- [ ] I added `test_refund_operator_without_refund_scope_is_denied`.
- [ ] I added `test_approval_for_different_order_is_denied`.
- [ ] All 11 tests pass.
- [ ] I can explain why denied requests do not execute.

## If something goes wrong

1. Confirm both Python files are in the same folder.
2. Confirm the two new methods are indented exactly like the other test methods.
3. Confirm you pasted each method **inside** `RefundBoundaryTests`, not after the class ends.
4. Run `python -m unittest -v` again and read the first error.

## Safety boundary

This is a local simulation. `EXECUTED_REFUNDS` is an in-memory list, not a real payment gateway. The scaffold assumes authentication has already happened. Do not connect it to real money or trust identity/approval claims generated by an LLM.
