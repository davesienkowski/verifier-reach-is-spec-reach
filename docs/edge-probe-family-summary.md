# The edge-probe family — spec-completeness → honest verification

*A connected set of GSD-Core contributions descending from one research thesis:
**a verifier only catches what the spec named.** On a non-inferable-defect corpus a held-out
test oracle caught 100% (3/3 tasks) while the LLM verifier caught 0/12 verdicts — and was
miscalibrated specifically there (ECE 0.81 on non-inferable vs 0.03 on inferable). A powered
replication (n=210, opus/sonnet/haiku, 5 reps/cell, Wilson 95% CIs) reproduced the blind spot at
100% [94–100], and writing the edge into the spec converts it to a 98% [91–100] catch. The program
moves defect-naming forward (spec/plan time) and makes verification fail honestly.*

Last updated: 2026-06-26

---

## Why this is worth carrying

This targets a *measured*, independently-corroborated failure mode, not a speculative nicety: the
verifier's confident-green concentrates on under-specified requirements, where no test backstops it.
The intervention is cheap (a few spec-time questions), fails closed (it adds no new way to silently
pass), and is grounded in a powered study (n=210, confidence ranges) plus an external benchmark that
independently finds bigger models don't rescue abstention on under-specification. Net: it cuts false
confidence in CI rather than adding noise — high leverage, low maintenance.

## Scoreboard

| # | What | Status | User-visible surface |
|---|------|--------|---------------------|
| #550 → PR #584 | Edge-probe | ✅ Merged | `/gsd-spec-phase` |
| #1102 → PR #1108 | Edge-probe recall sharpening | ✅ Merged | `/gsd-spec-phase` |
| #1110 → PR #1117 | Unclassified edge surfacing | ✅ Merged | `/gsd-spec-phase` |
| #644 → PR #1149 | Prohibition-probe (must-NOTs) | ✅ Merged | `/gsd-spec-phase`, `/gsd-verify-work` |
| #1259 → PR #1273 | Test-tier prohibition enforcement | ✅ Merged | `/gsd-verify-work` |
| #1278 → PR #1301 | Deterministic check-descriptor auto-locate | ✅ Merged 2026-06-16 (merge 0c53ec4a) | `/gsd-verify-work` |
| #1279 → PR #1314 | Machine-proven fail-first | 🔶 In flight (changes addressed, awaiting trek-e re-verify) | `/gsd-verify-work` |
| #1154 → PR #1738 | Honest verifier (truth-axis abstention) | ✅ Merged | `/gsd-verify-work` |
| #1074 epic (PRs #1089/#1096/#1097) | Size-budget ratchet | ✅ All 3 merged | Contributor CI only |
| #1008 → PR #1009 | io EAGAIN pipe fix | ✅ Merged | Reliability (invisible) |
| #652 | LLM classifier | ❌ Withdrawn | — |

---

## Discord post (maintainers)

