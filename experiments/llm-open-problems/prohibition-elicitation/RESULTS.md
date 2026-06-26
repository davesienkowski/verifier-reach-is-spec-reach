# N18 — "What could this silently become?" prohibition elicitation at spec time

**Date:** 2026-06-02 (run → extended → hardened → caveats closed, same day). **Branch:**
`feat/non-inferable-pipeline`. **Provenance:** r/ClaudeAI `1tv1kng` — Much-Wallaby-5129 ("a human-written
negative test: *this must not become a streak mechanic*") + johns10davenport (Three Amigos; the human
authors the boundary).

**Methods:** edge-probe (shape taxonomy) · adversarial "what could this silently become?" · Three Amigos
(PM/Dev/QA). **Tasks:** 2 shape controls + **13 holistic-prohibition tasks** — 6 canon-backed (C2–C7:
dark-pattern, fail-closed, PII, fairness, GDPR-erasure, no-fabrication) and **7 canon-less** product-values
prohibitions: 4 engagement-ethics (C1 streak, D1 feed, D2 watch-time, D3 game difficulty) + **3
non-engagement** (E1 ER-triage equity, E2 research-integrity data-cleaning, E3 FOIA over-redaction).
**~80 agent runs:** elicitation across opus/sonnet/haiku on the decisive cells; a precision second-stage
(8 recall + 3 false-positive). **Scripts:** `analyze.mjs`, `scores.tsv`, `precision.tsv`.

**Verdict (final):** A clean three-layer result, robust across domains and models.

| layer | who reaches it | GSD action |
|---|---|---|
| **shape edges** | all methods (4/4) | edge-probe (shipped) |
| **canon-backed prohibitions** (security/privacy/fairness/GDPR/AI-safety) | every method, *every model incl. haiku* (8/8) | a deterministic **checklist** — no LLM needed |
| **canon-less product-values prohibitions** | **only the adversarial probe is robust** (17/17, incl. haiku 6/6); Three Amigos is conditional (9/17) | **two-stage adversarial probe** (recall → precision classifier) |

And the precision problem is **solved with no false positives**: the classifier collapses ~9 surfaced
constraints → ~2 (GT retained 8/8) and returns NONE on clean specs (3/3).

## Result 1 — recall by task class

| method | shape | holistic | canon-backed | canon-less |
|---|---|---|---|---|
| edge-probe | 4/4 | **0/8** | 0/6 | 0/2 |
| adversarial | 4/4 | **25/25** | 8/8 | **17/17** |
| Three Amigos | 4/4 | 17/25 | 8/8 | **9/17** |

## Result 2 — canon-less recall by model (7 tasks, the decisive cells)

| method | opus | sonnet | haiku |
|---|---|---|---|
| adversarial | 7/7 | 4/4 | **6/6** |
| Three Amigos | 5/7 | 3/4 | **1/6** |

- **The adversarial probe is model-robust.** Even haiku catches every canon-less prohibition under the
  "what would betray intent while passing?" framing. The instruction does the work the weak model won't.
