# Chrome Web Store listing

Source of truth for the store listing copy. The **short description** is the one
place this is enforced in code — it lives in `manifest.json`'s `description`
field and must stay under 132 characters. The **detailed description** below is
_not_ read from the repo: paste it into the Developer Dashboard (Store listing →
Description) when it changes here.

Keep this file, `manifest.json`'s `description`, and [privacy.md](privacy.md) in
agreement — the listing must not claim behavior the privacy policy rules out.

## Short description (manifest.json, 132 char limit)

```
Dark theme for usaco.org with adjustable filters, one-click sample copying, and readable, syntax-highlighted editorials.
```

## Detailed description (paste into the Developer Dashboard)

The store renders this as plain text, so it is written without Markdown.

```text
Better USACO makes usaco.org easier to read and easier to practice on, without changing a thing about how the site works.

DARK MODE
A full dark theme for every part of usaco.org — problem statements, contest results, and the training archive. A floating button in the corner of the page toggles it instantly, and contrast, grayscale, and invert sliders let you tune the page to your screen.

SAMPLE INPUT/OUTPUT YOU CAN ACTUALLY COPY
Sample cases are laid out in clean, bordered boxes with a copy button on each one, so getting a test case into your editor is a single click instead of a careful drag-select.

SOLUTION PAGES, REBUILT
USACO's editorials are published as bare HTML: no styling at all, so they render in Times New Roman stretched across your entire monitor, and their syntax highlighter has been broken since the service it depended on shut down in 2016. Better USACO rebuilds those pages in your browser:

- A centered, comfortably sized reading column with proper typography, in light or dark
- Real syntax highlighting for C++, Java, and Python, with a copy button on every code block
- A header showing which problem and contest you are reading, and a link back to the problem list
- A meaningful browser tab title, instead of "Contest Results" on every single editorial
- An optional spoiler guard that blurs only the code, never the write-up — so you can read the approach and decide for yourself whether to look at the implementation. Each code block reveals on its own click. This is off by default.

PRIVACY
Better USACO collects nothing, sends nothing, and has no servers or analytics. It makes no network requests of its own, and it runs only on usaco.org — no other site is touched. Your settings are stored with Chrome's own storage so they follow you across devices, and that is the only data involved.

Not affiliated with or endorsed by the USA Computing Olympiad.
```
