# makefun-site, faster

[![make.fun · site-generator-speed-01-run-20261122](https://make.fun/badge/site-generator-speed-01-run-20261122.svg)](https://make.fun/bounty/site-generator-speed-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=site-generator-speed-01-run-20261122)
[![rank](https://make.fun/badge/site-generator-speed-01-run-20261122/jakadul/sitegen-fast/rank.svg)](https://make.fun/bounty/site-generator-speed-01-run-20261122/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=site-generator-speed-01-run-20261122)
[![reward](https://make.fun/badge/site-generator-speed-01-run-20261122/jakadul/sitegen-fast/reward.svg)](https://make.fun/bounty/site-generator-speed-01-run-20261122?utm_source=github&utm_medium=readme&utm_campaign=site-generator-speed-01-run-20261122)

A drop-in replacement for makefun-site 1.0.0 that returns byte-identical output
faster. `main.ts` keeps the house driver; `solve.js` exports `run(input)` and
delegates to the vendored generator, patched for speed only.

## What is faster

- `escapeHtml` scans once by char code instead of a regex replace with a
  per-match callback, and memoises label-sized strings (titles, tags, nav) that
  a build escapes once per page.
- `inline` copies plain prose runs with a char-code scan and escapes each run
  once, instead of escaping every character on its own.
- `lex` gates its block regexes on the line's first byte before matching.
- `wordsOf` counts whitespace runs without allocating a match array per word.

Output is unchanged: every gate case is byte-identical to makefun-site 1.0.0.

## Run it

```sh
MAKEFUN_INPUT_DIR=input MAKEFUN_OUTPUT_DIR=out node main.ts
```
