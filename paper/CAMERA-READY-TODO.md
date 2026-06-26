# Camera-ready TODO / seeds (for a future session)

Status as of 2026-06-26: paper drafted, all numbers traced to committed reproducible primaries,
all 8 citations verified against arXiv (titles + authors corrected), adversarial pass clean.
The items below are deliberately deferred to a new session.

## SEED 1 — Scale up the reps (the main one) 🔬

**Goal:** turn the headline results from direction-finding into a properly-powered, multi-seed study.

- **`edge-probe-residual` (n=121):** currently 3 reps over 4 non-inferable tasks + 1 control × 3 tiers.
  - Add reps (target ≥10/cell) and **report confidence intervals** on every rate
    (narrow 94% FP, surfaced-resolved 94% catch, surfaced-unresolved 33/47/19, tier table).
  - Widen the task set beyond 4 NI categories so the **~25% recall-gap** estimate rests on more than
    1/4 categories (it is currently directional).
  - Harness is in-repo and deterministic: `experiments/llm-open-problems/edge-probe-residual/`
    (`build-specs.mjs` → record verdicts → `analyze.mjs` recomputes). Re-run needs model access
    (subagents); the scorer itself is key-free.
- **`noninferable-corpus` (n=12) and `verifier-abstention` (n=27):** single-rep direction-finding —
  add reps + CIs, or fold their tasks into the residual harness so there is one powered instrument.
- **Multi-seed / multi-model-version:** run across seeds and at least one newer model generation to
  test the model-invariance claim under power (currently opus/sonnet/haiku, mostly 1 run/seed).
- When done: drop the "direction-finding / not powered" hedges in §7 that are no longer warranted,
  and add the CIs to Tables T1–T3 and the n=121 prose in §2.

**Why deferred:** powered reps need many fresh model calls (cost/time); best run as a focused session.

## SEED 2 — Independent corroboration is external-only
The #1637 maintainer eval (Table T5) is not locally reproducible from this repo (it lives in
`open-gsd/gsd-core` `tests/verdict-eval/`). For artifact-eval, either vendor a copy of that harness
(license permitting) or link it explicitly. The abstention-arm slice (spec-silent +21pp) is cited in
prose but has no row in T5 — consider adding it as a table once vendored.

## Minor / polish (non-blocking)
- 3 cosmetic Overfull \hbox warnings (T5 ~34pt, prohibition paragraph ~38pt, T3 ~30pt) — tighten at
  camera-ready.
- Confirm ClarifyGPT venue (`@inproceedings` FSE 2024) — arXiv abstract verified, venue not
  re-confirmed this pass.
- Final pass: compile on arXiv's TeX stack (we build clean with tectonic 0.16.9).
