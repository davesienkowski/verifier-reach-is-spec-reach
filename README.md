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
| Powered replication (n=121, 3 tiers) | narrow blind-spot false-pass **94%** | `experiments/llm-open-problems/edge-probe-residual/` |
| The fix works | resolving the surfaced edge → **94% catch** | same |
| Independent corroboration | maintainer-built CI eval, blind to ours | open-gsd/gsd-core#1637 |

The blind spot is **model-invariant** (opus ≡ sonnet ≡ haiku; a frontier model does no better than
chance), so the lever is *specification reach*, not verifier reasoning.

## Reproduce

Each experiment ships its recorded verdict table and a deterministic scorer — **no model calls needed
to reproduce the numbers**:

```bash
cd experiments/llm-open-problems/edge-probe-residual && node analyze.mjs   # the n=121 result
cd experiments/llm-open-problems/noninferable-corpus && node validate.mjs  # proves tasks are genuinely non-inferable
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
a recall residual (~25% of categories) leaves a held-out backstop necessary. Sample sizes are
direction-finding-to-modest; see the paper's Limitations.

## Attribution

The **research thesis, experiment designs, and measurements are David Sienkowski's own work.** The
pipeline features (edge-probe, prohibition-probe, honest verifier) ship in the open-source
[GSD-Core](https://github.com/open-gsd/gsd-core) project as community contributions, reviewed and
merged by its maintainers.

## License

- **Code, harnesses, and experiment data:** MIT — see [`LICENSE`](LICENSE).
- **Paper text and figures (`paper/`):** CC-BY-4.0 — see [`LICENSE-PAPER`](LICENSE-PAPER).