> **The edge-probe family has landed — spec-completeness → honest verification**
>
> Over the last few weeks a connected set of spec/verify improvements merged into `next`. They all chase one idea: *a verifier only catches what the spec named*, so move defect-naming forward and make verification fail honestly.
>
> **Shipped:**
> • **Edge-probe** (#584) + recall sharpening (#1108) + unclassified-surfacing (#1117) — `/gsd-spec-phase` now interrogates each requirement's shape for the edges authors miss (rounding/tie-breaking, encoding, boundaries…), and terse prose that used to drop silently now surfaces as *"unclassified — review manually."*
> • **Prohibition-probe** (#1149) — surfaces must-NOT constraints into a structured `must_haves.prohibitions:` block with verification tiers (`test` / `judgment`).
> • **Test-tier enforcement** (#1273) — a mechanically-checkable must-NOT now **hard-gates** verify-phase, fail-closed if the check can't even run.
> • **Honest verifier** (#1154 → PR #1738) — verify-phase now **abstains** (`insufficient_spec → human_needed`) on a non-inferable truth it can't confirm, instead of emitting a confident false-pass (measured 100%→17%).
> • Plus: size-budget per-file baseline ratchet (#1074 epic, all 3 PRs), io EAGAIN pipe fix (#1009).
>
> **In flight:**
> • **#1301** — deterministic auto-locate of the prohibition check descriptor (design approved; fast-check property added; one re-review from merge).
> • **#1314** — machine-proven fail-first via violation fixture (PR open).
>
> Net effect for users: gaps and must-NOTs get named at spec time, and verify-phase stops rubber-stamping things it didn't actually check.

---

## Changelog block

```markdown
### Spec-completeness & honest verification (edge-probe family)
- spec-phase: edge-probe surfaces shape-implied edge cases authors miss (#584)
  - sharpened numeric/tie-breaking recall (#1108)
  - terse, uncued requirements now flagged "unclassified" instead of dropped (#1117)
- spec-phase: prohibition-probe captures must-NOT constraints with test/judgment
  verification tiers (#1149)
- verify-phase: test-tier prohibitions hard-gate, fail-closed when uncheckable (#1273)
- tooling: per-file workflow/agent size-budget baseline (#1074); io EAGAIN fix (#1009)

- verify-phase: honest verifier abstains (`insufficient_spec → human_needed`) on
  non-inferable truths it can't confirm, instead of confident false-pass (#1154)
```

---

## What each capability does (before / after)

### Edge-probe — "what did the spec forget?" (#550, #1102, #1110 — shipped)
- **Before:** the spec captures the happy path; edge cases the author never considered
  (empty list, rounding mode, Unicode in names, CSV-injection on export, timezone on a
  due-date) silently never enter the spec and surface later as bugs — if at all.
- **After:** spec-phase classifies each requirement's *shape* and proactively asks about
  the edges that shape implies, weighted toward what the author would miss. The defect is
  named in the spec, so implementer and verifier both look for it.
  - #1102 sharpened the numeric probe to name tie-breaking/rounding (50%→0% false-pass on
    tie-class tasks).
  - #1110 fixed silent-drop: terse, uncued prose now surfaces as "unclassified — review
    manually" instead of vanishing.

### Prohibition-probe — "what must this NOT do?" (#644 → PR #1149 — shipped)
- **Before:** specs are lists of things to do; must-NOTs live only in the author's head,
  so the verifier has nothing to check them against.
- **After:** spec-phase runs a two-stage adversarial probe and writes must-NOTs into a
  structured `must_haves.prohibitions:` block with a verification tier (`test` =
  mechanically checkable, `judgment` = needs judgment). An unwired prohibition can never
  silently pass green; a `judgment` item the verifier can't confirm is flagged
  `human_needed`, not rubber-stamped.

### Test-tier enforcement — making the gate bite (#1259 → PR #1273 — shipped)
- **Before:** a `test`-tier prohibition was a permanent unsatisfiable "gap" — flagged
  forever, never actually proven.
- **After:** verify-phase runs the mechanical check (e.g. an ESLint/AST rule) as a hard
  gate; a violated must-NOT fails the phase, and the check fail-closes if it couldn't run.

### In-flight follow-ups
- **#1278 / PR #1301 (MERGED 2026-06-16):** deterministic source for the check descriptor
  `{kind,target,rule}` so the verifier locates the check deterministically instead of risking
  LLM invention. Fast-check round-trip property added; trek-e approved + merged.
- **#1279 / PR #1314:** replace caller-attested "fail-first" with a real violation fixture
  that machine-proves the check would have caught the violation.
- **#1154 → PR #1738 (MERGED):** honest verifier — verify-phase abstains (`insufficient_spec →
  human_needed`) on a non-inferable truth it can't confirm (confident false-pass 100%→17%). The
  truth-axis counterpart to #644's prohibition judgment-tier. Implemented as
  `dispositionForUnverifiableTruth()` in `probe-core.cts`; trek-e content-approved (all 9 AC + 6
  conditions met), CI green.

### Off-thread but real
- **Size-budget ratchet (#1074, all 3 PRs merged):** per-file baseline snapshot replaces
  per-tier ceilings — workflow/agent file growth is a reviewable one-line diff in CI.
- **io EAGAIN fix (#1009):** `writeAllSync` retry/backoff replaces a bare `writeSync` that
  threw EAGAIN / truncated on a full pipe under the parallel test runner.

---

## Novelty positioning (live-literature check, 2026-06-16)

**Verdict: novel synthesis + original measurement, not a net-new concept.** Each pillar
sits inside an active 2024–26 research area; the core thesis is independently corroborated.

- **Edge-probe:** nearest prior art = ClarifyGPT (arXiv:2310.10996, FSE 2024; Mu, Shi, Wang
  et al.). It detects ambiguity via a *code-consistency check* (sample N solutions; if they
  diverge → ambiguous), then asks clarifying questions and regenerates (GPT-4 Pass@1
  70.96→80.80 on MBPP-sanitized). **Key differentiator:** consistency-sampling fires only
  where the model's own samples *disagree* — but the non-inferable blind spot is exactly where
  samples *agree on the wrong behavior*, so that signal is silent there. Edge-probe is instead
  shape-classified, deterministic-engine-backed, and writes a persistent machine-checkable
  contract a downstream gate consumes.
- **Prohibition-probe:** problem independently validated — "Omission Constraints Decay While
  Commission Constraints Persist in Long-Context LLM Agents" (arXiv:2604.20911, Yeran Gamage):
  prohibition compliance falls **73%→33% by turn 16** vs requirement 100% (p<10⁻³³; 4,416
  trials, 12 models, 8 providers). Their fix is operational (re-injection before a Safe-Turn-
  Depth, session caps), **not** spec-time elicitation + tiered fail-closed verification.
  Differentiator = adversarial spec-time elicitation + test/judgment tiers. (Note: this
  corroborates the *prohibition-fragility problem*, not the verifier-reach thesis directly.)
- **Honest verifier:** mechanism is mature — Conformal Abstention (arXiv:2405.01563, Abbasi
  Yadkori et al.), selective prediction; and **AbstentionBench (arXiv:2506.09038)** benchmarks
  abstention specifically on *underspecified* inputs and concludes it is "an unsolved problem,
  and one where scaling models is of little use." Differentiator = applied to coding-agent
  verify-phase, gated by an *exogenous* inferability tier (the edge-probe `backstop` tag), not
  the model's self-judgment, and emitted as a first-class `insufficient_spec` verdict. Bonus:
  AbstentionBench's "scaling doesn't help" independently matches our model-invariant blind spot
  (Opus≡Sonnet≡Haiku, 0/12). STATUS: both shipped —
  prohibition *judgment-tier* abstention (#1149) and the truth-axis abstention (#1154 → PR #1738).
- **Core thesis — verifier overconfidence is directly corroborated; the spec-reach framing is
  consistent with (not proven by) converging work.** LLM-judge / code-verification studies
  report that homogeneous/limited test suites let subtle faults go undetected and recommend
  held-out tests (arXiv:2507.06920; LLM-as-Judge for SE survey arXiv:2510.24367). The specific
  claim that the *spec*, not verifier reasoning, is the binding constraint is our articulation.

**Honest claim:** a shipped, deterministic, fail-closed pipeline (spec-completeness probe +
spec-time prohibition elicitation + tier-gated abstaining verification) built on a thesis
whose key premise (verifier overconfidence) is independently corroborated — *not* "nobody
thought of this," and *not* a single-handed proof of the stronger framing.

*Verified 2026-06-16:* ClarifyGPT (2310.10996), omission-decay (2604.20911), conformal
abstention (2405.01563) all confirmed against primaries; earlier "73%→20% / χ²=147" figures
were a fetch error, now corrected. Unsourced stats (Cohen's Kappa, LeetCode failure %) dropped.
*Added 2026-06-26:* AbstentionBench (2506.09038) confirmed against primary — benchmarks
abstention on underspecification; "scaling models is of little use."

---

## Attribution

The merged features are **community GSD-Core's**. The underlying research thesis and
measurements (held-out vs verifier, ECE, N17/N18 results) are **David's original work**.
Keep that line crisp in anything public: "my findings / contributed into GSD," not
"GSD's novel contribution."
