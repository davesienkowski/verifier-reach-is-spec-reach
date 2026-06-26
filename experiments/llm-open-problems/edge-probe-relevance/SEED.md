# Seed: run edge-probe-relevance before growing the taxonomy

**Planted:** 2026-06-03 · **Status:** dormant — waiting on trigger

## Trigger condition

**Before extending the closed 8-category edge-probe taxonomy with any domain-specific edge "pack"** —
i.e. the growth path #550 names in its own maintenance-burden section ("domain-specific edges grow via
optional packs, not core bloat").

> Secondary trigger: before relying on `--auto` edge auto-resolution at scale across many real specs, if
> field reports of phantom edges surface first.

## Why this trigger (re-pointed 2026-06-03)

The original seed said *"run the relevance measurement before the edge-probe merges — don't ship on an
unvalidated relevance filter."* **That trigger is overtaken by events:** PR #584 is MERGEABLE and at the
doorstep of merge, and none of the maintainer's blockers were about relevance precision. The probe is
shipping on the closed-taxonomy bet regardless, so a pre-merge gate is no longer the right frame.

The precision risk doesn't disappear — it **scales with taxonomy size**. A closed 8-category set with a
tight shape→category relevance filter is the regime most likely to be self-policing (the bet #550
makes). The moment that bet is most likely to break is when someone adds a domain pack: more categories,
looser applicability, more chances to fire an inapplicable edge and train authors to rubber-stamp
`dismissed`. So the high-value moment to *have already measured* relevance precision is **immediately
before the first taxonomy expansion**, not before the original merge.

## Action when triggered

Run [`DESIGN.md`](./DESIGN.md): measure relevance precision (false-positive edges per spec, vs the N18
2.2 bar) and persona-weighted blind-spot recall on the app-flavored corpus — **first on the shipped
closed taxonomy to establish the baseline**, then on the proposed pack. Gate the pack on not regressing
precision past the baseline.

## Links

- Experiment design: [`DESIGN.md`](./DESIGN.md)
- Rationale / before-after: [`MOTIVATION.md`](./MOTIVATION.md)
- Evidence: [`../noninferable-corpus/RESULTS.md`](../noninferable-corpus/RESULTS.md),
  [`../prohibition-elicitation/RESULTS.md`](../prohibition-elicitation/RESULTS.md)
- Feature: open-gsd/gsd-core #550, PR #584
