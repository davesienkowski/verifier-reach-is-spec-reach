---
experiment: plan-execute-determinism
name: plan-execute-interface-determinism
stage: plan → execute
validates: "Given a plan whose tasks share an artifact, when independent waves execute it, then they integrate ONLY if the plan pins the interface (path + signature)"
verdict: VALIDATED — unpinned plan integrates 0/9 cross-wave pairs; pinned plan 9/9
related: [false-preflight-tax, net-new-2026-06/05-dependency-fidelity]
tags: [plan-stage, execute-stage, wave-execution, interface-contract, integration, non-verifier]
---

# Plan→Execute interface determinism

Non-verifier, fresh thread. GSD runs plan tasks in **waves / separate executor contexts**. If two tasks
share an artifact (task 1 builds a CSV helper, task 3 calls it) but the plan doesn't pin its **file path +
exported signature**, independent executors each invent a different interface → the import doesn't resolve.

## Result
- **Unpinned plan → 0/9** independent (helper, button) pairs integrate (3 distinct paths × 3 distinct names per side).
- **Pinned plan → 9/9** integrate (an explicit `## Interface contract` makes all six executors converge).

The plan, not the executor, owns the seam: divergence is pure under-specification, invisible in single-context
runs and only biting in the multi-wave regime GSD promotes.

## Files
- `plan-unpinned.md` / `plan-pinned.md` — the two plan variants.
- `outputs.tsv` — the 12 design-only executor interface choices (the evidence).
- `grade.mjs` — computes the cross-wave integration matrix; `grade.test.mjs` — CI eval (0/9 vs 9/9, 3/3 green).
- `RESULTS.md` — full findings, the GSD-core fix (plan-phase interface contract), and the methodology catch.

## How to run
```bash
node grade.mjs            # unpinned 0/9 (0%) · pinned 9/9 (100%)
node --test grade.test.mjs
```

## GSD-core takeaway
Plan-phase should **emit an interface contract (path + signature) for every artifact shared across tasks**,
and the plan-checker should gate on it — a deterministic, non-verifier completeness check that closes the
plan→execute seam (the complement to N28 `files_modified` reconciliation).
