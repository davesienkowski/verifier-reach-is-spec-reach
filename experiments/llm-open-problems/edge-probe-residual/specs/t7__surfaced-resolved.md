# Spec — `bold(text)`

Apply Markdown bold formatting to text.

## must_haves
1. Export a named function `bold(text)`.
2. Return the text with Markdown bold markers applied: the result must be surrounded by `**` delimiters (`**text**`).

## visible test cases
- `bold('hello')` → `'**hello**'`
- `bold('hello world')` → `'**hello world**'`

## must_haves (additional, resolved edge)
ACCEPTANCE (resolved idempotency edge): `bold()` must be idempotent — `bold('**hello**')` MUST return `'**hello**'`, not `'****hello****'`.
