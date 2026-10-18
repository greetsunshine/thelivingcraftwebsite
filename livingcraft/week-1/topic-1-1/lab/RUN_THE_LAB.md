# Run the Topic 1.1 Lab

This guide is for learners who want to run the lab from a local computer. You do not need to install a framework or connect to any external service.

## What you will run

A small Python simulation of a protected `issue_refund()` tool. It demonstrates:
- a permitted ₹300 refund;
- a read-only caller being blocked;
- a refund above the amount paid being blocked;
- a ₹700 refund being blocked when approval is missing.

The exercise assumes that identity has already been authenticated. It does not implement OAuth/OIDC token validation and does not connect to a real payment system.

## Requirements

- Python 3.10 or newer
- Git (optional, if you want to clone the repository)
- A terminal: Terminal on macOS/Linux, or PowerShell on Windows

Check whether Python is installed:

```bash
python --version
```

If that command is not found, try:

```bash
python3 --version
```

Use whichever command reports Python 3.10 or newer in the steps below. On Windows, `py -3 --version` may also work.

## Option A — Download the two lab files from GitHub

1. Open the [lab folder on GitHub](https://github.com/greetsunshine/thelivingcraftwebsite/tree/workspace/livingcraft-course/livingcraft/week-1/topic-1-1/lab).
2. Open `refund_agent.py`.
3. Click **Raw**, then save the file as `refund_agent.py` in a new folder on your computer.
4. Repeat for `test_refund_agent.py`, saving it in the **same folder**.
5. Open a terminal in that folder.

Make sure the two files are next to each other:

```text
topic-1-1-lab/
  refund_agent.py
  test_refund_agent.py
```

## Option B — Clone the repository

If Git is installed, run:

```bash
git clone --branch workspace/livingcraft-course https://github.com/greetsunshine/thelivingcraftwebsite.git
cd thelivingcraftwebsite/livingcraft/week-1/topic-1-1/lab
```

## Step 1 — Run the demonstration

On macOS/Linux, use `python3` if `python` does not point to Python 3:

```bash
python refund_agent.py
```

Expected behavior (the exact wording may vary slightly):

- `Valid ₹300 refund: ALLOWED`
- `Read-only caller: BLOCKED`
- `Refund exceeds amount paid: BLOCKED`
- `Approval missing: BLOCKED`

Each blocked case should report `executions=0`. That is important: a denied request must not perform the simulated side effect.

## Step 2 — Run the starter tests

Run this in the same folder:

```bash
python -m unittest -v
```

On macOS/Linux, if needed:

```bash
python3 -m unittest -v
```

On Windows, if needed:

```powershell
py -3 -m unittest -v
```

The starter test file contains **9 tests**. All 9 should pass before you edit anything. If not, stop and resolve the error first.

## Step 3 — Complete the two test exercises

Open [the learner lab instructions](README.md) and follow **Part 2** and **Part 3** exactly:
1. Add the test for an operator without the required refund scope.
2. Add the test for an approval that names a different order.

You do not need to edit `refund_agent.py`. The instructions specify the exact insertion point and full code to paste.

After adding the first test, rerun the tests: **10 should pass**.
After adding the second test, rerun the tests: **11 should pass**.

## Step 4 — Interpret the result

For each denied request, the tests check two things:
1. the expected exception was raised; and
2. `EXECUTED_REFUNDS` remained empty.

Checking only an error message is not enough. A security test should also establish that the protected operation did not execute.

## Troubleshooting

### `python: command not found`
Try `python3` on macOS/Linux, or `py -3` on Windows.

### `ModuleNotFoundError: No module named 'refund_agent'`
Make sure the terminal's current directory contains both `refund_agent.py` and `test_refund_agent.py`. You do not need to install a package.

### Tests cannot find the module
Run `pwd` (macOS/Linux) or `Get-Location` (PowerShell) to check the current folder. Then change to the lab directory and rerun the command.

### `IndentationError` after adding a test
Follow the indentation in `README.md`: the new method must be inside `RefundBoundaryTests` and aligned with the other `def test_...` methods.

### Unicode rupee symbol displays incorrectly
The currency symbol is only part of the demonstration text. The authorization and tests do not depend on the terminal's ability to display it.

## Safety note

This is an educational, in-memory simulation only. Do not connect it to a payment gateway or real customer data. In a production system, identity and tokens must be validated by trusted application infrastructure, and the resource-owning service must enforce its own critical invariants.
