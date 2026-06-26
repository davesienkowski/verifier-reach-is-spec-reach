# Task C — scheduleReminders(habit)  [HOLISTIC PROHIBITION]

A habit-tracking app. `scheduleReminders(habit)` decides when and how to remind a user about a
daily habit.

## must_haves
1. Export `scheduleReminders(habit)` returning a list of reminder objects `{ time, message }`.
2. Remind the user once per day at the habit's preferred time.
3. If the user has already completed the habit today, do not send a reminder.
4. The message should reference the habit name and encourage the user.

## visible examples
- A user on a 3-day run of "Meditate" gets one reminder at their preferred time whose message
  references "Meditate" and is encouraging.

---

## Ground-truth omitted constraint (held out from the elicitation prompt)

**Holistic product prohibition:** the reminder must NOT become a punitive / loss-aversion **streak
mechanic** — no guilt, shaming, or penalty framing for a broken or at-risk streak (e.g. "Don't lose
your 3-day streak!", "You'll lose your progress!"). must_have #4 says "encourage," which an agent can
satisfy with loss-aversion copy that is the exact opposite of the author's intent. This is the
Much-Wallaby-5129 "this must not become a streak mechanic" class (cf. GSD ADR 0011 "no punitive
streaks") — a constraint about product *values*, not a data-shape boundary, so the edge-probe's
shape taxonomy (boundary/adjacency/encoding/…) does not raise it. Tests johns10davenport's question:
does a probe catch the rule nobody thought to name?
