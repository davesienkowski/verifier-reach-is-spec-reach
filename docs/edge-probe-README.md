# The edge-probe family

> **Surfaces the requirements your spec forgot — and refuses to fake-verify them.**

*(Alternates, same idea in 5–10 words:*
*"Stops your AI from rubber-stamping what the spec never said."*
*"Names the gaps your spec missed; won't guess past them."*
*"Your coding agent admits what the spec didn't say.")*

---

A connected set of GSD-Core contributions from one research thesis:
**an automated verifier can only catch what the spec named.** When a spec omits a domain edge,
the LLM verifier doesn't notice — it guesses, marks PASS at high confidence, and the bug ships
unflagged. This family moves defect-naming **forward** (to spec time) and makes verification
**fail honestly** (abstain instead of false-pass).

## The 30-second version

- **Spec time** — `/gsd-spec-phase` interrogates each requirement's *shape* for the edge cases
  you'd miss (rounding ties, touching intervals, encoding, empty inputs…) and the must-NOTs you
  never wrote down. Each becomes part of the contract.
- **Verify time** — the verifier returns **`insufficient_spec`** and asks for a held-out test
  on requirements the spec can't determine, instead of stamping a confident green over them.

## What ships where

| # / PR | What | Status |
|---|---|---|
| #550 / #584 | Edge-probe (spec-completeness, shape taxonomy) | ✅ Merged |
| #1102 / #1108 · #1110 / #1117 | Recall sharpening · unclassified-surfacing | ✅ Merged |
| #644 / #1149 | Prohibition-probe (must-NOTs, tiered) | ✅ Merged |
| #1259 / #1273 | Test-tier enforcement (fail-closed hard-gate) | ✅ Merged |
| #1278 / #1301 | Deterministic check auto-locate | ✅ Merged |
| **#1154 / PR #1738** | **Honest verifier (truth-axis abstention)** | ✅ Merged |

## The evidence, honestly scoped

- **Headline (direction-finding, n=12):** held-out oracle **100%** vs LLM verifier **0/12** on
  non-inferable defects; calibration **ECE 0.81** there vs **0.03** on inferable tasks.
- **Powered replication (n=210, 3 tiers, 5 reps/cell, Wilson 95% CIs):** blind spot reproduced at
  **100% [94–100]** confident-false-pass; writing the edge into the spec converts it to a
  **98% [91–100]** catch. The harness self-validates non-inferability locally (`validate.mjs`).
  This is the result to lean on.
- **Abstention (n=27, single rep):** confident false-pass **100% → 17%** with *exogenous*,
  capable-tier abstention (self-judged abstention only reached 67%); the powered run shows the same
  shape, tier-gated (opus > sonnet > haiku).
- **Independent corroboration:** AbstentionBench (arXiv:2506.09038) — abstention on
  underspecification is unsolved and *scaling models doesn't help*; omission-decay
  (arXiv:2604.20911) — must-NOTs decay 73%→33% over a long session (4,416 trials).

## Honest claim (not overclaimed)

A **novel synthesis + original measurement**, not a net-new concept. The pieces —
clarify-before-coding, abstention-on-underspecification, the test-oracle-incompleteness
principle — are prior art. New here: the *measurement* that verifier overconfidence
concentrates on non-inferable requirements, and the *assembly* (shape-taxonomy pre-planning
gate + `insufficient_spec` abstention at the verifier step, gated on an exogenous spec tag,
shipped fail-closed). Not a complete fix: an edge-probe *miss* is necessary but not sufficient for a
verifier blind spot — on the genuine blind spots (an edge the probe doesn't name **and** the spec's
other obligations don't imply) the verifier still false-passes at **67–93%**, so a held-out backstop
stays necessary. (The miss categories tested were hand-picked for probe-blindness — an existence
finding, not a population rate.)

## Read next

| File | For whom |
|---|---|
| [edge-probe-plain-english.md](edge-probe-plain-english.md) | **Anyone** — the problem in plain English, zero background needed |
| [edge-probe-user-feature.md](edge-probe-user-feature.md) | **Users** — what it does for you, plain language |
| [edge-probe-family-summary.md](edge-probe-family-summary.md) | Maintainers — scoreboard, changelog, novelty positioning |
| [../paper/main.pdf](../paper/main.pdf) | The full arXiv paper (source: [`../paper/main.tex`](../paper/main.tex)) |
| [../paper/CORRECTIONS.md](../paper/CORRECTIONS.md) | The data-integrity ledger (every claim tightened, dropped, or restored) |

---

*Features = community GSD-Core. Research thesis + measurements = David's original work
("my findings, contributed into GSD").*
