# N1 — Verifier-reach (mutation-testing the goal-backward verifier)

Turns the edge-probe's qualitative law (*"verifier reach = spec reach"*) into a **measured
per-phase coverage score**: inject a category-spanning battery of defects into already-PASSING code,
run the inspection-only verifier on each, and measure the fraction it catches — split by whether the
violated property is *stated* in the spec (inferable) or sits on an *omitted* edge (non-inferable).

## Layout

- `specs/` — the 3 task specs handed to the verifier (must_haves + visible cases; omitted-edge notes stripped).
- `cand/` — 12 blinded candidates: `*-ref` (clean control), `*-inf-*` (violate a stated must_have, visible-passing), `*-noninf-*` (omitted-edge defect). Neutral code, no comments.
- `manifest.tsv` — ground truth per candidate: category, class, the planted must_have, expected verdict.
- `validate.mjs` — corpus self-validation: every mutant passes the *real* visible suite yet is a real defect (differential vs reference + input-mutation check); clean controls match the reference everywhere.
- `verifier-prompt.md` — the exact inspection-only goal-backward prompt + grading rule.
- `verdicts.tsv` — 36 recorded verdicts (12 candidates × opus/sonnet/haiku), with per-row caught-edge grading.
- `analyze.mjs` — reach (raw vs caught-edge), by class/tier, specificity, calibration, cross-tier disagreement.
- `RESULTS.md` — findings.

## Reproduce

```bash
node validate.mjs   # asserts all 12 candidates are valid reach probes (exit 0)
node analyze.mjs    # recomputes every number in RESULTS.md from verdicts.tsv
```

The verdicts themselves come from 36 blind verifier subagents (see `verifier-prompt.md`); the build
log lives in `RESULTS.md`. Headline: **true reach 89% inferable vs 0% on genuinely-arbitrary omitted
edges**; raw `gaps_found` overstates reach (verifier rejects for the wrong reason); skeptical
prompting costs 44% specificity on correct code. See `RESULTS.md` for the full read.
