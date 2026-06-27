# Verifier Reach Is Spec Reach

**An LLM code-verifier can only catch a defect the specification named.** When a spec omits a domain
edge, the verifier doesn't flag the omission — it fills the gap with a plausible guess, marks the code
passing at high confidence, and the bug ships. The fix is not a smarter judge; it is a wider spec.

This repository is the artifact for the paper *"Verifier Reach Is Spec Reach: Moving Defect-Naming
Forward in Agentic Coding Pipelines"* (David Sienkowski) — the paper itself, the reproducible
experiments behind every headline number, and the design docs for the shipped pipeline.

📄 **Paper:** [`paper/main.pdf`](paper/main.pdf) (source: [`paper/main.tex`](paper/main.tex))

## The headline result (reproducible)

On a purpose-built corpus of *non-inferable* defects (correct behavior not derivable from the spec +
general knowledge):

| | result | source |
|---|---|---|
| Held-out oracle vs. LLM verifier | **100%** (3/3) caught vs. **0/12** | `experiments/llm-open-problems/noninferable-corpus/` |
| Calibration | ECE **0.81** non-inferable vs. **0.03** inferable | same |
| Powered replication (n=210, 3 tiers, 5 reps/cell, Wilson 95% CIs) | narrow blind-spot false-pass **100% [94–100]** | `experiments/llm-open-problems/edge-probe-residual/` |
| The fix works | resolving the surfaced edge → **98% [91–100] catch** | same |
| Recall gap (n=300 extension, 7 tasks) | an edge-probe **miss is necessary but not sufficient** for a blind spot | same |
| Independent corroboration | maintainer-built CI eval, blind to ours | open-gsd/gsd-core#1637 |

The blind spot is **model-invariant** (opus ≡ sonnet ≡ haiku; a frontier model does no better than
chance), so the lever is *specification reach*, not verifier reasoning. The harness is now
**self-validating**: `validate.mjs` proves each task is genuinely non-inferable locally.

## Why this matters

The blind spot lands where it hurts most: on requirements the spec left implicit, **no test catches
the bug** — the test suite derives from the same incomplete spec — so it slips past CI and surfaces in
production, or never visibly at all. It is the most expensive bug class to find late, and the one an
LLM verifier is most confidently wrong about. The cheapest place to close the gap is at spec time, by
naming the edge before any code exists.

## Reproduce

Each experiment ships its recorded verdict table and a deterministic scorer — **no model calls needed
to reproduce the numbers**:

```bash
cd experiments/llm-open-problems/edge-probe-residual
node analyze.mjs verdicts.v4-faithful-read.tsv   # powered n=210 headline (Wilson 95% CIs)
node analyze.mjs verdicts.v5-task-b.tsv          # n=300 recall-gap extension (7 tasks)
node validate.mjs                                # proves each task is genuinely non-inferable (local self-validation)
```

Build the paper (with [tectonic](https://tectonic-typesetting.github.io/), or any TeX Live):

```bash
cd paper && tectonic -X compile main.tex
```

## What's here

- **`paper/`** — `main.tex`, `refs.bib`, `main.pdf`. Plus the honest audit trail:
  [`CORRECTIONS.md`](paper/CORRECTIONS.md) (every claim that was tightened, dropped, or restored, and
  why), [`REVIEW.md`](paper/REVIEW.md) (the adversarial review pass), and
  [`CAMERA-READY-TODO.md`](paper/CAMERA-READY-TODO.md).
- **`experiments/llm-open-problems/`** — the reproducible experiments the paper cites (verdict tables
  + scorers + corpora).
- **`docs/`** — plain-language explainers of the shipped edge-probe / prohibition-probe / honest-verifier
  family.

## Honest scope

This is a **novel synthesis plus original measurement, not a net-new concept.** Clarify-before-coding,
abstention-under-underspecification, and test-oracle incompleteness are prior art (see the paper's
Related Work). What's new is the *measurement* that verifier overconfidence concentrates on
non-inferable requirements, and the *assembly* of a shape-taxonomy spec-time gate + an
exogenously-tagged `insufficient_spec` abstention, shipped fail-closed. It is **not a complete fix**:
on the genuine blind spots — edges the probe fails to *name* **and** that the spec's other obligations
don't imply — the verifier still false-passes at **67–93%** even when the edge is surfaced unresolved,
so a held-out backstop stays necessary. The headline blind-spot and fix are now **powered with
confidence intervals** on a self-validating harness; the calibration and corroboration arms remain
direction-finding. The recall-gap categories were hand-selected for edge-probe blindness (a
conditional/existence claim, not an unbiased miss-rate). See the paper's Limitations.

## Attribution

The **research thesis, experiment designs, and measurements are David Sienkowski's own work.** The
pipeline features (edge-probe, prohibition-probe, honest verifier) ship in the open-source
[GSD-Core](https://github.com/open-gsd/gsd-core) project as community contributions, reviewed and
merged by its maintainers.

## License

- **Code, harnesses, and experiment data:** MIT — see [`LICENSE`](LICENSE).
- **Paper text and figures (`paper/`):** CC-BY-4.0 — see [`LICENSE-PAPER`](LICENSE-PAPER).
