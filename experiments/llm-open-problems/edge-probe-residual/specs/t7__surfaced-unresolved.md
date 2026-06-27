# Spec — `bold(text)`

Apply Markdown bold formatting to text.

## must_haves
1. Export a named function `bold(text)`.
2. Return the text with Markdown bold markers applied: the result must be surrounded by `**` delimiters (`**text**`).

## visible test cases
- `bold('hello')` → `'**hello**'`
- `bold('hello world')` → `'**hello world**'`

## Spec-completeness probe — UNRESOLVED edges
A completeness probe flagged these applicable edges as NOT determined by the spec above:
- **empty** (unresolved): What is the result for empty, single-element, or null input?
- **encoding** (unresolved): Whose definition of length/equality applies — bytes, code points, grapheme clusters, or normalized form?
