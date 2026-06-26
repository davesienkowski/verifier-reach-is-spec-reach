# Edge-probe relevance precision & persona-weighted blind-spot coverage

**Status:** designed + **RUN** 2026-06-03 · branch `feat/non-inferable-pipeline` · see [`RESULTS.md`](./RESULTS.md)
**Feature under test:** spec-completeness edge-probe (#550 / PR #584, MERGEABLE, at doorstep of merge)
**Relation to prior work:** the precision-half of the [N18 prohibition-elicitation](../prohibition-elicitation/RESULTS.md)
method, applied to the edge-probe's relevance filter; recall side extends
[noninferable-corpus](../noninferable-corpus/RESULTS.md) from 3 algorithmic tasks to an app-flavored corpus.

---

## Why this experiment exists (the gap)

The edge-probe surfaces omitted domain-boundary edges at spec time so the verifier can catch defects on
them (`verifier reach = spec reach`; see noninferable-corpus: held-out caught 100% vs verifier 0/12,
ECE 0.81 while wrong). Its load-bearing component is the **relevance filter**: it classifies each
requirement's *shape* (numeric-range, collection, string/text, stateful-op, I/O) and raises only the
*applicable* edge categories from the closed 8-category taxonomy. An `unresolved` is only meaningful if
it's an edge that genuinely applies.

**The filter's false-positive rate is unmeasured.** If it raises *concurrency* on a single-user bill
calculator, or *precision/overflow* on a spec with no float path, the author's reaction flips from "oh
good, caught that" to "why is it asking me this" — and after a few of those they reflexively stamp
`dismissed` to get unblocked, which is the exact behavior #550 cites as the reason it rejected a *hard*
gate. The relief-vs-friction outcome hinges entirely on precision.

**#550's own acceptance criteria do not cover this.** They check *recall* on exactly 3 algorithmic
tasks (rounding tie, touching intervals, grapheme truncation) and check *precision nowhere*. So #584 is
about to merge with the relevance filter's false-positive rate completely unmeasured — on an
algorithmic-flavored evidence base, not the app specs the audience (vibe-coders, app devs) actually
writes.

**This is post-merge empirical validation, not a merge gate.** None of trek-e's review blockers were
about relevance precision (they were contract / fail-closed / ADR-550 engineering, all resolved). The
probe ships on the closed-taxonomy bet; this experiment tests whether that bet holds for the target
audience and tells us when it would break.

---

## Questions

- **M1 — Relevance precision.** Across an app-flavored corpus, what fraction of the edges the probe
  raises are *genuinely applicable*? Equivalently: false-positive (phantom) edges raised per spec.
  *Bar to beat:* N18 made the prohibition probe shippable by driving false positives from 10.2 → 2.2
  per task via a one-pass classifier. A comparable low per-spec count is the "self-policing taxonomy"
  hypothesis confirmed.
- **M2 — Persona-weighted blind-spot coverage (recall).** On specs with a known omitted edge, does the
  probe surface it? And crucially, weighted toward edges the author *would have missed unaided* — an
  edge a senior dev catches on their own earns the probe little credit; an edge *all* personas miss is
  the probe's real territory.

## Corpus (app-flavored, the design fork we resolved)

~6–8 specs a vibe-coder / app dev would actually write — chosen to exercise all 5 shapes and spread the
8 categories, **not** algorithm puzzles:

| Spec | Dominant shape(s) | Edge it's designed to probe (recall GT) | Phantom-risk category (precision GT) |
|---|---|---|---|
| Split a bill evenly among N people | numeric-range | precision (leftover cent), empty/degenerate (0/1 people) | concurrency (single-user calc → should NOT raise) |
| Upload a profile picture | I/O, string/text | encoding (filename normalization), boundary (max size), empty (0-byte) | ordering/stability (N/A) |
| Search / filter a list | collection, string/text | empty (no results), ordering (tie-break, stable sort) | precision/overflow (no float path) |
| Login / session expiry | stateful-op | concurrency (parallel login), idempotency (double-submit), boundary (expiry instant) | encoding (N/A) |
| Due-date reminder | numeric-range, stateful-op | boundary (due *at* midnight, TZ), idempotency (re-fire) | — |
| Paginate results | numeric-range, collection | boundary (last page, page past end), ordering (stable across pages) | encoding (N/A) |
| Export to CSV | collection, string/text, I/O | encoding (commas/quotes/unicode in cells), empty (no rows) | concurrency (N/A) |

Each spec ships as `specs/<slug>/requirements.json` (the probe's real input shape) plus a
`ground-truth.json`: per-requirement (a) which of the 8 categories *genuinely apply* (precision GT), and
(b) the one omitted edge that matters (recall GT).

## Persona baseline (the recall weighting) — empirically anchored

For each recall-GT edge, label whether each persona would catch it **unaided**: `vibe-coder` / `mid` /
`senior`. The probe's *value* on an edge = whether it surfaced an edge the persona would have missed.
Headline: **recall on each persona's blind-spot set**, especially edges *all three* miss. Rather than
rest this on role-played elicitation alone, two real signals anchor (and bound) it:

### Anchor A — mined verifier transcripts (the senior/mid blind-spot ground truth)

`../noninferable-corpus/verdicts.tsv` is a real "what a careful reviewer misses and why" record: 12
inspection verdicts (opus + haiku) on 3 deliberately-omitted-edge tasks. **The non-inferable edge was
caught 0/12 — including by opus, the senior-dev proxy, 0/6.** The `note` column shows the misses are
*systematic*, clustering into three blind-spot mechanisms the persona baseline should encode:

| Mechanism | Transcript evidence | Implication for weighting |
|---|---|---|
| **"Defensible under a standard definition"** | 02 touching-intervals: opus passed 2/2 (0.80–0.82), "called strict-`<` defensible" | reviewer *accepts the omission as a legitimate reading* → invisible even to senior |
| **"Never entered the frame"** | 03 grapheme: opus "never considered Unicode"; the one `gaps_found` flagged an unrelated NaN/negative-`max` guard | category absent from the reviewer's mental checklist → missed across tiers |
| **Adjacent-inferable capture** | 01 round-tie: opus caught the *inferable* `1.005→1.00` FP bug, never the half-even tie; haiku passed all | attention spent on the catchable bug → the non-inferable one survives |

**Recalibration:** because opus (senior proxy) missed adjacency/encoding/precision-tie 0/6, these
categories must be scored as **missed by all personas, not just vibe-coders.** That's the probe's
*highest*-value territory — not hand-holding a beginner, but covering a cross-tier blind spot. This
also gives a **validity check on any role-played elicitation**: if a role-played "senior" claims to
catch touching-merge unaided, it's miscalibrated against the empirical 0/6 and should be discounted.

### Anchor B — vibe-coder field data (the vibe-coder category prior)

What vibe-coders demonstrably skip in the wild, mapped to the taxonomy — use these to weight which
corpus specs/categories carry the most vibe-coder recall value:

| Field observation | Taxonomy category | Corpus spec it lands on |
|---|---|---|
| Auth handles common case, not edge — ownership check on GET but not PATCH/DELETE | concurrency / effect-ordering, idempotency | login/session |
| "Inputs and uploads treated as just form data," server-side validation skipped | empty/degenerate, encoding, boundary (size) | profile-pic upload, CSV export |
| "Works in demo, hides flaws" + automation bias (less scrutiny on AI code) | *the confident-PASS mechanism itself* | all (motivates the probe) |

Scale (why the vibe-coder persona is the volume case): Escape.tech found 2,000+ high-impact vulns
across 5,600 vibe-coded apps; Veracode 2025 — 45% of AI-generated samples fail basic tests; CodeRabbit
— AI code carries 1.7× more major issues. The arXiv *Survey of Bugs in AI-Generated Code* (2512.05239)
names **"omitted edge cases" and "unconfirmed assumptions"** as recognized hard-to-diagnose AI-code bug
patterns — the non-inferable gap under another name; functional/logic bugs dominate (56 studies).

> **Scope caveat:** much vibe-coder field data is *security* (injection, secrets, authz). #550's
> edge-probe deliberately **refers security elsewhere** (its security-referral seam). So only the
> *correctness* slice of Anchor B is in-scope — input-shape validation (empty/encoding/boundary),
> effect-ordering, idempotency — not the injection/secrets findings. They motivate the vibe-coder
> persona's existence but are not edges this probe should claim.

### Procedure

Use Anchor A as the senior/mid blind-spot ground truth (extend it with a few new omitted-edge specs in
the app corpus, scored the same inspection way), and Anchor B as the vibe-coder category prior.
Role-played persona elicitation may *supplement* per-spec labels but is always bounded by Anchor A's
empirical 0/6 — never allowed to over-credit a persona with catching an edge the real transcripts show
is missed.

## Method

1. Build (or fetch from the #584 branch) the deterministic engine `edge-probe.cjs` and run it on each
   `requirements.json` → coverage JSON of raised `(requirement, category)` edges. *(Deterministic
   engine ⇒ precision is a reproducible property of the taxonomy + shape-cues, not a sampling artifact.)*
2. **M1:** raised edges scored against precision GT → applicable / phantom. Report phantom edges per
   spec (mean, max) and per category (which categories over-fire).
3. **M2:** for each spec's recall-GT edge, did the probe raise it? Cross with the persona baseline →
   recall on each persona's blind-spot set.
4. Confusion at the category level: which shapes drive false positives (e.g. does "stateful-op" over-
   raise concurrency?).

## Decision rule

- **Precision good (low phantom rate):** validates the closed-taxonomy / self-policing bet and the
  merge; the relief reaction holds. Records the bar any future taxonomy growth must preserve.
- **Precision poor (phantom-heavy, esp. one category):** evidence to tighten the relevance filter's
  shape→category map *before* any taxonomy expansion. This is the trigger condition in
  [`SEED.md`](./SEED.md): never extend the closed 8-category taxonomy with a domain pack until precision
  is re-measured, because false-positive rate scales with taxonomy size.
- **Recall on blind-spot set high:** quantifies the probe's actual marginal value over an unaided author
  — the number worth putting in front of users (and in the FEATURES doc / any writeup).

## Evidence base

- noninferable-corpus: verifier 0/12 (opus 0/6) vs held-out 100%, ECE 0.81 — and the `verdicts.tsv`
  `note` column, mined here as the senior/mid blind-spot ground truth (Anchor A).
- N18 prohibition-elicitation: precision 10.2 → 2.2 via one-pass classifier (the bar + the method).
- #550 ISSUE.md AC: recall on 3 algorithmic tasks, precision unmeasured (the gap this fills).
- Taxonomy under test: 8 categories × 5 shapes, relevance filter (#550 DESIGN.md §taxonomy).
- Vibe-coder field data (Anchor B), 2026-06-03:
  - Survey of Bugs in AI-Generated Code — arXiv 2512.05239 ("omitted edge cases", "unconfirmed assumptions").
  - getautonoma.com/blog/vibe-coding-failures; aikido.dev/blog/vibe-coding-security;
    evilmartians.com/chronicles/four-most-common-security-risks-when-vibe-coding-your-app;
    databricks.com/blog/passing-security-vibe-check-dangers-vibe-coding.
  - Scale: Escape.tech 2,000+ vulns / 5,600 apps; Veracode 2025 45% fail; CodeRabbit 1.7× major issues.

## Caveats

- **"Applicable" is a judgment call.** Two-rater labeling on the precision GT; disagreements are
  themselves signal (a category whose applicability is genuinely ambiguous is a filter-design problem).
- **Small n, direction-finding.** ~6–8 specs is not powered; like the sibling experiments, the aim is a
  large one-sided effect, not a p-value.
- **Persona baseline is now anchored, not pure role-play.** Anchor A (mined `verdicts.tsv`) is real
  inspection ground truth but small (12 verdicts, 2 models); Anchor B (field data) is a category prior,
  not per-spec labels. Role-played elicitation only supplements, bounded by Anchor A. Treat the
  persona-lift number as indicative, but it no longer rests on role-play alone.
- **Engine determinism cuts both ways.** Precision is reproducible, but it also means a phantom edge is
  a *systematic* taxonomy defect, not noise — every user with that requirement shape hits it.
