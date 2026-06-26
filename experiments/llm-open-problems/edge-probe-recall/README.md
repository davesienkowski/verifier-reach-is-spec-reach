# edge-probe-recall

Does sharpening the edge-probe `precision` probe text to NAME tie-breaking close the recall gap found in
`edge-probe-residual` (the precision/tie class the probe never named → verifier 0% catch)? David's
experiment (AI-assisted).

## Method
One-line change to `src/edge-probe.cts` precision probe (old=generic, new=names "half-up vs half-to-even").
A/B: 2 tie-class tasks × opus/sonnet/haiku × 2 reps × {old,new} = 24 verdicts, surfaced-unresolved.
The src change was REVERTED after the run (probe text is fixture-locked; ship via PR #584). `specs/` here
bake in both probe variants so the experiment reproduces without the src change.

## Files
- `specs/{round,quant}__{old,new}.md` — surfaced-unresolved specs differing only in the precision probe line.
- `code/{round,quantize}.mjs` — defective half-up impls under review.
- `verdicts.tsv` — 24 verdicts. `RESULTS.md` — findings.

## Headline
Recall MISS→HIT (deterministic). Downstream honest abstention 83%→100%; the entire old-probe failure was
haiku (50% false-pass → 0%). Improving probe RECALL rescues the weak-tier abstention that edge-probe-residual
found failing. Recommendation: adopt the sharpened probe text on #584 (src + 2 fixtures + reference doc).
