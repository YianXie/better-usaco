# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A Manifest V3 Chrome extension ("Better USACO") that applies a dark theme and CSS filters (contrast/grayscale/invert) to https://usaco.org. Plain JS/CSS/HTML — no build step, no bundler, no framework, no tests.

## Commands

```bash
npm install                 # installs prettier (the only dependency)
npx prettier --write .      # format
npx prettier --check .      # verify formatting
```

There is no `scripts` section in package.json, no test runner, and no lint config beyond Prettier (`.prettierrc`: 4-space tabs, double quotes, semicolons, es5 trailing commas).

### Manual testing loop

Load unpacked from the repo root at `chrome://extensions/` (Developer mode on). After editing `src/`, click refresh on the extension card, then reload the usaco.org page. Changes to `styles.css`/`content.js` require both; popup-only changes just need reopening the popup.

## Architecture

Two independent scripts talk over `chrome.runtime` messaging; there is **no background service worker**.

- [src/content.js](src/content.js) — injected at `document_start` on `https://usaco.org/*`. Owns a module-level `settings` object, applies `document.documentElement.style.filter` for the CSS filters, toggles the `.usaco-dark-mode` class on `<html>`, creates the floating toggle button (bottom-left, inline-styled, id `usaco-dark-toggle`), and restructures the sample I/O blocks (see below).
- [src/solution.js](src/solution.js) — injected alongside `content.js` and handles editorial pages only (see below). Content scripts from one extension share a single isolated world, so the two files share globals: `solution.js` calls `createCopyButton()` from `content.js`, and `content.js` calls `enhanceSolutionPage()` / `removeSolutionEnhancements()` from `applyStyles()` / `removeStyles()`. Because of that shared scope, **top-level `const`/`let` names must not collide between the two files** — a duplicate declaration is a `SyntaxError` that kills both scripts.
- [src/popup.js](src/popup.js) — the settings UI. Writes to `chrome.storage.sync`, then sends `{action: "updateSettings", ...settings}` to the active tab (only when its URL contains `usaco.org`).
- [src/styles.css](src/styles.css) — the dark theme, injected declaratively via the manifest's `content_scripts.css`. Every rule is scoped under `.usaco-dark-mode` and uses `!important` to beat USACO's inline/legacy styles. Colors come from the `:root` custom properties at the top of the file — change those rather than hardcoding hex values in new rules.
- [src/solution.css](src/solution.css) — editorial-page styles, injected **after** `styles.css` so equal-specificity rules win on source order. Scoped under `html.busaco-solution-page` (a class `solution.js` adds) rather than under `.usaco-dark-mode`, because editorial pages have no stylesheet of their own and need the light theme too; colors come from the `--sol-*` properties, defined twice (`:root` for light, `html.usaco-dark-mode` for dark).
- [src/popup.css](src/popup.css) — styles the popup only; unrelated to the injected theme.

### Things that must stay in sync

- **Settings keys and defaults are duplicated** in `content.js` (`settings` literal + `loadSettings` + the `updateSettings` message handler) and `popup.js` (`loadSettings` + `saveSettings`). Adding a setting means touching both, plus the corresponding `<input>` in [src/popup.html](src/popup.html), the `elements` map in `popup.js` (looked up by id at module load — an id mismatch silently yields `null`), and a `change`/`input` listener. Current keys: `enabled`, `darkMode`, `enhancedSamples`, `styledSolutions`, `spoilerGuard`, `contrast`, `grayscale`, `invert`.
- **`manifest.json` holds the version**; `package.json` has none. Bump `manifest.json` when releasing.

### Notable behaviors

- **Submission language memory** (`setupLanguageMemory` in `content.js`): finds the submit form's language `<select>` by its options (Python plus Java or C++), skipping the translation dropdown `#choose-language`, which is also named "lang" and navigates on change, restores `chrome.storage.sync.preferredLanguage` on load (matching option text first, value second), and saves on user change. It also writes the dropdown's options to `chrome.storage.local.submissionLanguages`, which the popup's "Submission Language" `<select>` is built from (the popup can't see the submit form), and listens on `chrome.storage.onChanged` so a popup choice applies to an open page. The popup writes `preferredLanguage` directly (or removes it for "Don't preselect"), outside `saveSettings`, so it is not in the duplicated settings keys above.

