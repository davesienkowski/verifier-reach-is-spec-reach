# Exp C1 — Weak-Verifier Oversight: GSD artifacts vs raw diff

**Date:** 2026-05-31
**Branch:** `feat/trust-ledger` (local experiment)
**Problem (LANDSCAPE C1 / GSD-ISSUES #9):** Can a *weak* verifier reading GSD artifacts catch a
strong executor's defects better than reviewing a raw diff? Tests whether the artifact trail
(`must_haves` + structured plan/tests) is an oversight substrate.

## Method

Same weak model (**haiku**), same two buggy implementations, two conditions:

- **Artifacts arm:** goal-backward verify with `planning/PLAN.md` must_haves + code + visible tests
  (reused from the C8 run — `../model-regression/verdicts.json`, haiku column).
- **Raw-diff arm:** the buggy code presented inline as a PR diff with a one-line title, **no
  must_haves, no spec, no test structure** — review for correctness from code + general knowledge.
  (2 reps per bug.)

Bugs: `mergeConfig` shallow merge (correctness is **spec-defined** — deep-merge/null-skip/proto-guard
are project requirements) and `compareVersions` string compare (the bug is **general knowledge** —
lexical-vs-numeric version ordering).

## Results

| bug | correctness type | artifacts arm (haiku) | raw-diff arm (haiku, 2 reps) |
|---|---|---|---|
| `compareVersions` string-compare | general knowledge | bug caught | **2/2 caught** |
| `mergeConfig` shallow | spec-defined | bug caught | **1 missed, 1 caught only by leaving the diff to grep the repo** |

## Findings

1. **Artifacts help most exactly where correctness is project-specific / spec-defined.** Without the
   must_haves, one raw-diff reviewer declared the shallow merge `looks_good` ("standard practice for
   config merge") — a **miss**. With the must_haves, the same weak model caught it. The spec tells the
   reviewer what "correct" *means* when general knowledge can't.
2. **For general-knowledge bugs, the artifact trail adds little.** Both arms caught the string-compare
   version bug; a competent reviewer flags it from code alone.
3. **The confound is itself a result.** The one raw-diff rep that *did* catch `mergeConfig` only did so
   by abandoning the diff and grepping the actual gsd-core codebase (13 tool calls) to reconstruct that
   configs are nested. The artifact (`must_haves`) hands that intent over directly — so GSD artifacts
   make weak-verifier oversight not just more *accurate* but **cheaper and more reliable**: no
   intent-archaeology required.

## Caveats

- **n = 2 reps** per raw-diff cell; qualitative signal, not an effect size.
- Two bugs, one weak model (haiku). "Weak" = capability tier, not a constrained/rushed human reviewer.
- The raw-diff reviewer was not sandboxed from the repo (hence the grep confound); a cleaner run would
  constrain it to the diff. The miss (rep 2, pure review) is the clean data point.

## Conclusion

Supports C1's premise: **the GSD artifact trail is a real oversight aid for a weak verifier, and the
lift is concentrated where correctness is spec-defined rather than general knowledge.** This dovetails
with the trust-ledger finding that goal-backward-against-must_haves is the load-bearing mechanism —
here it's what lets a *weak* overseer match a strong one on project-specific correctness. The
strongest follow-up: constrain the raw-diff arm to the diff (kill the grep confound) and add
spec-defined bugs across more domains to estimate the lift.
