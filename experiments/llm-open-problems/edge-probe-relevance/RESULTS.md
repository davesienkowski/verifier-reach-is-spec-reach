# Edge-probe relevance — results

**Date:** 2026-06-03 · branch `feat/non-inferable-pipeline` · engine under test:
`gsd-core/bin/lib/edge-probe.cjs` @ `feat/550-edge-probe` (2606155f, PR #584).
**Corpus:** 7 app-flavored specs, 11 requirements (`specs/*/`). **Scripts:** `analyze.mjs`,
`results.tsv`, `phantoms.tsv`, `misses.tsv`. **Ground truth:** author-labeled, persona blind-spots
anchored to `../noninferable-corpus/verdicts.tsv` (Anchor A). Direction-finding, not powered.

**Verdict:** **The closed taxonomy is fine — the going-in worry was aimed at the wrong layer. The weak
link is upstream: the deterministic prose→shape classifier both over-fires on incidental words and goes
silent on terse real-world prose, and the edges it misses are disproportionately the high-value
cross-tier blind spots.** On the app corpus the relevance filter scored **58% precision** (11 phantom
edges in 26 raised) while **missing 48% of applicable edges** — including 3 requirements where it raised
**nothing at all**. Persona-weighted blind-spot recall was **44% / 40% / 50%** (vibe / mid / senior).

## M1 — Relevance precision (the over-fire)

| metric | value |
|---|---|
| edges raised | 26 |
| phantom (raised, not applicable) | 11 → **micro-precision 58%** |
| phantom per requirement | 1.00 (under N18's 2.2/task *count* bar, but precision is poor) |
| applicable edges **not** raised | 14 / 29 = **48% under-fire** |

**Phantoms are dominated by one category: `adjacency` (5 of 11).** Every requirement containing a
`collection` cue word — "each", "list", "results" — gets *Adjacency / touching* raised, even when there
is no touching/equality concept: dividing a bill ("each person"), searching a list, paginating results.
Adjacency is the canonical phantom — the concrete instance of the "phantom concurrency on a calculator"
risk we set out to measure, just wearing a different category. (`ordering` 2, `concurrency` 2,
`empty` 1, `precision` 1 round it out.)

> **Precision is gameable by silence.** `login-session` R1/R2 and `due-date-reminder` R1 each score
> precision **1.00** — by raising *zero* edges. Reporting precision without recall would call total
> silence a success. The joint view is the only honest one (cf. the verifier-abstention lesson:
> abstaining is not the same as being right).

## M2 — Persona-weighted blind-spot recall (the under-fire)

Recall on the edges each tier would miss *unaided* (the probe's actual value):

| persona | recall-GT edges surfaced |
|---|---|
| vibe-coder | 7/16 = **44%** |
| mid | 6/15 = **40%** |
| senior | 3/6 = **50%** |

**The probe misses more than half of the edges its target user would miss** — and the misses are the
worst ones. The 9 missed recall-GT edges:

| spec / req | missed edge | why it matters |
|---|---|---|
| profile-pic-upload R1 | boundary | max file size |
| profile-pic-upload R1 | encoding | filename normalization / type sniffing |
| login-session R1 | boundary | behavior exactly at the expiry instant |
| login-session R1 | concurrency | parallel logins / refresh race |
| login-session R2 | idempotency | double logout is a no-op |
| due-date-reminder R1 | boundary | timezone / due exactly at midnight |
| due-date-reminder R1 | idempotency | do not double-send on retry |
| pagination R1 | boundary | requesting a page past the end |
| csv-export R1 | encoding | escaping commas/quotes/newlines/unicode in cells |

These line up exactly with **Anchor A** (encoding + precision-tie + adjacency are cross-tier blind
spots, missed 0/6 by opus) and **Anchor B** (CSV escaping, file handling, auth edge cases are the
documented vibe-coder failure modes). The probe is silent on the precise edges the evidence says
nobody catches unaided.

## Root cause: it's the classifier, not the taxonomy

The miss mechanism is `SHAPE_CUES` — a word-boundary regex mapping prose → one of 5 shapes, which then
filters the 8-category taxonomy. Two failure modes, both prose-driven:

1. **Over-fire on incidental words.** "each" / "list" / "results" → `collection` → Adjacency + Ordering,
   regardless of whether touching/order is a real concern. 5 of 11 phantoms are this one word class.
2. **Silence on terse prose.** Vibe-coders write *"log the user in and keep them signed in until the
   session expires"* and *"send the user a reminder when their task is due"* — no `numeric-range`,
   `text`, or `io` cue word, so **0 shapes → 0 categories → 0 edges.** The encoding/boundary/idempotency
   edges that matter are never reachable because the prose never said "file size", "unicode", or
   "timezone". The author would have to already know the edge to phrase it into existence — which is the
   exact blind spot the feature exists to cover.

So the user's going-in instinct was *half* right: the **closed taxonomy is not the problem** (it's
narrow and the categories are sound). The problem is the **shape-classification step upstream of it** —
and it fails worse on *under*-fire (48% of applicable missed, 3 reqs fully silent) than on the
over-fire we set out to look for (though adjacency over-fire is real and systematic).

## What this implies

- **Not a merge blocker** (as designed — this is post-merge validation), but a clear **follow-up for the
  classifier**: the deterministic regex is too brittle for unstructured vibe-coder prose. Candidate
  fixes: (a) let the LLM resolution loop / Round-4 warm-start carry shape classification rather than the
  regex alone; (b) default-on more categories when prose is ambiguous (bias to over-raise + dismiss,
  matching the `--auto` "never silently drop" principle) — but that trades precision; (c) an
  LLM-assisted shape classifier (the N18 move: a one-pass classifier beat the heuristic on precision).
- **The over-fire fix and the under-fire fix pull against each other** through the same regex — which is
  why this belongs measured before any taxonomy/pack expansion (`SEED.md`): a wider taxonomy on the same
  brittle classifier widens *both* error modes.
- **Reframe of the feature's value claim:** on prose alone the deterministic core surfaces <50% of the
  cross-tier blind-spot edges. The feature's real value depends on the LLM-in-the-loop path doing the
  classification the regex can't — which is the next thing to measure (see Caveats).

## Caveats

- **Tests the deterministic engine in isolation, on prose-only input.** No authored `shapes` override,
  no LLM resolution loop, no Round-4 Failure-Analyst warm start — i.e. the portable/`--auto`/reference
  path #550 ships and the path its AC's "relevance filter raises only applicable categories" claim rests
  on. The full interactive spec-phase may recover under-fires via the LLM; **that is the highest-value
  follow-up run** (same corpus, route requirements through the actual Step 5.5 loop, re-score).
- **A careful author can set `shapes` explicitly** to fix classification — but the target audience
  (vibe-coders) won't, so the prose-classification path is the realistic one for them.
- **"Applicable" is author judgment.** The headline calls are uncontroversial (no touching concept when
  dividing money; CSV escaping is *the* CSV edge), so the direction is robust to labeling quibbles; the
  exact 58% is not.
- **n = 7 specs, 11 requirements.** Large one-sided effect, not a powered estimate.

---

# Follow-up: LLM-in-the-loop condition

**Date:** 2026-06-03 · `analyze-llm.mjs`, `llm-runs/*.json`. **Method:** 7 *blind* subagents (one
per spec, **Opus**, no sight of ground truth or the deterministic output), each given the real
`gsd-core/references/edge-probe.md` protocol — taxonomy + relevance-filter rule — and only that spec's
requirement prose. They did the shape-classification + filtering Step 5.5 asks an LLM to do; scored
against the *same* ground truth.

**Verdict:** **The LLM-in-the-loop fixes both failure modes completely — but the shipped workflow is
internally contradictory about whether the LLM is even allowed to do this, so the realized behavior is
a coin-flip between the two columns below.**

| metric | deterministic engine | LLM-in-the-loop (Opus, blind) |
|---|---|---|
| relevance precision | 58% (11 phantom / 26) | **81%** (7 phantom / 36) |
| phantoms per req | 1.00 | **0.64** |
| applicable edges missed (under-fire) | **48%** (14/29) | **0%** (0/29) |
| persona recall — vibe / mid / senior | 44% / 40% / 50% | **100% / 100% / 100%** |
| recall-GT edges missed | 9 | **0** |

The LLM **recovered every under-fire** — including the cross-tier blind spots the deterministic engine
*and* opus-as-reviewer missed (Anchor A): CSV escaping, file size + filename encoding, expiry-instant
boundary, timezone/midnight, double-send idempotency. The 3 whole-spec-silent cases (login, logout,
reminder) went from **0 edges → full applicable coverage.** And it did this with **higher** precision,
because it correctly suppressed the engine's #1 phantom: **zero adjacency false-positives** (vs 5 for
the engine) — it reasoned "shares aren't compared/sorted against each other", "a flat export has no
notion of two elements touching."

**The LLM's 7 phantoms are a different species from the engine's.** They are mostly *defensible* edges
my conservative ground truth didn't label — size-field overflow (`precision` on upload), clock
skew/epoch overflow (`precision` on expiry), torn-row consistency (`concurrency` on CSV export), row
order across exports (`ordering` on CSV). Where the engine's adjacency phantom is *spurious* (no
touching concept exists when dividing money), the LLM's phantoms are mostly it finding *more real
edges* than the GT — so its true precision is likely **understated** here, not overstated.