- `styleElement` is created and removed by `applyStyles`/`removeStyles` but nothing ever writes rules into it — the actual theme is the manifest-injected `styles.css`. Disabling the extension works by removing the `.usaco-dark-mode` class and the inline filter.
- A `MutationObserver` on the whole document watches for `location.href` changes and re-applies styles / recreates the toggle button after 100 ms.
- **Sample I/O boxes.** `enhanceSamples()` moves each input/output pair into a `div.busaco-sample` with a header row (the original `<h4>`, minus its trailing colon, plus a copy button) per section. `removeSampleEnhancements()` moves the original nodes back out, restoring the `<h4>` text from `data-busaco-text` — this is what the `enhancedSamples` setting toggles, and it also runs when the extension is disabled. Both are idempotent, so the navigation `MutationObserver` can re-run them freely.
- **What moves into the box is a contiguous run of siblings, not just the `<h4>` and `<pre>`.** `enhanceSamples()` records every node from the group's first heading through its last `<pre>` on the container as `container.busacoOriginals`, moves the leftovers (whitespace) in after the sections, and `removeSampleEnhancements()` reinserts that recorded list in order. Moving only the pair leaves the whitespace between them behind, and putting the pair back at the container's position then reinserts it _in front of_ that whitespace — shifting the statement's whitespace a little on every toggle. `collectSampleBlocks()` and `groupSampleBlocks()` both refuse to span anything but whitespace, which is what makes relocating the run safe.
- **Statements come in three markup eras**, and all three must produce boxes. Verify any change to this code against all three (a spot-check set: cpid 226 and 493 legacy, 529 transitional, 600 modern):
    1. **Modern** (`div#probtext-text.mathjax`, cpid ≳540): flat siblings `<h4>SAMPLE INPUT:</h4><pre class="in">` then `<h4>SAMPLE OUTPUT:</h4><pre class="out">`, adjacent, so they group into one box.
    2. **Transitional** (2015, cpid ~520–540): the same `<h4>` + `<pre>` pair but with **no `in`/`out` class**. `collectSampleBlocks()` therefore keys off the `<h4>` text and takes its `nextElementSibling`; keying off `pre.in, pre.out` silently misses this whole era. The kind comes from the heading, not the class.
    3. **Legacy** (`span#probtext-text.mono.prewrap`, pre-2015): no sample markup at all — the entire statement is one plain text node, with samples marked only by a `SAMPLE INPUT (file x.in):` line followed by a blank line and the data, terminated by the next blank line. `normalizeLegacySamples()` splits that text node and synthesizes era-1 markup so the rest of the pipeline needs no special case; `denormalizeLegacySamples()` reverses it. Input and output are **not** adjacent here (prose sits between them), so each gets its own box.
- `normalizeLegacySamples()` stores on every element it synthesizes the exact source text that element replaced, in `data-busaco-legacy`; undoing is just "replace each such element with a text node of that attribute, then `normalize()` the parent". Keep that invariant — it is what makes the restore character-exact, and the sample data is deliberately held twice (in the `<pre>` and in the attribute) to get it.
- `groupSampleBlocks()` merges an input with a following output only when `onlyWhitespaceBetween()` says nothing but whitespace separates them. `nextElementSibling` alone is **not** sufficient: on legacy pages the two `<pre>`s are each other's nearest elements but have paragraphs of prose between them, and grouping them would strand that prose outside the box.
- The sample-box rules in `styles.css` are the only ones **not** scoped under `.usaco-dark-mode` — they apply in light mode too, taking their colors from `--sample-*` custom properties defined twice (`:root` for light, `html.usaco-dark-mode` for dark). Their selectors carry an extra tag qualifier (`div.busaco-sample`, `div.busaco-sample pre`, `.busaco-sample button.busaco-copy-button`) so they outrank the broad `.usaco-dark-mode *` / `pre` / `button` rules on specificity rather than source order. The sample `<pre>` is matched by position inside the box, not by an `in`/`out` class, because era-2 and era-3 statements have none.
- **Solution (editorial) pages.** `https://usaco.org/current/data/sol_*.html` are raw HTML: no stylesheet at all (Times New Roman, full window width), and their syntax highlighter is loaded from `google-code-prettify.googlecode.com`, dead since Google Code shut down in 2016 — so `<pre class="prettyprint">` has never actually been highlighted. `enhanceSolutionPage()` moves every body node into `div.busaco-solution > article.busaco-solution-body` (nodes are **moved**, not cloned, so MathJax's references survive), skipping scripts, MathJax's own divs and the floating toggle button. Two settings drive it: `styledSolutions` and `spoilerGuard`.
    - **Only `pre.prettyprint` is code.** Bare `<pre>` on these pages holds ASCII diagrams and sample data, and must never be tokenized.
    - `detectLanguage()` scores C++/Java/Python signals and returns `null` below a threshold, leaving the block unhighlighted. It scores rather than first-matches because snippets are genuinely ambiguous — `init = B // cB * cA + A` is Python integer division that a greedy `//` rule would turn into a C++ comment.
    - `highlightCode()` must stay a **pure re-wrapping of the source**: it only wraps text in spans, never adding or dropping a character. `unwrapCodeBlock()` restores the original by reading `pre.textContent` back, and the copy button relies on the same invariant, so verify `tokenizeCode(src, lang).map(t => t.text).join("") === src` after any tokenizer change.
    - **The `spoilerGuard` covers code blocks only, never the prose** — opening an editorial is already a decision to read the approach; the implementation is the part worth holding back. Each `div.busaco-code` is blurred and height-capped independently and reveals on its own click; `revealedCodeBlocks` (a `WeakSet` of wrappers) keeps a re-run of `applyStyles()` from hiding one again. The copy button is hidden while a block is guarded, since copying is revealing.
    - The header's back link is derived from the filename alone: the contest token is also the results-page slug (`sol_prob1_bronze_season26contest1.html` → `index.php?page=season26contest1results`), so no request is needed. Both the `sol_prob<N>_` and older `sol_<name>_` filename forms parse.
- `applyStyles` also swaps specific USACO logo images for transparent-background versions bundled under `src/assets/images/` (declared in the manifest's `web_accessible_resources`); new replacements go in the `LOGO_REPLACEMENTS` map. **Match on the path, never on the full `src`.** USACO writes those images as page-relative URLs (`current/images/usaco_logo.png`), so the absolute `src` depends on the directory the page is served from: `usaco.org/index.php` resolves them under `/current/`, while `usaco.org/current/index.php` — where problem pages and everything linked from them live — resolves them under `/current/current/`, and the server serves either. `logoReplacementFor()` collapses the repeated `current/` segments before the lookup.

## Docs

[docs/privacy.md](docs/privacy.md) is the published privacy policy and asserts the extension collects and transmits **no** data and stores settings only in `chrome.storage`. Any change that adds network requests, analytics, or new permissions must be reflected there and in `manifest.json`'s permission list.
