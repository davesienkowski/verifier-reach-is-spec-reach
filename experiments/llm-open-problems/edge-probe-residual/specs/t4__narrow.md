# Spec — `truncate(str, max)`

Truncate a string to at most `max` characters.

## must_haves
1. Export a named function `truncate(str, max)` returning a string.
2. If the input has `max` characters or fewer, return it unchanged.
3. If longer, return only the first `max` characters.
4. Coerce non-string input to a string first.

## visible test cases
- `truncate('hello world', 5) === 'hello'`
- `truncate('hi', 5) === 'hi'`