## The load-bearing catch: does Step 5.5 let the LLM classify, or not?

`spec-phase.md` Step 5.5 contradicts itself on the one question that decides which column you get:

- **Bash (marked load-bearing):** *"the covered/backstop/dismissed/unresolved rows in `$COVERAGE` drive
  the resolution loop below (canonical taxonomy compute, **NOT LLM re-derivation from prose**)."* → the
  brittle engine output is canonical; the LLM only *resolves* what the engine raised → **left column**.
- **Prose step 1:** *"Classify its shape and raise only applicable edge categories (relevance
  filter)."* → the LLM classifies and raises → **right column.**

If the engine's raised set is canonical, the LLM never sees the missed `encoding`/`boundary` edges to
resolve them — the 48% under-fire **ships even interactively.** If the prose governs, users get the 81%
/ 100% behavior. The doc currently says both. **This ambiguity is worth ~23 precision points and ~48
recall points** and is the single highest-value thing to resolve.

## Partial mitigation already present (and its gap)

Step 5.5 has a **zero-applicable guard**: if the engine raises 0 edges across *all* requirements, it
warns ("likely a classification miss") and asks the author to confirm. This *did* cover the 3
whole-spec-silent requirements in this corpus (login R1/R2, reminder R1). **But it is spec-level, not
requirement-level:** a spec where one requirement raises an edge and another raises none sails through
with no warning — exactly how `csv-export` (engine raised a phantom `concurrency`, silently missed
`encoding` — *the* CSV edge) and `profile-pic-upload` R1 (raised `concurrency`, missed
`encoding`/`boundary`/`empty`) escape. The guard catches total blackout, not the more common partial
under-fire.

