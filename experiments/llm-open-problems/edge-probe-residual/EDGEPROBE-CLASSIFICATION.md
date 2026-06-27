# Edge-Probe HIT/MISS Classification — Task B New Tasks

**Produced:** 2026-06-26
**Binary:** `/home/dave/repos/gsd-core/gsd-core/bin/lib/edge-probe.cjs`
**Method:** Run the deployed tagger on each new task's narrow-spec requirements; classify HIT if the category containing the NI edge appears AND the probe specifically hints at the NI edge; otherwise MISS.

---

## t6 — null-vs-absent (`defaults`)

**NI edge:** A key present in `target` with value `null` is PRESENT and must NOT be overridden.
**NI edge category:** `empty`
**Requirements fed to tagger:**

```json
[{"id":"R1","text":"Export a named function defaults(target, fallback). For each key in fallback that is not present in target, copy it to the result. Return a new object without mutating either input."}]
```

**Verbatim tagger output:**

```json
{
  "items": [
    {
      "requirement_id": "R1",
      "category": "adjacency",
      "status": "unresolved",
      "verification": null,
      "resolution": null,
      "reason": null,
      "probe": "When two things are exactly equal or just touch, do they merge, collide, or separate?"
    },
    {
      "requirement_id": "R1",
      "category": "empty",
      "status": "unresolved",
      "verification": null,
      "resolution": null,
      "reason": null,
      "probe": "What is the result for empty, single-element, or null input?"
    },
    {
      "requirement_id": "R1",
      "category": "ordering",
      "status": "unresolved",
      "verification": null,
      "resolution": null,
      "reason": null,
      "probe": "When elements compare equal, is output order specified and stable?"
    }
  ],
  "coverage": {
    "applicable": 3,
    "resolved": 0,
    "unresolved": 3,
    "byVerification": { "explicit": 0, "backstop": 0 }
  }
}
```

**Classification:** MISS

**Rationale:** The `empty` probe fires (category present). However, the probe text asks "What is the result for empty, single-element, or null input?" — this prompts verifiers to consider `defaults(null, fallback)` or `defaults({}, fallback)`, NOT `defaults({a: null}, fallback)` where the target is a non-null object containing a null-valued property. The NI edge is the distinction between a null-valued KEY (which is present in the object per `'a' in {a:null} === true`) and an absent KEY. A verifier reading the `empty` probe would think about null/empty target inputs, not null-valued properties within a non-null target. The probe is too generic to hint at the specific null-property-preservation rule. Verdict: **MISS** (category present but probe does not hint the specific NI edge).

---

## t7 — idempotency/text-wrap (`bold`)

**NI edge:** Applying bold to already-bold text must return it unchanged (idempotency: `bold('**hello**') → '**hello**'`).
**NI edge category:** `idempotency`
**Requirements fed to tagger:**

```json
[{"id":"R1","text":"Export a named function bold(text). Return the text with Markdown bold markers applied: the result must be surrounded by ** delimiters (**text**)."}]
```

**Verbatim tagger output:**

```json
{
  "items": [
    {
      "requirement_id": "R1",
      "category": "empty",
      "status": "unresolved",
      "verification": null,
      "resolution": null,
      "reason": null,
      "probe": "What is the result for empty, single-element, or null input?"
    },
    {
      "requirement_id": "R1",
      "category": "encoding",
      "status": "unresolved",
      "verification": null,
      "resolution": null,
      "reason": null,
      "probe": "Whose definition of length/equality applies — bytes, code points, grapheme clusters, or normalized form?"
    }
  ],
  "coverage": {
    "applicable": 2,
    "resolved": 0,
    "unresolved": 2,
    "byVerification": { "explicit": 0, "backstop": 0 }
  }
}
```

**Classification:** COMPLETE MISS

**Rationale:** The `idempotency` probe is entirely absent from the tagger output. This is the COMPLETE MISS case confirmed in the research: the deployed edge-probe.cjs only fires the `idempotency` probe for requirements that trigger `stateful` shape (keywords: save, persist, store, update, toggle, create, delete). A pure text-transformation function (`bold(text)`) triggers `text` shape only, producing `empty` + `encoding` probes — neither of which hints at double-wrap idempotency. A verifier reading the surfaced-unresolved spec for t7 sees only probes about empty input and encoding/normalization, which are red herrings for the idempotency edge. Verdict: **COMPLETE MISS** (NI edge category absent from tagger output entirely).

---

## ≥3 MISS-Eligible Categories Check

| Task | Category | Classification | Source |
|------|----------|---------------|--------|
| t3   | precision/tie | MISS | Existing; locked from v4-faithful-read run (Math.round is half-up; correct is half-to-even; old probe did not name tie-breaking explicitly) |
| t6   | null-vs-absent (empty) | **MISS** | This run; empty probe too generic (null INPUT vs null-valued PROPERTY) |
| t7   | idempotency-textwrap | **COMPLETE MISS** | This run; idempotency probe absent for text-shape functions |

**MISS-eligible set size:** 3 (distinct tasks: t3, t6, t7)
**Requirement (≥3 MISS-eligible):** SATISFIED
**Contingency t8:** NOT authored (t6 classifies MISS, so the set {t3,t6,t7}=3 satisfies the requirement without t8)

---

MISS-ELIGIBLE-SET: t3,t6,t7
