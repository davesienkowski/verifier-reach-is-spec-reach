# DRAFT ISSUE (Enhancement-scoped) — for open-gsd/gsd-core

> **Status: DRAFT — DO NOT FILE YET.** This enhancement targets the edge-probe, which lands via **PR #584
> (#550)**. It must be filed **only after #584 is merged by a maintainer** (it edits files #584 introduces:
> `src/edge-probe.cts`, `references/edge-probe-fixtures/*`, `references/edge-probe.md`). Filing before then
> would conflict with the in-flight PR. Per CONTRIBUTING: issue-first, wait for `approved-enhancement`
> before any code.
>
> **Trigger to file:** #584 merged into `next`.
> **Target template:** Enhancement Proposal (`.github/ISSUE_TEMPLATE/enhancement.yml`). Fields below map
> 1:1 onto the template `id:`s.
>
> **Why Enhancement, not Feature:** it *sharpens the text of one existing taxonomy probe* — no new
> command, workflow, category, or concept. The 8-category core is unchanged.

---

## Title
```
enhance(spec-phase): edge-probe `precision` probe should name tie-breaking / rounding-mode
```

## Pre-submission checklist (preflight)
- [x] Confirmed it **improves existing behavior** — sharpens the `precision` probe's question text in the
  `TAXONOMY` (`src/edge-probe.cts`). No new command/workflow/category; precision still fires only on
  `numeric-range` shapes.
- [x] Searched existing issues — not previously proposed. Sibling to #550/#584 (edge-probe) and #644.
- [x] Read CONTRIBUTING.md — will wait for `approved-enhancement` before any code.
- [x] Concrete benefit is measurable (recall MISS→HIT; weak-tier false-pass 50%→0%), not "nicer."

## What existing feature or behavior does this improve? (what_is_being_improved)
The edge-probe's `precision` edge category (`src/edge-probe.cts` TAXONOMY, `id: 'precision'`). Its probe
question is the prose the spec author/verifier reads when the probe surfaces a precision edge as unresolved.

## Current behavior (current_behavior)
The `precision` probe text is generic:
> "Where can precision loss or overflow occur, and what is the contract?"

For rounding/quantization requirements (shape `numeric-range`), the probe *fires* but its text never names
the most common real failure mode in that class — **tie-breaking / rounding mode** (half-up vs
half-to-even, ceil/floor/truncate). In a controlled experiment this was a **recall MISS**: the probe
surfaced "precision" but the surfaced text didn't cue the omitted edge, so a verifier reading a
defective half-up `Math.round` against the surfaced-unresolved spec did not reliably defer — the *weak
model tier (haiku) false-passed 50%* of tie-class defects.

## Proposed behavior (proposed_behavior)
Sharpen the `precision` probe text to name tie-breaking and rounding mode:
> "Where can precision loss, overflow, or rounding/tie-breaking occur — and what is the exact contract
> (e.g. half-up vs half-to-even, ceil/floor/truncate)?"

One line; stays within the 8-category core (the reference forbids category bloat — this is sharper text,
not a 9th category).

## Reason and benefit (reason_and_benefit)
Validated by a runnable A/B experiment (`experiments/llm-open-problems/edge-probe-recall/`, David's
experiment, n=24 over opus/sonnet/haiku × 2 reps × {old,new probe}, surfaced-unresolved):
- **Deterministic recall: MISS → HIT** — the surfaced probe now names the tie rule on rounding tasks; no
  category regression (precision still numeric-range only).
- **Downstream honest abstention 83% → 100%; false-pass 17% → 0%.**
- **The entire old-probe failure was the weak tier** — haiku false-pass 50% → 0%; opus/sonnet already
  abstained on the old text. So the edge-probe's known tier-gating of honest deferral is *partly a recall
  problem*, and better probe text rescues the weak tier — the cheapest possible fix (one prose line).

Companion finding (`edge-probe-residual/`, n=121): the verifier's residual non-inferable blind spot
concentrates *exactly* on edge-probe recall gaps (0% catch on the category the probe failed to name), so
improving probe recall is the highest-leverage edge-probe lever.

## Scope of changes (scope)
- `src/edge-probe.cts` — one-line `precision` probe text (the change above).
- `references/edge-probe-fixtures/01-round-half-even/expected-coverage.json` — update the `precision`
  item's `probe` string (contract fixture; asserts exact text).
- `references/edge-probe-fixtures/04-money-rounding/expected-coverage.json` — same.
- `references/edge-probe.md` — update the worked-example `precision` probe text (01-round-half-even,
  04-money-rounding examples).
All in one commit so the fixture/contract test stays green.

## Breaking changes (breaking_changes)
None behaviorally — same category, same firing rule, same JSON schema. The probe **string** changes, which
is contract-tested against the two `expected-coverage.json` fixtures; those update in the same commit so
CI stays green. No consumer keys on the probe text (it is human-facing prose).

## Alternatives considered (alternatives)
- **Add a 9th `tie-breaking` category** — rejected; the reference explicitly keeps the core at 8 ("a fixed
  eight the author must clear beats thirty nobody finishes"). Growth is via domain packs, not core bloat.
- **A numeric/rounding domain pack** — heavier; defers value. Reasonable later, but the one-line text fix
  captures most of the measured benefit now.
- **Leave as-is, rely on the model to infer** — rejected; the experiment shows the weak tier does not
  infer it (50% false-pass), and the strong tiers already abstain, so the fix is pure upside on the weak tier.

## Area affected (area)
`spec-phase` / edge-probe (`references/edge-probe.md`, `src/edge-probe.cts`, edge-probe fixtures).

## Additional context (additional_context)
- Depends on #550/PR #584 (edge-probe) being merged first.
- Experiment + data: `experiments/llm-open-problems/edge-probe-recall/RESULTS.md` (+ `verdicts.tsv`,
  `specs/`, `code/`) and the companion `experiments/llm-open-problems/edge-probe-residual/RESULTS.md`.
- Generalization worth a sentence in the issue: consider a one-pass "does each probe's text name its
  category's real failure modes?" review for the other 7 probes (the same recall principle).
