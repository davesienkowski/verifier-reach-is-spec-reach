# Edge-probe for GSD-Core users — why it's worth turning on

*You already build with GSD-Core: you write a spec, it plans, codes, and runs its verifier. This is
the short **"why should I care"** for the edge-probe family — what it changes in your loop, what it
costs you, and what it buys you. (For the full feature walkthrough see
[edge-probe-user-feature.md](edge-probe-user-feature.md); for the problem explained from scratch see
[edge-probe-plain-english.md](edge-probe-plain-english.md).)*

Last updated: 2026-06-26

---

## The one risk it removes from your projects

When `/gsd-verify-work` returns a green **"verified ✓"**, you trust it. The uncomfortable measured
finding behind this feature family: that green has a **blind spot shaped exactly like your
under-specified requirements.** Wherever your spec quietly didn't pin a behavior — a rounding tie,
whether touching intervals merge, bytes-vs-graphemes, an ordering guarantee — the verifier doesn't
flag the gap. It guesses, passes, and reports high confidence.

Here's **why that's the worst possible place to have a blind spot:** nothing downstream catches it.
There's no failing test, because the test suite was derived from the *same* incomplete spec. The bug
doesn't show up in CI; it shows up in production, or never visibly at all. It is the most expensive
bug class to find late — and it is exactly the one your verifier is silent on.

## What it costs you: a few questions at spec time

When you run `/gsd-spec-phase`, the edge-probe interrogates each requirement's *shape* and asks the
edge-case questions a careful reviewer would — ties, empty/degenerate inputs, encoding, ordering, and
the must-NOTs you never wrote down. You answer each: **specify** it (it becomes a checkable
acceptance criterion), **backstop** it (a held-out test stands in), **dismiss** it (with a reason),
or **defer** it (an explicit planner assumption). That's the whole cost — minutes, at the cheapest
possible moment: before any code exists.

## What it buys you: the cheapest fix, and a verifier that won't lie

Two payoffs, both measured:

1. **Naming the edge at spec time is enormous leverage.** In a powered study (210 checks, three
   model tiers, confidence ranges), when the spec was silent on the tricky detail the verifier waved
   the bug through **~100%** of the time (range 94–100%). Add **one sentence** naming the detail, and
   the same verifier caught it **~98%** of the time (range 91–100%). One sentence at spec time turns
   a near-certain miss into a near-certain catch — and because the detail is now in the spec, the
   *implementer* sees it too, so the bug often never gets written in the first place.

2. **Verify-phase fails honest instead of fake-green.** For a requirement tagged non-inferable that
   it cannot actually confirm, the verifier returns `insufficient_spec → human_needed` instead of a
   confident pass; and mechanically-checkable must-NOTs **hard-gate** (fail closed if the check can't
   even run). You get fewer confident lies and a clear "a human needs to look here" signal where you
   used to get a false ✓.

## Why this beats the obvious alternatives

- **"Just point a smarter model at verification."** Measured no-op on this bug class: the blind spot
  was the same across a small, medium, and large model. The missing information was never in the
  verifier's input, so more reasoning can't recover it.
- **"Tell the verifier to abstain when it's unsure."** Barely moves the real blind spot — on it, the
  model doesn't *feel* unsure (it's blind, not hesitant). The "I can't verify this" has to be
  triggered from *outside* (the edge-probe tag), which is exactly how it's wired.

## Honest limits — deploy it with eyes open

- **Not a complete fix.** If the probe fails to *name* an edge and nothing else in the spec implies
  it, the verifier is still blind to it (it false-passed **67–93%** on the hardest hand-picked
  cases). Keep a held-out backstop test for behavior you know matters but can't fully state.
- **Pin verification to a capable tier.** The abstain-don't-guess behavior was reliable on stronger
  models and flaky on the weakest one (which tended to ignore the flag).
- **It's a measured improvement, not a guarantee.** The headline blind-spot/fix numbers come from
  the powered study with confidence ranges; the calibration and abstention figures are smaller,
  earlier runs. Treat it as a strong default, not a silver bullet.

## Bottom line

The lever is not a smarter checker — it's a **more complete spec, asked for at the moment it's
cheapest to fill in.** Edge-probe makes `/gsd-spec-phase` ask the questions you'd forget, and makes
`/gsd-verify-work` stop pretending it checked what it couldn't. For a few minutes of answering edge
questions, you remove the bug class that is hardest to catch anywhere else in your pipeline.

---

*See also: [edge-probe-README.md](edge-probe-README.md) (one-screen overview),
[edge-probe-family-summary.md](edge-probe-family-summary.md) (changelog + shipped PRs), and the full
write-up with all numbers and citations, [../paper/main.pdf](../paper/main.pdf).*
