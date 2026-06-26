# Task 03 — `truncate(str, max)`

Truncate a string to at most `max` characters.

## must_haves
1. Export a named function `truncate(str, max)` returning a string.
2. If the input has `max` characters or fewer, return it unchanged.
3. If longer, return only the first `max` characters.
4. Coerce non-string input to a string first.

> The spec intentionally does NOT define "character" precisely. Whether a "character" is a UTF-16
> code unit or a user-perceived grapheme (so an emoji / combining sequence is never split) is the
> non-inferable edge — see `../../README.md`.

## visible test cases (the executor ran these)
- `truncate('hello world', 5) === 'hello'`
- `truncate('hi', 5) === 'hi'`
