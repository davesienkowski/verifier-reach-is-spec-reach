# What the edge-probe family does for you

*A plain-language guide for people who **use** GSD-Core — not maintainers, not researchers.
What it is, what it changes about your day, and (honestly) what it doesn't do.*

**In one line:** *Surfaces the requirements your spec forgot — and refuses to fake-verify them.*

Last updated: 2026-06-26

---

## The problem, in your terms

You hand GSD a spec, it plans, it codes, it runs its verifier, and you get a green
**"verified ✓."** You trust that check. The uncomfortable finding behind this whole feature
family is that **the verifier's green is only as honest as your spec is complete.**

When a spec quietly omits a domain edge — does rounding go half-up or half-to-even? do
touching intervals `[1,2]` and `[2,3]` merge? is a name's length counted in bytes or
grapheme clusters? — the AI verifier doesn't *notice the gap*. It fills it in with a plausible
guess, marks the result PASS, and reports high confidence. The bug ships, and **nothing
flags it**, because the verifier was never checking against the missing requirement — it was
checking against its own assumption.

The measurement that motivated the work: on a corpus of these "spec didn't say"
(*non-inferable*) defects, a **held-out test caught 100%** of them while the **LLM verifier
caught 0 of 12** — at ~0.93 average confidence. A bigger model didn't help: Opus, Sonnet, and
Haiku all failed identically. (More on the numbers, and their honest limits, below.)

---

## What you get

### 1. Edge-probe — at spec time, GSD asks about the edges you'd forget

When you run `/gsd-spec-phase`, GSD now classifies each requirement by its *shape* (numeric
range, collection, text, stateful, I/O) and proactively asks about the edge cases that shape
implies — using a fixed, eight-category checklist (boundaries, adjacency/touching, empty &
degenerate inputs, encoding, ordering/stability, precision/overflow, idempotency,
concurrency).

For each edge it raises, **you decide**:
- **Specify it** → it becomes a checkable acceptance criterion the verifier will enforce.
- **Backstop it** → you know the rule matters but it's hard to state precisely, so a held-out
  test stands in for it.
- **Dismiss it** (with a reason) → not applicable here.
- **Defer it** → left open, and the planner treats it as an explicit assumption, not a fact.

If your prose is too terse to classify, it's surfaced as **"unclassified — review manually"**
rather than silently dropped. The point: the edge gets *named in the contract* before any code
exists, so the implementer and the verifier are both looking for it.

### 2. Prohibition-probe — it also asks what the code must **NOT** do

Specs are lists of things to *do*; the must-NOTs usually live only in your head. An adversarial
spec-time probe elicits them into a structured block with verification tiers — `test` (a
machine can check it) or `judgment` (needs a human call). A must-NOT that can't be mechanically
proven can never silently pass green.

### 3. The honest verifier — at verify time, it abstains instead of guessing

This is the back half of the idea. When the verifier hits a requirement that was marked
*non-inferable* (a `backstop`) and it has no real evidence (no wired held-out test, no observed
behavior), it does **not** emit a confident PASS. It returns a distinct verdict —
**`insufficient_spec`** — and routes the item to you (`human_needed`) with a note that a
held-out test is needed.

Two design choices keep this from becoming noise:
- **It never abstains on things it *can* check.** An inferable/explicit requirement is graded
  normally. Abstention fires *only* on the externally-applied `backstop` tag — never on a
  vague "the model felt unsure." (This matters: self-judged "abstain if unsure" was measured to
  work far worse — see below.)
- **It fails honest, not silent.** The worst outcome — a confident green over a real bug —
  is the one it's built to remove.

---

## What's live today

The whole pipeline is shipped to `next`:

