# E3 — elicitation prompts (open vs forced-choice)

Both prompts are asked per order-relevant requirement. The responder must be **blind to
the corpus `intended_order`/`inferable` labels** (give it only `statement` + `return_type`).

## A. Open probe (today's edge-probe wording)

> Requirement: "{statement}" (returns {return_type})
> When elements compare equal, is the output order specified and stable? Describe it.

Scored: `resolved=1` iff the answer commits to a concrete, testable order; `resolved=0`
if it hedges ("depends", "could be either", "if needed") without committing.

## B. Forced-choice probe (the intervention)

> Requirement: "{statement}" (returns {return_type})
> The output order is (pick one, add a field/reason where asked):
>   (a) input / stable order
>   (b) sorted by <field> — name the field and direction
>   (c) order is unspecified / irrelevant
>   (d) non-deterministic by design (e.g. shuffle)

Scored: `resolved=1` always (forced choice commits); `matches_truth=1` iff the chosen
class equals the corpus ground-truth class.

## What E3 measures

- **resolved-rate**: does forcing a choice reduce the "unresolved" outcome vs the open
  probe? (the soft-gate trigger rate)
- **match-to-truth**: of the resolved answers, how many match the true intended order —
  split by `inferable` vs `non-inferable`. Forced choice can raise *resolution* without
  raising *correctness* on non-inferable items; that gap is the finding.

## How to run (blind)

1. For each requirement in `../corpus/requirements.json`, send prompt A then prompt B
   with labels stripped.
2. Record one row per (requirement × prompt) in `verdicts.tsv`.
3. `node analyze.mjs` reads the TSV and reports the aggregates.
