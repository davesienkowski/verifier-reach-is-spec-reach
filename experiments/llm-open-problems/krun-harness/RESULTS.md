# k-run Harness — RESULTS (build + validation + a finding for N23)

**Date:** 2026-06-04 · **Status:** harness BUILT against goodthrough-v4; k-run loop + metric VALIDATED
at unit scale; full-phase sweep gated on compute (see `HARNESS.md`). **Reproduce:** `node checkpoint.mjs`,
`node reliability.mjs`, `node reliability-roundto.mjs`.

## What was built

The repeatable-execution substrate (checkpoint → clean restore → k-run executor → oracle + reliability
metric). Component-by-component status in `HARNESS.md`. The phase checkpointer ran against
goodthrough-v4 (9 phases mapped from 355 phase-tagged commits → `phase-checkpoints.json`); the k-run
loop + Beyond-pass@1 metric ran on two unit tasks scored against the project's real test logic.

## Validation — the metric discriminates, and surfaces a finding

**Run A — `formatCents` (inferable), k=5 haiku:** capability 100% / consistency 100% / reliability
100%. The null case — a fully-inferable spec yields correct, repeatable runs. (All 5 independently
chose `Math.round`, which matches the oracle on every edge incl. the negative-half case.)

**Run B — `roundTo` with the x.5 tie-rule OMITTED, banker's oracle, k=5 haiku:**

| | value |
|---|---|
| capability (pass@1 vs true oracle) | **75%** |
| consistency (run-to-run agreement, oracle-free) | **100%** |
| reliability (runs fully passing) | **0%** |
| consistent-BUT-WRONG assertions | **2/8** (`2.5→3` not `2`; `0.5→1` not `0`) |

**All 5 runs produced the *identical* implementation** (`Math.round(value*factor)/factor`) — so they
are perfectly *consistent* yet *consistently wrong* on the non-inferable ties.

## The finding (this is the payoff, and it lands on N23)

> **A variance/consistency-only reliability metric scores Run B as 100% reliable — and is wrong.**
> The runs agree because they share the same blind spot, not because they're correct. Reliability
> implies correctness **only when measured against a true oracle**; measured as run-to-run
> consistency, it inherits the non-inferable blind spot.

This is the program's central law (consistency ≠ correctness; the blind spot is *correlated*, N11/N22)
reproduced at the **reliability-measurement** layer — and it directly shapes N23: the Beyond-pass@1
"reliability" axis must be **capability against a held-out/banker's oracle**, not the cheaper
consistency proxy, or it will certify a confidently-wrong system as reliable. It also re-confirms, on
fresh substrate, that the non-inferable edge is closed only upstream (spec reach / edge-probe), never
by re-running more (k runs of the same blind spot stay blind).

## Cross-tier application — the blind spot is model-invariant at the executor layer

Re-ran the `roundTo` k-run (same edge-omitted spec) on **opus** to test whether a stronger model
resolves the non-inferable tie:

| tier | k | capability | consistency | reliability | consistent-but-wrong |
|---|---|---|---|---|---|
| haiku | 5 | 75% | 100% | 0% | 2/8 |
| **opus** | 5 | **75%** | **100%** | **0%** | **2/8** |

**Identical.** All 5 opus runs also chose `Math.round` — with a `Number.EPSILON` guard that closes the
*inferable* float-precision edge (e.g. `1.005`), but **still defaults to half-up on the non-inferable
tie convention** (banker's wants `2.5→2`; opus gives `3`, like haiku). So:

> The stronger model closes an **inferable** edge (float precision) and is **identically blind** on
> the **non-inferable** one (omitted tie rule). The blind spot is **model-invariant at the executor
> layer** — the generate-side analog of C8/N11/N22's verifier-layer result. Re-running bigger doesn't
> close it; spec reach does.

This is the harness earning its keep a second time: it operationalizes "model-version stability tracks
task inferability" (the instrument-validation law) at the *execution* layer, with a measured cross-tier
number.

## Status against the experiments this unblocks

- **N23 (reliability metric):** the metric is built and the key methodological result is in hand
  (oracle-grounded, not consistency-only). The *full per-phase* reliability curve over goodthrough-v4
  needs the compute sweep (gated).
- **N26 (compute allocation):** the harness is the substrate for the allocation A/B; still needs the
  per-phase sweep + context telemetry.
- **N15 (regression history):** the checkpointer (commit-range per phase) is exactly the substrate to
  replay the ledger at each historical commit — now available.
- **B1 / C8-drift:** same checkpoint + restore substrate; gated on compute.

## Caveats

- Unit-scale validation (k=5, two functions), not full-phase. It proves the *loop and metric*, not
  goodthrough-v4 phase reliability numbers.
- Run B's consistency=100% is partly a haiku determinism artifact on a one-line function; larger
  units would show genuine run-to-run *variance* too. The harness reports both axes precisely because
  which one dominates is itself data.
- Full-phase runs need `pnpm install` per worktree + executor compute (vitest isn't installed in the
  current checkout). Architectural path is complete; the sweep is a budget question.

## Bottom line

The k-run harness exists, runs against goodthrough-v4 (real phase checkpoints), and its metric is
validated and discriminating. Building it already paid a finding: **reliability must be oracle-grounded,
not consistency-based** — else it certifies correlated wrongness as reliable. The full multi-phase
sweep is now a compute decision, not a missing instrument.