## Revised conclusion

- The taxonomy is sound; the **deterministic prose→shape regex is the weak link** (confirmed) — but the
  **LLM-in-the-loop is an excellent classifier** (Opus: perfect recall, 81%+ precision, no spurious
  adjacency). The feature's value is real **iff** the workflow routes classification through the LLM.
- **`--auto` is where the regex weakness actually bites:** the autonomous path leans hardest on the
  deterministic engine (auto-backstop on its raised set), so autonomous runs inherit the 58% / 48%
  column. This sharpens the original concern about autonomous users — they get the brittle path; the
  interactive author who answers AskUserQuestion gets the good one.
- **Top recommendations (fast-follow):** (1) resolve the Step 5.5 contradiction in favor of
  LLM-classifies-then-engine-cross-checks (use the engine as a *floor/backstop*, not the canonical set);
  (2) make the zero-applicable guard *per-requirement*, not per-spec; (3) replicate this run on
  haiku/sonnet — Opus is a best-case upper bound, and a weaker spec-phase model may not match it.

## Follow-up caveats

- **Best-case model (Opus), 1 rep/spec.** This is an upper bound on the LLM path; weaker models and
  stochasticity not yet measured. The deterministic column is exact/reproducible. *(Addressed below.)*
- **Blind subagents given a focused prompt** (protocol + prose). The real Step 5.5 also has the whole
  SPEC, the AskUserQuestion loop, and a Round-4 Failure-Analyst warm start — could be better or noisier.
- **GT is conservative**, which *understates* LLM precision (its phantoms are mostly defensible) and is
  fair-to-harsh on the engine (its adjacency phantom is genuinely spurious).

---

# Floor run: 3 model tiers × 3 reps (replacing the best-case upper bound)

**Date:** 2026-06-04 · `analyze-floor.mjs`, `llm-runs/floor/*.json`, `floor-results.tsv`. **Method:**
the same blind protocol and corpus, run **haiku / sonnet / opus, 3 reps each** (9 runs), scored vs the
same ground truth. Answers the n=1 / best-case / no-variance gap.

| metric (lower better for under-fire) | deterministic | haiku ×3 | sonnet ×3 | opus ×3 |
|---|---|---|---|---|
| relevance precision | 58% | 80% [75–86] | **83% [83–83]** | 74% [70–82] |
| under-fire (applicable missed) | 48% | **41% [34–48]** | 14% [14–14] | 8% [7–10] |
| recall — vibe | 44% | 60% [50–69] | 88% | 94% |
| recall — mid | 40% | 60% [47–67] | 87% | 93% |
| recall — senior | 50% | 72% [33–100] | 100% | 100% |