- **Three Amigos is conditional.** Strong models caught the loud-wording cases (D1–D3 "maximize
  time/watching/engaged"; E2 research-integrity; E3 over-redaction) but **missed the soft-trap cases on
  both models** — C1 ("encourage") and **E1 ER-triage** ("run efficiently"), where the bespoke equity
  prohibition (no ability-to-pay/insurance in triage order) hides behind innocuous wording. **haiku
  failed canon-less almost entirely (1/6).**

## Result 3 — the non-engagement tasks close the caveat

The earlier worry was that all canon-less tasks were engagement-ethics. E1–E3 are deliberately far from
the attention economy — **ER triage, research data integrity, FOIA transparency** — and the pattern is
identical: adversarial 6/6 (opus+haiku), Three Amigos catches E2/E3 with opus but misses E1 (soft trap)
and mostly fails on haiku. So the adversarial-robust / Three-Amigos-conditional split is a property of
**how the prohibition is worded and how strong the model is — not of the domain.**

## Result 4 — the weak model, canon-backed vs canon-less

| haiku | canon-backed | canon-less |
|---|---|---|
| adversarial | 2/2 | 6/6 |
| Three Amigos | 2/2 | 1/6 |

Even the cheap model reliably catches *canon-backed* prohibitions (PII, fairness) with either method —
they're in its training canon. The gap is entirely on *canon-less* prohibitions, and only the adversarial
framing closes it. This is the empirical case for the layered adoption: a checklist for the canon, the
adversarial probe for the bespoke.

## Result 5 — precision solved, and safe

A one-pass classifier second-stage ("of these candidates, return only the genuine must-not prohibitions,
≤3"):

- **Recall:** GT prohibition retained **8/8** across engagement *and* non-engagement tasks; mean list
  **9.3 → 2.3**. The non-GT items it kept were themselves real prohibitions (self-dealing, PII, no-leakage,
  no-PHI-logging) — signal, not noise.
- **False positives:** fed three *clean* specs (merge-intervals, parseConfig, truncate) whose constraints
  are all shape/operational — including engineering must-nots ("don't mutate", "don't throw", "return a
  primitive") — the classifier returned **NONE on all 3**. It correctly distinguishes an engineering
  must-not from a values/safety prohibition and does **not** hallucinate prohibitions where none exist.

So the adoption artifact is a **two-stage adversarial probe**: probe (high recall, model-robust) →
classifier (precision, no false positives) → a short, human-confirmable list of ~2 candidate prohibitions.

## Result 6 — gating-readiness hardening (before the classifier blocks vs advises)

Two pre-gate checks, run as the full probe→classifier pipeline:

- **Bigger false-positive battery (8 clean/utility specs:** merge, config, truncate, formatCurrency,
  paginate, debounce, parseCSV, slugify). **Engineering-robustness items promoted to prohibitions:
  0/8.** The classifier never mistook "don't mutate / don't throw / return a primitive / purity / timer
  hygiene" for a values prohibition. 6/8 returned NONE; the other 2 surfaced *genuine* security/fairness
  items the design under-rated — parseCSV's `__proto__` prototype-pollution, and slugify's path-traversal
  output + silent non-ASCII (non-Latin name) deletion. That's discrimination, not trigger-happiness: it
  finds real safety/inclusion issues while rejecting every pure-engineering item.
- **Multi-prohibition completeness (2 specs with 3 distinct prohibitions each:** M1 lending =
  fairness + privacy + transparency; M2 location-sharing = consent + anti-stalking + retention). The
  classifier surfaced **all 3 distinct prohibitions on both (3/3 each)** — it does not cap at one. In
  these prohibition-dense domains it kept all genuine items (loan 8/8, location 10/10) rather than
  dropping any, while still cutting operational-heavy lists ~10→2 elsewhere. **Precision is
  input-adaptive:** it removes operational noise, not genuine prohibitions, however many there are.

**Conclusion:** the two-stage probe is gate-ready on these axes — high recall (model-robust), complete on
multi-prohibition specs, and zero engineering-item false positives. The one tuning question it raises:
the classifier leans *inclusive* on security/fairness (it flagged proto-pollution and path-traversal on
"clean" utilities), so a deploying team must decide whether such adjacent security items are in-scope for
the prohibition backstop or routed elsewhere — a scoping choice, not a correctness defect.

## What this means for GSD (final, evidence-complete)

1. **Shape edges → edge-probe** (shipped; 4/4; 0/8 on values — never expect more).
2. **Canon-backed prohibitions → a deterministic checklist** (OWASP/GDPR/fairness/AI-safety). Both methods,
   every model incl. haiku catch these — so a static domain-keyed checklist suffices, no LLM pass.
3. **Canon-less product-values prohibitions → the two-stage adversarial probe.** Only method that's
   model-robust here; the classifier makes its output a ~2-item human-confirmable list with no false
   positives. **Do not** rely on a Three-Amigos-style review for this class — it needs a strong model and
   still misses soft-worded prohibitions (C1, E1).
4. **Residue → N17 exogenous abstention.** Pipeline: edge-probe + canon checklist + two-stage adversarial
   probe → confirmed prohibitions become `must_haves` of `polarity: prohibition` (N7) → whatever escapes →
   held-out test via N17.

## Caveats (remaining)

- **Single pass per cell** on most runs (no repetition); the canon-less model split is consistent across
  7 tasks but n-per-cell is small. Direction is strong and one-sided.
- **The precision classifier** now passes recall (GT 8/8), an 8-spec false-positive battery (0 engineering
  items promoted), and multi-prohibition completeness (3/3 on two specs). Remaining for full gating
  confidence: scale the battery further and decide the scoping of adjacent security items (proto-pollution
  etc.) it inclusively surfaces. It is advice-ready now; gate-ready pending that scoping decision.
- **Three Amigos was one model role-playing three roles**, not a real session with a domain human — which
  is johns10's actual prescription. The C1/E1 and haiku misses show the *ritual prompt alone* inherits only
  the model's canon and strength; a human in the room is exactly what supplies the missing bespoke rule.
- **"Hit" is human-scored** against the held-out GT; `scores.tsv` records the matching line per run.
