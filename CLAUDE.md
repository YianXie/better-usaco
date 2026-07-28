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

- [src/content.js](src/content.js) — injected at `document_start` on `https://usaco.org/*`. Owns a module-level `settings` object, applies `document.documentElement.style.filter` for the CSS filters, toggles the `.usaco-dark-mode` class on `<html>`, and creates the floating toggle button (bottom-left, inline-styled, id `usaco-dark-toggle`).
- [src/popup.js](src/popup.js) — the settings UI. Writes to `chrome.storage.sync`, then sends `{action: "updateSettings", ...settings}` to the active tab (only when its URL contains `usaco.org`).
- [src/styles.css](src/styles.css) — the dark theme, injected declaratively via the manifest's `content_scripts.css`. Every rule is scoped under `.usaco-dark-mode` and uses `!important` to beat USACO's inline/legacy styles. Colors come from the `:root` custom properties at the top of the file — change those rather than hardcoding hex values in new rules.
- [src/popup.css](src/popup.css) — styles the popup only; unrelated to the injected theme.

### Things that must stay in sync

- **Settings keys and defaults are duplicated** in `content.js` (`settings` literal + `loadSettings`) and `popup.js` (`loadSettings`). Adding a setting means touching both, plus the corresponding `<input>` in [src/popup.html](src/popup.html) and the `elements` map in `popup.js` (looked up by id at module load — an id mismatch silently yields `null`).
- **`manifest.json` holds the version**; `package.json` has none. Bump `manifest.json` when releasing.

### Notable behaviors

- `styleElement` is created and removed by `applyStyles`/`removeStyles` but nothing ever writes rules into it — the actual theme is the manifest-injected `styles.css`. Disabling the extension works by removing the `.usaco-dark-mode` class and the inline filter.
- A `MutationObserver` on the whole document watches for `location.href` changes and re-applies styles / recreates the toggle button after 100 ms.
- `applyStyles` also swaps specific USACO logo images (matched by exact `src` under `https://usaco.org/current/images/`) for transparent-background versions hosted on Cloudinary. New logo replacements go in that `switch`.

## Docs

[docs/privacy.md](docs/privacy.md) is the published privacy policy and asserts the extension collects and transmits **no** data and stores settings only in `chrome.storage`. Any change that adds network requests, analytics, or new permissions must be reflected there and in `manifest.json`'s permission list.