**Verdict: the improvement is real and stable from sonnet up — but there is a model floor at
haiku.** Three reads:

1. **Sonnet and opus both clearly beat the deterministic engine on every axis, with low variance.**
   Sonnet is the standout: identical across all 3 reps (83% precision / 14% under-fire / 88–100%
   recall) and the best *balanced* point. The recall win (the whole value proposition, per the cost
   asymmetry) lands hard: under-fire 48% → 14% (sonnet) / 8% (opus). This is no longer a best-case
   artifact — a mid-tier, widely-used spec-phase model reproduces it stably.
2. **Haiku is the honest caveat.** It improves *precision* (80% vs 58%) but its **under-fire (41%,
   worst rep 48%) is statistically indistinguishable from the keyword engine's 48%** — it does *not*
   close the recall gap that is the point of the feature, and its recall is both lower (60%) and
   high-variance (senior recall swung 33%→100% across reps). On a haiku-class model the LLM-assist
   degrades toward "keyword-with-fewer-phantoms."
3. **Precision/recall trade across tiers, and it favors the cost-asymmetry argument.** Opus raises the
   most edges (best recall 94/93/100, but precision dips to 74% as it surfaces more — many of which the
   conservative GT under-labels). Sonnet sits at the balanced optimum. The cheaper the model, the more
   it reverts to under-firing.

**Design consequence (feeds the policy seam):** the LLM-assisted classifier is worth it on a
**sonnet-class model or better**; on a haiku-class model it should fall back to (or run alongside) the
keyword heuristic, because it buys precision but not the recall that justifies the feature. The
abstention/fallback policy should therefore be **model-aware**, not just no-model-aware. This also
directly prices the relevance-hallucination concern: over-fire did *not* explode at the weak tier
(haiku precision was actually fine) — the weak-tier failure is **silent under-fire**, the same failure
the keyword engine has, which the fallback already covers.

**Variance note (answering "n=1 gives no variance"):** sonnet has zero variance on precision/under-fire
across 3 reps; opus mild (precision 70–82%); haiku is the only high-variance tier. So the headline
sonnet/opus improvement is stable, and the instability is concentrated exactly where the capability is
weakest (haiku) — consistent with a model floor rather than noise around a single mean.

---

# Test A — generalization (fresh 6-spec corpus)

**Date:** 2026-06-04 · `analyze-gen2.mjs`, `specs2/*`. A second corpus of *different* app features
(discount-cart, username-availability, meeting-timezone, leaderboard, password-reset-expiry,
comment-threading), same protocol, 1 rep/tier — to check the pattern isn't an artifact of the first 7.

| metric | deterministic | haiku ×1 | sonnet ×1 |
|---|---|---|---|
| precision | 44% | 79% | 80% |
| under-fire | **79%** | 21% | 16% |
| recall (vibe/mid/senior) | 27/27/20% | 91/91/80% | 91/91/80% |

**Replicates the core finding, and corrects one overclaim:**
- **The deterministic engine is even worse here** (44% precision, **79%** under-fire) — these features
  are more stateful/terse, so the regex goes silent more often. The keyword brittleness is not
  corpus-specific.
- **Sonnet's decisive win replicates** (80% / 16% / 91%), matching its original-corpus numbers — the
  strongest, most robust result.
- **Haiku does NOT replicate its weakness** — here it's ~sonnet-level (79% / 21% / 91%), vs the original
  corpus where it was 80% / 41% / 60%. **Correction:** the earlier "haiku has a consistent model floor"
  read was too strong. The honest statement is **haiku is high-variance / corpus-sensitive** — strong
  on gen2, weak-and-unstable on the original — so it's *unreliable*, not *consistently floored*. Sonnet
  is the dependable tier on both corpora; the model-aware fallback argument stands, but on
  *reliability* grounds, not a fixed haiku ceiling.

# Test B — phantom adjudication (is LLM over-fire real, or hallucination?)

