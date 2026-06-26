# Enhancement DRAFT (v2, reframed) — LLM-assisted shape classification behind a trust/abstention seam

> **STATUS:** #652 PUSH WITHDRAWN 2026-06-04 (comment 4618757055) — recommended closing. Test D showed
> this v2 "LLM→shapes→engine" architecture underdelivers (64% precision / 67% senior recall: the
> 5-shape→8-category table can't reach CSV-encoding / expiry-boundary), and the edge-probe (#550) likely
> already captures most of the value via its interactive Step 5.5 LLM step. The only salvage offered to
> the maintainer: make the zero-applicable guard per-requirement. This draft is kept as the historical
> record of the reframe; NOT being pursued. https://github.com/open-gsd/gsd-core/issues/652
>
> **Issue title (reframed):**
> `Enhancement: make edge-probe's prose→shape classification LLM-assisted, behind a model-aware trust/abstention seam`

---

## Pre-submission checklist
- [x] Improves existing behavior (edge-probe's `SHAPE_CUES` classifier) — no new command/workflow/concept.
- [x] Searched existing issues — not already proposed.
- [x] Read CONTRIBUTING.md; will wait for `approved-enhancement` before any code.
- [x] Can describe a concrete, measured benefit.

## What existing feature or behavior does this improve?
The **edge-probe's prose→shape classifier** (`src/edge-probe.cts`, `SHAPE_CUES`): a word-boundary regex
that maps each requirement's prose to a data/behavior shape, which then filters the closed edge
taxonomy. *(Correction from v1: `references/domain-probes.md` is **not** the target — its matching is
already applied contextually by the model, no regex. The only deterministic keyword classifier is
`SHAPE_CUES`.)*

## Current behavior
`SHAPE_CUES` is brittle on the plain-language prose a solo developer writes — measured on a 7-spec /
11-requirement app corpus by running the shipped engine:

- **Over-fires on incidental words:** "each"/"list"/"results" → `collection` → a phantom **Adjacency**
  edge on dividing money, searching, paginating (5 of 11 phantoms). Precision **58%**.
- **Goes silent on terse prose:** "log the user in… until the session expires", "send a reminder when
  their task is due" match no cue → **0 shapes → 0 edges**. **48% of applicable edges never raised; 3
  requirements raised nothing.** The silently-dropped edges are the high-value ones (CSV escaping,
  upload size/filename, expiry boundary, timezone, idempotency).

## Proposed behavior
Introduce a **trust/abstention classification seam** with three adapters behind one interface:
**keyword heuristic** (today's `SHAPE_CUES`), **authored shapes** (the existing `shapes` override), and
**LLM-assisted**. The seam owns the policy, not just the call:

- **Taxonomy-constrained output** — adapters may only emit shapes from the locked vocabulary (kills
  fabricated-category hallucination structurally; the engine stays authoritative and deterministic on
  the resulting `shapes`).
- **Never-silently-skip invariant** — a zero-shape result is surfaced (the existing zero-applicable
  guard), made **per-requirement**, not just per-spec.
- **Model-aware fallback** — LLM adapter as default *when a sonnet-class-or-better model is available*;
  fall back to the keyword heuristic otherwise (see floor data — haiku does not clear the bar).
- **Human-facing-only invariant** — the assist *suggests edges to a human to resolve* (cheap false
  positives); it never makes an unattended accept/dismiss decision (where calibration debt would bite).
- **Parity test** — the keyword adapter must keep producing today's output (no regression with no model).

The LLM populates `shapes` upstream via the **propose-then-confirm** seam `edge-probe.md` already
defines, so `probe-core.cts`, the taxonomy, `analyzeCoverage`, the fail-closed validators, and all
contract tests are **unchanged**.

## Evidence (reproducible; floor run, not best-case)
Same blind protocol, 3 model tiers × 3 reps, scored vs fixed ground truth
(`experiments/llm-open-problems/edge-probe-relevance/`, RESULTS.md + `floor-results.tsv`):

| metric | deterministic | haiku ×3 | sonnet ×3 | opus ×3 |
|---|---|---|---|---|
| precision | 58% | 80% [75–86] | **83% [83]** | 74% [70–82] |
| under-fire (applicable missed) | 48% | 41% [34–48] | **14% [14]** | 8% [7–10] |
| recall (vibe/mid/senior) | 44/40/50% | 60/60/72% | 88/87/100% | 94/93/100% |

- **Real and stable from sonnet up:** under-fire 48% → 14% (sonnet, zero variance) / 8% (opus); recall
  → ~90–100%. A mid-tier model reproduces it stably — not a best-case artifact.
- **Model floor at haiku (honest caveat):** haiku improves precision but its under-fire (41%, worst rep
  48%) is indistinguishable from the keyword engine's 48% — it does **not** buy the recall that
  justifies the feature, and is high-variance. Hence the model-aware fallback.
- **Calibration concern, priced:** the weak-tier failure is *silent under-fire* (already covered by the
  keyword fallback), **not** runaway over-fire — haiku's precision was fine. The relevance-hallucination
  risk is contained by taxonomy-constrained output + the human-facing-only invariant.

## Scope of changes (sketch — defer to triage)
- The classification seam + the three adapters; LLM adapter behind the model-aware policy.
- First (and currently only) consumer: edge-probe's shape step.
- Per-requirement zero-shape surfacing (tighten the existing spec-level guard).
- Labeled prose→shape regression set; parity test for the keyword adapter.

## Breaking changes
None. Additive: engine output schema and the `shapes` contract unchanged; keyword adapter preserves
current behavior with no model; existing SPECs/tests unaffected.

## Alternatives considered
1. **Harden the keyword regex** — rejected: open-ended vocabulary, can't infer unstated-but-implied
   shapes, widens over-fire as cues grow.
2. **LLM classifier with no policy seam** — rejected: loses the model-aware fallback, the
   human-facing-only guardrail, and the parity guarantee; this is the deep part, not the model call.
3. **Do nothing** — rejected: 58% precision / 48% silent on app prose means the probe most often misses
   exactly what the solo developer didn't think to ask.

## Area affected
Workflow

## Additional context
Reframed per #652 triage. Depends on #550/#584 (it improves that classifier). Floor evidence is live at
`https://github.com/davesienkowski/gsd-core/tree/feat/non-inferable-pipeline/experiments/llm-open-problems/edge-probe-relevance`.
No PR until labeled `approved-enhancement`.
