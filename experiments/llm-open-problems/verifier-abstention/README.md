# verifier-abstention (N17)

Does giving the verifier an **abstention** path (`insufficient_spec`) make it honest about its
non-inferable blind spot — and must the trigger be the model's own judgment (endogenous) or an
external tag (exogenous)?

Sourced from r/ClaudeAI thread `1tv1kng` (see `../REDDIT-FEEDBACK-SYNTHESIS.md`). Design registered as
**N17** in `../NOVEL-EXPERIMENTS.md`.

## Design

- **Tasks:** `../noninferable-corpus/tasks/02-merge-intervals` and `03-truncate-graphemes` (the 2 clean
  non-inferable defects) + `tasks/02-merge-intervals-INFERABLE.mjs` (an inferable control, defective on
  the STATED "sorted by start" rule — used to measure **over-abstention**).
- **Conditions:** `baseline` (passed/gaps_found only) · `endogenous` (adds self-judged `insufficient_spec`)
  · `exogenous` (the requirement is pre-flagged non-inferable; abstain unless the spec fully determines
  behavior — applied as a *false* flag to the inferable control to measure the cost).
- **Verifiers:** opus + sonnet + haiku, inspection-only, verdict + calibrated confidence.
- **Specs given to verifiers** strip the corpus meta-note that reveals the omitted edge (preserves
  non-inferability).

## Files
- `verdicts.tsv` — 27 verdicts (3 models × 3 conditions × 3 tasks).
- `analyze.mjs` — false-pass / abstain / catch / over-abstain rates + per-model abstention + ECE.
- `tasks/02-merge-intervals-INFERABLE.mjs` — the inferable-defect control.
- `RESULTS.md` — findings.

## Run
```bash
node analyze.mjs   # recomputes the tables in RESULTS.md from verdicts.tsv
```

## Headline
False-pass on the blind spot: **baseline 100% → endogenous 67% → exogenous 17%.** Self-abstention only
fires on ambiguity the model *notices*; exogenous tagging routes correctly even when it names the wrong
edge. Costs: a false flag makes the strongest model over-abstain on a real bug, and the weakest model
ignores the flag. Ship exogenous, pair it with a precise tagger (edge-probe `backstop` / N11).
