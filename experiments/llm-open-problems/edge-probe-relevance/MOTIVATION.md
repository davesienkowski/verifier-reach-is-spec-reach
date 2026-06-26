# Motivation: what users notice when the edge-probe ships, and why precision is the hinge

**Captured:** 2026-06-03 (from a `/gsd-explore` session) · context for [`DESIGN.md`](./DESIGN.md)

This is the *why* behind the relevance-precision experiment, and the reusable before/after framing for
the spec-completeness edge-probe (#550 / PR #584).

## The user-visible before/after

The edge-probe doesn't make the verifier smarter — it makes the **spec wider**. "Verifier reach = spec
reach": the verifier can only catch a defect if a `must_haves.truth` exists for it, and a truth only
exists for a requirement the author wrote down. So the change a user feels isn't a new check at
verify-time; it's a new **elicitation step at spec-time** that converts non-inferable gaps into written
acceptance criteria.

**Worked example — a vibe-coder feature: "split a restaurant bill evenly among friends."**

- **Before #584:** The dev writes *"divide the total by the number of people, show each their share."*
  Clean — the ambiguity gate passes. Builds. Verifier returns a confident PASS (every truth it has is
  satisfied). Then a real user splits **$100 three ways**: `100/3 = $33.33`, three people pay → the app
  collected **$99.99**. A penny vanished. The spec never said where the leftover cent goes, so there was
  no truth for it, so the verifier *couldn't* check it — and was ~0.93 confident anyway. Ships with **no
  signal anywhere**; the dev finds out from a user complaint, with every gate green.
- **After #584:** After the ambiguity gate, Step 5.5 raises the relevant edge as a concrete question —
  *"when the total doesn't divide evenly ($100 / 3), where does the leftover cent go?"* — plus
  empty/degenerate (*0 or 1 people?* — the divide-by-zero crash). A `covered` answer writes an
  acceptance criterion → planner lifts it into a `must_haves.truth` → the verifier now actually checks
  that shares sum to the total. The gap closes *before a line is built*.

## The two users (autonomous nuance)

- **Semi-autonomous:** present at spec time, answers the edge questions, then walks away. Front-loaded —
  the friction is paid once, then the run is hands-off. (User's own read: this is fine.)
- **Fully `--auto`:** never sees the questions. The probe auto-`covered`s where it can write a defensible
  criterion and auto-`backstop`s otherwise, and **never auto-dismisses** — a wrong dismissal *is* the
  silent confident-pass failure the feature exists to kill. So the hands-off user inherits a safe default
  (a test, never a silent gap), not a question.

## The hinge: relief only holds if the raised edge is relevant

"Oh good, caught that" depends on the probe **not crying wolf**. If the same closed taxonomy fires
*concurrency* on a single-user calculator or *precision/overflow* on a spec with no float path, relief
flips to friction, and authors learn to rubber-stamp `dismissed` — the exact failure that killed the
hard-gate alternative in #550. This is the same precision risk solved for the prohibition probe in N18
(false positives 10.2 → 2.2). Hence the experiment: measure the relevance filter's false-positive rate
on an app-flavored corpus, plus persona-weighted recall (the probe's value = catching what the author
would have *missed*, not what a senior dev catches anyway).

## Not just beginner hand-holding (cross-tier blind spot)

It's tempting to read the probe as training wheels for vibe-coders. The mined `noninferable-corpus`
transcripts say otherwise: a strong-model careful reviewer (opus, the senior-dev proxy) missed the
omitted edge **0/6**, rationalizing it as "defensible under a standard definition" (touching intervals)
or simply "never considered Unicode" (grapheme). The blind spot isn't a skill gap — it's structural:
when the spec is silent, *both* readings look legitimate, so even an expert reviewer has no basis to
flag it. That makes adjacency/encoding/precision-tie the probe's highest-value territory across *all*
experience levels, and it's the strongest version of the relief argument: the probe surfaces edges a
senior dev would also have shipped. (See `DESIGN.md` §Persona baseline, Anchor A.)

## Why this is being captured now, not as a merge gate

**#584 is at the doorstep of merge** (MERGEABLE, CI green 27/0, suite 1766/1766, ADR-550 [Accepted],
all of trek-e's RR#1–#4 blockers resolved; only a `coverage.resolved` count-semantics confirmation +
the maintainer's confirming re-review outstanding). None of those blockers touched relevance precision.

So the probe **ships on an unvalidated-precision relevance filter** — and #550's own AC measure recall on
3 algorithmic tasks and precision nowhere. That's not a reason to block; it's the open empirical risk the
[`DESIGN.md`](./DESIGN.md) experiment closes *after* merge, and the reason the [`SEED.md`](./SEED.md)
trigger is re-pointed from "before merge" (now moot) to "before extending the taxonomy."

The before/after framing above is also reusable as docs / FEATURES / writeup narrative — the bill-split
example is the vibe-coder-legible version of the algorithmic noninferable-corpus tasks.
