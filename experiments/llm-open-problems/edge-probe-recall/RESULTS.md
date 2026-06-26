# Edge-probe recall — does naming tie-breaking in the precision probe close the residual?

**Date:** 2026-06-05 · branch `feat/non-inferable-pipeline`
**Provenance:** David's experiment (AI-assisted). Follow-up to `edge-probe-residual/` (which found the
verifier's residual blind spot concentrates exactly on the edge-probe RECALL GAP — the precision/tie
class the probe never names). **Question:** if we sharpen the `precision` probe *text* to name
tie-breaking, does recall improve and does the downstream verifier stop false-passing?

## The change (one line, design-consistent — no new category)
`src/edge-probe.cts` TAXONOMY, `precision` probe:
- **old:** "Where can precision loss or overflow occur, and what is the contract?"
- **new:** "Where can precision loss, overflow, or rounding/tie-breaking occur — and what is the exact
  contract (e.g. half-up vs half-to-even, ceil/floor/truncate)?"

Stays within the 8-category core (the reference forbids category bloat; sharper probe text is allowed).

## Result 1 — deterministic recall: MISS → HIT
Re-running the compiled `edge-probe.cjs` on the rounding task: the surfaced precision probe now explicitly
names "rounding/tie-breaking … half-up vs half-to-even." The recall MISS from `edge-probe-residual`
becomes a HIT. No category regression (precision still fires only on numeric-range; other tasks unchanged).

## Result 2 — downstream A/B: naming the tie lifts honest abstention to 100% (rescues the weak tier)
2 tie-class tasks (round-to-int, round-to-nearest-10) × opus/sonnet/haiku × 2 reps × {old probe, new
probe} = 24 verdicts, surfaced-unresolved (abstain available; correct honest action = abstain, since the
spec still doesn't *decide* the tie). Code under review = defective half-up `Math.round`.

| arm | n | false-pass | abstain | catch | honest (abstain+catch) |
|---|---|---|---|---|---|
| **old probe** (generic precision) | 12 | 17% | 67% | 17% | 83% |
| **new probe** (names tie-breaking) | 12 | **0%** | **100%** | 0% | **100%** |

By tier (false-pass rate):

| arm | opus | sonnet | haiku |
|---|---|---|---|
| old | 0% | 0% | **50%** |
| new | 0% | 0% | **0%** |

**The entire old-probe failure was haiku** (50% false-pass, 0% abstain). With the tie named, **haiku goes
0% → 100% honest abstention.** opus/sonnet already abstained on the old probe (they connect the generic
"boundary/precision" edge to the tie unaided), so the recall fix's marginal value is concentrated exactly
on the weak tier — the same tier the `edge-probe-residual` experiment found the abstention mechanism
failed on (haiku flag-deaf, 0% honest).

## What this means
- **Recall is a real lever, and it acts on the weak tier.** The `edge-probe-residual` finding "exogenous
  abstention is tier-gated (haiku 0%)" is partly a RECALL problem: a more explicit probe makes even haiku
  abstain honestly. Improving probe text > relying on the model to infer the edge.
- **The honest action stays abstain, not catch** (0% catch is correct here — the spec doesn't decide the
  tie; catch only comes once the edge is *resolved*, per `edge-probe-residual` surfaced-resolved → ~100%).
- **The probe text is fixture-locked.** The old string is asserted in
  `references/edge-probe-fixtures/{01-round-half-even,04-money-rounding}/expected-coverage.json` and
  `references/edge-probe.md`. Improving it is a coordinated change (src + 2 fixtures + reference doc) and
  belongs on PR #584's line of work, not a silent edit. **The src change was reverted after the experiment;
  this is a validated RECOMMENDATION to fold into #584, not yet shipped.**

## Recommendation
Adopt the sharpened `precision` probe text in the edge-probe (on #584), updating the two fixtures + the
reference worked examples in the same commit. Expected payoff: closes the precision/tie recall gap and
lifts weak-tier honest abstention from ~50% false-pass to ~0%. Consider the same sharpening pass for any
other probe whose text is generic relative to its category's real failure modes.

## Caveats
- n=24, 2 tie-class tasks, 2 reps. Directional but clean (monotone, the effect isolates to the one changed
  line and to the weak tier). Inspection-only verifiers. surfaced-unresolved only (the path where recall
  matters; resolved already ~100% catch regardless).
