"""All the words and the worked-example figures for the Token Limit Framework.

Kept apart from build_sheet.py so that changing a sentence is not a change to
the layout code, and so the tool page and the sheet can be read side by side
when they are meant to say the same thing.
"""

TITLE = "Token Limit Framework"
TAGLINE = "Decide what your agent does when it's told no — before a traffic spike decides for you."
AUTHOR = "Sunil Mathew · The Living Craft"
SITE = "thelivingcraft.ai"
FOOTER = "© The Living Craft · thelivingcraft.ai · Content CC BY 4.0"

WHAT_TO_BRING = (
    "One agent workflow you run or plan to run, the steps it takes, rough token counts per "
    "step (from traces or an estimate), and the rate and token limits it runs under."
)
WHAT_TO_DO = (
    "Map the steps, list every limit that can refuse the agent, model retry amplification at "
    "peak, define a stop state for every step with a side effect, and score the ten checks."
)
WHAT_YOU_LEAVE_WITH = (
    "A token-limit policy for that workflow (per-task budget, retry rule, stop states with "
    "clean-up owners) and a decision: Ready to scale, Fix first, or Hold."
)
HOW_TO_USE = "Work left to right through tabs 1–5. The Worked Example tab shows a completed version."
LEGEND = "Shaded cells are yours to fill. Everything else calculates."

# The five questions, one per working tab.
QUESTIONS = [
    ("1", "What does one run of this workflow cost, step by step?", "1 · Workflow Map"),
    ("2", "Which limits can refuse the agent, and who shares them?", "2 · Limits"),
    ("3", "How far can retries amplify spend at peak?", "3 · Retry Amplifier"),
    ("4", "If the agent stops at each step, what's left behind and who cleans it up?", "4 · Stop States"),
    ("5", "Is the limit policy good enough to scale?", "5 · Decision"),
]

TAB_COVER = "0 · Start here"
TAB_MAP = "1 · Workflow Map"
TAB_LIMITS = "2 · Limits"
TAB_RETRY = "3 · Retry Amplifier"
TAB_STOP = "4 · Stop States"
TAB_DECISION = "5 · Decision"
TAB_EXAMPLE = "6 · Worked Example"

STEP_ROWS = 12
LIMIT_ROWS = 10

# --- dropdown vocabularies ------------------------------------------------
YESNO = ["Yes", "No"]
SIDE_EFFECTS = ["None", "Reversible", "Irreversible"]
SCOPES = ["Per call", "Per task", "Per user", "Per tenant", "Shared across workflows"]
UNITS = ["tokens", "requests", "currency"]
WINDOWS = ["per minute", "per hour", "per day", "per month", "per request"]
HANDLING = ["Retry immediately", "Retry with backoff", "Fail task", "Queue", "Degrade", "Unknown"]
RETRY_SCOPES = ["Restart task", "Resume from last checkpoint", "Retry the call only"]
AUTO_MANUAL = ["Automatic", "Manual"]
STOP_COST = ["Low", "Medium", "High"]
ANSWERS = ["Yes", "Partial", "No"]

# --- tab 1 ----------------------------------------------------------------
MAP_HEADERS = [
    ("Step #", 8, None),
    ("Step name", 28, "Plain words. \"Read calendars\", not \"step 2\"."),
    ("Calls a model?", 14, None),
    ("Calls an external API?", 16, None),
    ("Side effect", 16, "Holding a room is Reversible. Sending an invite is Irreversible."),
    ("Input tokens", 13, "Tokens sent on this step, including carried context."),
    ("Output tokens", 13, None),
    ("Step tokens", 15, None),
    ("Cumulative tokens", 19, None),
    ("Idempotent on retry?", 16, "Can this step safely run twice?"),
    ("Checkpoint saved after step?", 18, "Can a retry resume here instead of restarting?"),
]

# --- tab 2 ----------------------------------------------------------------
LIMIT_PROMPTS = [
    "model provider tokens per minute",
    "model provider requests per minute",
    "daily or monthly spend cap",
    "max context window",
    "downstream API rate limit (e.g. calendar)",
    "your own per-task budget",
    "per-user or per-tenant budget",
]
# Column A is a row number on every other tab, so it is one here too. Without
# it the limit name sits in A, and on the worked-example sheet — where all five
# blocks share one set of column widths — the name is cut to "Model pro".
LIMIT_HEADERS = [
    ("#", 8, None),
    ("Limit", 34, None),
    ("Scope", 24, None),
    ("Value", 14, None),
    ("Unit", 12, None),
    ("Window", 14, None),
    ("Shared with", 26, "e.g. \"all agents on this API key\""),
    ("Refusal signal", 24, "e.g. \"HTTP 429 + Retry-After\""),
    ("Current handling", 20, None),
    ("Owner", 18, None),
]

# --- tab 3 ----------------------------------------------------------------
BILLED_NOTE = "Most providers don't bill rejected calls. Check yours."
PLANNING_NOTE = (
    "This is a planning bound, not a forecast. It assumes every task hits the limit at the "
    "same step. Real traffic is messier; use it to see whether your retry design can take "
    "the whole system down."
)
VERDICT_BANDS = [
    "Fits with headroom",
    "Tight: any spike tips it over",
    "Retries alone can exhaust the quota",
]