| Capability | Status | You invoke it via |
|---|---|---|
| Edge-probe (+ recall sharpening, unclassified-surfacing) | ✅ **Merged** (#584, #1108, #1117) | `/gsd-spec-phase` |
| Prohibition-probe (must-NOTs, tiered) | ✅ **Merged** (#1149) | `/gsd-spec-phase`, `/gsd-verify-work` |
| Test-tier enforcement (hard-gate, fail-closed) | ✅ **Merged** (#1273) | `/gsd-verify-work` |
| Deterministic check auto-locate | ✅ **Merged** (#1301) | `/gsd-verify-work` |
| **Honest verifier** (truth-axis `insufficient_spec` abstention) | ✅ **Merged** (#1154 / PR #1738) | `/gsd-verify-work` |

So if you run GSD on `next` today, you get the whole loop: the spec-time half surfaces the gaps
(edge-probe + prohibition-probe), and the verify-time half (`insufficient_spec` abstention)
refuses to fake-pass what the spec couldn't determine.

---

## Why it's worth your time

The bug class this targets is the one you *can't* catch later. A normal bug trips something — a test, a
type error, a failing build — that points at it. A non-inferable bug points at nothing: the spec never
pinned the behavior, so every test derived from that spec agrees the wrong answer is fine. It sails
through verification and ships. The cost to prevent it is a few minutes answering edge-case questions
at spec time — and in the powered study, naming the edge in one sentence flipped a near-certain miss
(**~100%**) into a near-certain catch (**~98%**). That's the trade: minutes up front against a bug
you'd otherwise meet in production, or never.

## The honest part (what this is and isn't)

You asked to be kept honest, so here it is straight:

**What's genuinely new.** Not the *concepts* — clarify-before-coding, abstention on
under-specified inputs, and "an oracle can only check what the spec determines" all predate
this work (see *Where this sits* below). What's new is:
1. **The measurement** — that LLM-verifier overconfidence *concentrates specifically on
   non-inferable requirements*, where a held-out oracle catches what the verifier passes. That
   is an original, citable result.
2. **The synthesis** — a fixed edge-case-*shape* taxonomy used as a *pre-planning gate*, plus
   an `insufficient_spec` abstention verdict placed *at the verifier step* and gated on an
   *exogenous spec tag* rather than the model's self-judgment, shipped as a fail-closed pipeline
   in a real coding agent. The pieces existed; this assembly is a fair contribution.

**What it does *not* do.**
- It is **not a complete fix.** An edge-probe *miss* is necessary but not sufficient for a blind
  spot: on the genuine blind spots — an edge the probe doesn't *name* **and** that the spec's other
  requirements don't imply — the verifier still false-passes at **67–93%** even when the edge is
  surfaced unresolved. (The miss categories tested were hand-picked for probe-blindness, so this is
  an existence finding, not a population rate.) A held-out backstop test remains necessary there;
  the pipeline narrows the blind spot, it does not close it.
- It needs a **capable verifier tier.** The abstention behavior was reliable on Sonnet-class
  models and degraded on Haiku (which tended to ignore the flag). Tie it to a weak tier and it
  weakens.
- The headline calibration figures (0/12-vs-100%, ECE) are **direction-finding** — a single n=12
  run on 3 tasks. The blind spot itself is now **powered**: a replication at n=210 (three tiers,
  5 reps/cell, Wilson 95% CIs) reproduces it at **100% [94–100]** confident-false-pass, and the fix
  converts it to a **98% [91–100]** catch — that's the result to lean on. The abstention 100%→17%
  figure is still n=27, single rep.

**Independent corroboration (not our experiments).**
- **AbstentionBench** (arXiv:2506.09038) benchmarks LLM abstention on under-specified inputs
  and concludes it's "an unsolved problem, and one where scaling models is of little use" —
  which independently matches our finding that a bigger model doesn't rescue the blind spot.
- **Omission-constraint decay** (arXiv:2604.20911): must-NOT compliance falls 73%→33% by turn
  16 across 4,416 trials / 12 models / 8 providers — corroborates the *prohibition-fragility*
  problem (not the verifier-reach thesis directly).

---

## Where this sits in the literature (so the claim stays defensible)

| Idea | Closest prior art | The honest framing |
|---|---|---|
| Ask about ambiguity before coding | ClarifyGPT (arXiv:2310.10996) | It detects ambiguity by *sampling-disagreement*; the non-inferable blind spot is exactly where samples *agree on the wrong answer*, so that signal is silent there. Edge-probe is shape-driven and writes a persistent contract. |
| Verifier abstains on under-specified input | AbstentionBench (2506.09038), Conformal Abstention (2405.01563) | The abstention *idea* is prior art. Placing it as an `insufficient_spec` verdict *at the verifier step*, gated by a spec-derived tier, is the new placement. |
| "A verifier can only catch what the spec named" | The classical **test-oracle problem** (oracles are necessarily incomplete) | We don't *introduce* this — we **operationalize and measure** it for LLM verifiers. |

**Phrases that are fair to use:** "a novel synthesis of clarification, abstention, and the
oracle-incompleteness principle in one shipping coding agent"; "we *measure* that verifier
overconfidence concentrates on non-inferable requirements"; "an `insufficient_spec` abstention
verdict at verification time."

**Phrases to avoid:** "brand new / never before done," "the first system to make an AI verifier
abstain," "solves verifier overconfidence." Each is easy to refute from the prior art above.

---

## Attribution

The merged features are **community GSD-Core's**. The research thesis and the measurements
(held-out vs verifier, the ECE split, the N17/N18 results) are **David's original work**. Public
phrasing: *"my findings, contributed into GSD"* — not *"GSD's novel contribution."*

---

*See also: [edge-probe-README.md](edge-probe-README.md) (one-screen overview),
[edge-probe-family-summary.md](edge-probe-family-summary.md) (maintainer/changelog detail),
[../paper/main.pdf](../paper/main.pdf) (the full arXiv paper).*
