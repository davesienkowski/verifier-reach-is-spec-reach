# k-run execution harness — architecture + status

**Date:** 2026-06-04 · **Built against:** goodthrough-v4. Purpose: the repeatable-execution substrate
the program has wanted since the trust-ledger round — run a unit of work **k times from a clean state**
and score the distribution, unblocking N23 (reliability metric), N26 (compute-allocation ablation),
B1, C8-drift, and N15's regression-history arm.

## Components (all built; what's run vs gated noted)

| # | Component | File | Status |
|---|---|---|---|
| 1 | **Phase checkpointer** — maps each phase → git commit range (clean base = parent of first phase commit; head = as-shipped) from the `type(NN-PP):` convention | `checkpoint.mjs` → `phase-checkpoints.json` | **RUN** (9 phases, 355 phase-tagged commits) |
| 2 | **Clean-state restore** — `git worktree add /tmp/krun-<phase> <base>` gives an isolated pre-phase checkout | (one git command, emitted by #1) | **RUN-ready** (deterministic) |
| 3 | **k-run executor driver** — for k iterations: restore clean → re-execute the unit → capture output | dispatched as k independent subagents; outputs in `candidates/`, `candidates-roundto/` | **RUN** at unit scale (k=5 ×2 tasks) |
| 4 | **Oracle + reliability metric** — score each run vs ground truth; decompose capability / consistency / reliability | `oracle.mjs`, `reliability.mjs`, `reliability-roundto.mjs` | **RUN** |

## What "k-run" computes (Beyond pass@1 + a third axis)

- **capability (pass@1)** — mean per-run pass-rate vs a *true* oracle (is a single run correct?).
- **consistency** — run-to-run agreement, *oracle-free* (do the runs produce the same output?).
- **reliability (pass^k)** — fraction of runs that *fully* pass (correct *and* repeatable).
- The harness reports all three because the validation showed they **diverge** — and the divergence
  is the finding (see RESULTS.md): on a non-inferable edge, consistency can be 100% while capability
  is not (correlated wrongness).

## Validated end-to-end at unit scale

Two k=5 runs (haiku) scored against goodthrough-v4's real test logic:
- `formatCents` (inferable spec) → 100/100/100 (no divergence; the metric's null case).
- `roundTo` (tie-rule omitted; banker's oracle) → consistency 100%, capability 75%, reliability 0%
  (**consistent-but-wrong** on the ties — the metric's discriminating case).
This proves the loop (executor ×k → oracle → metric) works and discriminates.

## The compute gate for FULL-PHASE goodthrough-v4 runs

The phase-checkpoint substrate (#1, #2) is real and the metric (#4) is proven. The remaining gate is
purely **compute/toolchain** for component #3 at *phase* scale:
- **Per phase re-run** = restore the worktree at `base`, run `gsd-executor` over the phase's PLAN(s)
  (many subagents), `pnpm install`, then run the phase's vitest suite as the oracle.
- **Cost** = 9 phases × k runs × (full phase execution + install + suite). vitest is not even installed
  in the current checkout; a full N23 sweep is dozens of complete phase executions.
- **What's needed:** a compute budget for the executor subagents + a provisioned toolchain
  (`pnpm install` per worktree). Nothing architectural is missing — the harness drives it; the
  in-session environment just can't fund the full sweep.

## How to run a full phase (when compute is available)

```bash
node checkpoint.mjs                                  # → phase-checkpoints.json
B=$(jq -r '."08".base' phase-checkpoints.json)
for i in $(seq 1 $K); do
  git -C ~/repos/goodthrough-v4 worktree add /tmp/krun-08-$i $B
  ( cd /tmp/krun-08-$i && pnpm install )
  # re-execute phase 08 PLANs in the worktree via gsd-executor (k-th run)
  ( cd /tmp/krun-08-$i && pnpm --filter ... test ) > runs/08-$i.json   # oracle = phase suite
done
node reliability.mjs runs/                            # capability / consistency / reliability by phase
```

The unit-scale validation is the same pipeline with the oracle = a single function's test instead of
the phase suite.