# --- tab 4 ----------------------------------------------------------------
STOP_HEADERS = [
    ("Step #", 8, None),
    ("Step", 26, None),
    ("Side effect", 14, None),
    ("State left if the agent stops right after this step", 34, "e.g. \"Room held, no invites sent\""),
    ("What the user sees", 28, None),
    ("Clean-up action", 32, "e.g. \"Release room hold after 15 min\""),
    ("Automatic or manual?", 16, None),
    ("Clean-up owner", 20, None),
    ("Can the task resume from here?", 18, None),
    ("Stop cost", 12, None),
]

# --- tab 5 ----------------------------------------------------------------
# (text, critical)
CHECKS = [
    ("Every limit that can refuse the agent is listed, with its scope and owner.", False),
    ("Retries back off with jitter and honour Retry-After.", False),
    ("Retries are capped per call and per task.", True),
    ("Retries resume from a checkpoint instead of restarting the task.", False),
    ("The token budget belongs to the task, across all its attempts, not just to each call.", True),
    ("A shared quota is partitioned or prioritised, so one busy workflow can't starve the others.", False),
    ("New work stops (circuit breaker) when the refusal rate crosses a set threshold.", False),
    ("Every step with a side effect has a defined stop state, a clean-up action and an owner.", True),
    ("Worst-case peak demand, with retries, fits within the quota.", True),
    ("Budget exhaustion raises an alert that a named person owns.", False),
]
POLICY_ROWS = [
    ("Per-task token budget", "Across every attempt, not per call."),
    ("Max retries", "Per call and per task."),
    ("Backoff", "Base delay, max delay, jitter Yes/No."),
    ("Circuit-breaker threshold", "The refusal rate at which new work stops."),
    ("Shed first under pressure", "Which work is refused first."),
    ("Degrade option", "Smaller model, shorter context, or queue for later."),
]
DECISION_LABELS = {
    "hold": "Don't scale this workflow yet.",
    "fix": "Fix the checks answered No or Partial, then score it again.",
    "ready": "The limit policy holds at peak. Scale it.",
    "unscored": "Answer all ten checks to get a decision.",
}

# --- tab 6: the worked example -------------------------------------------
EXAMPLE_BANNER = "Illustrative example. Not a real system or real figures."
EXAMPLE_INTRO = (
    "A scheduling agent. Six steps, two of them with side effects, run at peak against a "
    "token-per-minute quota shared with every other workflow on the same key."
)
EXAMPLE_STEPS = [
    # name, model, ext api, side effect, in, out, idempotent, checkpoint
    ("Parse request",   "Yes", "No",  "None",         1500, 300, "Yes", "No"),
    ("Read calendars",  "Yes", "Yes", "None",         6000, 800, "Yes", "No"),
    ("Propose slots",   "Yes", "No",  "None",         7500, 600, "Yes", "No"),
    ("Hold room",       "Yes", "Yes", "Reversible",   8200, 200, "No",  "No"),
    ("Send invites",    "Yes", "Yes", "Irreversible", 8500, 400, "No",  "No"),
    ("Confirm to user", "Yes", "No",  "None",         9000, 300, "Yes", "No"),
]
EXAMPLE_LIMITS = [
    ("Model provider tokens per minute", "Shared across workflows", 10000000, "tokens", "per minute",
     "all agents on this API key", "HTTP 429 + Retry-After", "Retry with backoff", "Platform team"),
    ("Model provider requests per minute", "Shared across workflows", 4000, "requests", "per minute",
     "all agents on this API key", "HTTP 429 + Retry-After", "Retry with backoff", "Platform team"),
    ("Calendar API writes", "Per tenant", 600, "requests", "per minute",
     "scheduling agent only", "HTTP 429, no Retry-After", "Queue", "Workplace IT"),
    ("Per-task token budget", "Per task", 120000, "tokens", "per request",
     "not shared", "budget guard refuses the call", "Fail task", "Scheduling team"),
]
EXAMPLE_RETRY = {
    "refused_step": 4,
    "scope": "Restart task",
    "max_retries": 3,
    "billed": "No",
    "peak_tasks": 200,
}
EXAMPLE_STOP = {
    4: ("Room held, no invites sent", "Still booking…", "Release room hold after 15 min",
        "Automatic", "Platform team", "Yes", "Low"),
    5: ("Invites sent to some attendees", "Attendees see a partial invite",
        "Send a cancellation to recipients and notify the organiser",
        "Automatic", "Platform team", "No", "High"),
}
# Answers chosen so the score alone would read "Ready to scale" (16 of 20) and
# one critical No still forces Hold. That is the lesson of the tab.
EXAMPLE_ANSWERS = ["Yes", "Yes", "Yes", "No", "Yes", "Yes", "Yes", "Yes", "No", "Yes"]
EXAMPLE_POLICY = [
    "120,000 tokens across all attempts",
    "2 per call, 3 per task",
    "Base 1s, max 30s, jitter Yes",
    "Stop new work above a 20% refusal rate over 60s",
    "Bulk re-scheduling, before single user requests",
    "Queue for later; no smaller model, the slot maths needs this one",
]