**Date:** 2026-06-04 · `prep-adjudication.mjs`, `adjudication-{items,key,verdicts}.json`. A blind judge
(separate agent, source-blinded, shuffled) rated each phantom — every edge raised on the original
corpus that my ground truth marked *inapplicable* — as genuinely-applies or spurious. Tests the
load-bearing interpretive claim (LLM phantoms are defensible; the engine's are spurious) and trek-e's
relevance-hallucination concern, with data instead of assertion.

| source of the phantom | judged "genuinely applies" |
|---|---|
| **sonnet** (LLM over-fire) | **5 / 5 = 100%** |
| **deterministic engine** | 7 / 11 = 64% |

- **Sonnet's over-fire is not hallucination — it's 100% real edges my GT under-labeled** (parallel
  uploads, price-range boundary, pagination off-by-one, CSV row-order, concurrent export). So sonnet's
  *true* precision is ~100%; the apparent 83% was entirely ground-truth conservatism. This is the direct,
  measured answer to the relevance-hallucination concern: at sonnet, the extra raises are correct, not
  confident noise.
- **The engine's spurious phantoms (4 of 11) are exactly the keyword artifacts** — `adjacency` and
  `ordering` raised on scalar division and text search (bill-split, search R1), triggered by the words
  "each"/"list". The judge's reasons name it: *"scalar division has no spatial/boundary touching."* So
  the genuinely-spurious over-fire is a property of the keyword mechanism specifically.
- **Caveat:** the judge was an Opus agent (strong, but it judged both sources by one standard — the
  comparison is relative). And my GT being conservative means the *absolute* precision figures
  throughout understate both classifiers; the *relative* and *recall* stories are unaffected.

# Test C — prompt recall-priming (self-confound check)

**Date:** 2026-06-04 · `llm-runs/neutral/`. The headline LLM prompt included a recall nudge ("raise
every category that DOES apply, including non-obvious edges implied even if the prose is terse"). That
could manufacture the recall win. Re-ran sonnet (×2) on the original corpus with a **neutral prompt**
(no nudge; faithful to `edge-probe.md`'s own wording — classify shape, raise intersecting categories).

| sonnet variant | precision | under-fire | recall (v/m/s) |
|---|---|---|---|
| primed (recall nudge) | 83% | 14% | 88/87/100% |
| neutral rep1 | 70% | 10% | 88/87/100% |
| neutral rep2 | 75% | 17% | 88/87/100% |

**The recall recovery is prompt-robust** — under-fire and recall are essentially identical with no nudge
(recall byte-identical at 88/87/100%). The win is the model's classification, not the prompt coaching.
(If anything the nudge slightly *raised* precision — fewer phantoms — not recall.) This neutralizes the
most damaging confound to the headline, and the neutral prompt is also the more faithful proxy for what
a real Step 5.5 LLM would receive.

# Test D — end-to-end of the PROPOSED pipeline (LLM shapes → engine), and what it broke

**Date:** 2026-06-04 · `analyze-pipeline.mjs`, `llm-runs/shapes/`. Every prior run scored the LLM
picking *categories* directly. The v2 #652 proposal is different: the LLM infers *shapes*, the
deterministic engine maps shapes→categories (so the engine stays unchanged). This tests that actual
pipeline — sonnet infers shapes only, fed into the real `edge-probe.cjs`.

| path | precision | under-fire | recall (v/m/s) |
|---|---|---|---|
| deterministic (regex shapes → engine) | 58% | 48% | 44/40/50% |
| **LLM shapes → engine** (rep1 / rep2) | 64% | 21% / 14% | 69–81 / 67–80 / **67%** |
| LLM picks categories directly (ref) | 83% | 14% | 88/87/**100%** |

**Finding: the proposed "LLM→shapes→engine" architecture is a real improvement over deterministic, but
materially worse than letting the LLM pick categories directly — and the gap is structural, not noise.**
The 5-shape→8-category table is a lossy bottleneck:

- **csv-export:** sonnet inferred shapes `collection, io` (reasonable) → engine maps to
  adjacency/empty/ordering/concurrency but **never `encoding`** (encoding requires the `text` shape).
  So the *canonical CSV escaping edge is unreachable* through the pipeline, even though the LLM raises
  it instantly when asked for categories directly.
- **profile-pic-upload:** shapes `io, stateful` → only `concurrency`; `encoding`/`boundary` (filename,
  size) unreachable.
- **login-session:** shape `stateful` → idempotency/concurrency but **not `boundary`** (the
  expiry-instant edge needs `numeric-range`, which "session expires" prose didn't trigger).

Senior recall caps at **67%** precisely because the highest-value cross-tier edges (encoding, expiry
boundary) live behind a shape the LLM didn't assign. **The shape abstraction throws away signal the LLM
has.** Design consequence: the v2 proposal's "populate `shapes`, leave the engine unchanged" framing is
the *weaker* architecture; a taxonomy-constrained **LLM-proposes-categories** design (engine validates
/ structures, but does not gate classification through 5 shapes) is what actually delivers — and that is
a deeper change to the probe contract than "swap the classifier." This directly informs the worth-it
call below.
