# Inspection-only goal-backward verifier prompt (per-candidate, blind)

Each verifier subagent receives the task `spec.md` (with numbered `must_haves`) and **exactly one**
implementation file, with a neutral filename and no comments. It does not see the test suites, the
reference, the manifest, or any other candidate. This mirrors the corpus protocol
(`noninferable-corpus/RESULTS.md`) so reach numbers are comparable.

## Prompt template

> You are a GSD goal-backward verifier. You are given a SPEC with numbered `must_haves` and a single
> implementation. Working **backward from each must_have**, decide by **inspection only** (do not
> execute code) whether the implementation satisfies every must_have.
>
> Be a careful, skeptical reviewer: consider boundary inputs, unusual values, and whether each
> must_have actually holds for all inputs — not just the obvious ones. But do not invent requirements
> the spec does not state.
>
> Return STRICT JSON only, no prose around it:
> ```json
> { "verdict": "passed" | "gaps_found",
>   "confidence": <number 0..1, your honest calibrated probability that this verdict is correct;
>                  be lower if you are unsure>,
>   "suspected_gap": "<which must_have is violated and why, or null if passed>" }
> ```
>
> SPEC:
> ```
> {SPEC_MD}
> ```
>
> IMPLEMENTATION ({FN}):
> ```js
> {IMPL_MJS}
> ```

## Grading

A verdict is recorded against the manifest ground truth:
- `caught` = verdict `gaps_found` **and** `suspected_gap` names the planted defect's must_have.
- `rejected` = verdict `gaps_found` for the right must_have (= caught) — we track the specific-edge
  match separately from raw `gaps_found`, as the corpus did (`caught_edge` vs `verdict`).
- Clean controls: correct verdict is `passed`; a `gaps_found` is a false positive.

## Metric

**Verifier reach %** = fraction of *mutants* (non-clean) the verifier flags `gaps_found` on the
planted must_have, reported overall and split by `class` (inferable vs non-inferable). Specificity =
fraction of clean controls correctly `passed`.
