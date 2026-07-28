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

## Detailed description

Better USACO makes usaco.org easier to read and easier to practice on — without changing a thing about how the site works.

If you spend your evenings on Bronze problems or your weekends on Platinum editorials, this is the extension that stops the site from fighting you: a real dark theme, sample cases you can copy in one click, and editorials that don't render as Times New Roman stretched across your whole monitor.

WHAT YOU GET

- A full dark theme for every part of usaco.org
- Contrast, grayscale, and invert sliders
- A floating toggle button for instant light/dark switching
- Copy buttons on every sample input and output
- Editorial pages rebuilt with a readable layout and working syntax highlighting
- An optional spoiler guard that hides only the code, never the write-up
- Settings that save automatically and sync across your devices

DARK MODE
A complete dark theme for problem statements, contest results, and the training archive. A floating button in the corner of the page toggles it instantly, and the contrast, grayscale, and invert sliders let you tune the page to your screen and your lighting.

SAMPLE INPUT/OUTPUT YOU CAN ACTUALLY COPY
Sample cases are laid out in clean, bordered boxes with a copy button on each one. Getting a test case into your editor is a single click instead of a careful drag-select that picks up half the paragraph above it.

SOLUTION PAGES, REBUILT
USACO publishes its editorials as bare HTML with no stylesheet at all, and the syntax highlighter they link to has been offline since the service it depended on shut down in 2016 — so the code blocks have never actually been highlighted. Better USACO rebuilds those pages in your browser:

- A centered, comfortably sized reading column with proper typography, in light or dark
- Real syntax highlighting for C++, Java, and Python, with a copy button on every code block
- A header showing which problem and contest you are reading, plus a link back to the problem list
- A meaningful browser tab title, instead of "Contest Results" on every single editorial
- An optional spoiler guard that blurs only the code, never the write-up — so you can read the approach and then decide for yourself whether to look at the implementation. Each code block reveals on its own click. This is off by default.

EVERYTHING IS OPTIONAL
Dark mode, styled sample boxes, styled solution pages, and the spoiler guard each have their own switch in the popup, and the whole extension has a master on/off. Turn off what you don't want and the original page comes back exactly as it was.

PRIVACY
Better USACO collects nothing, sends nothing, and has no servers or analytics. It makes no network requests of its own — the logo images it uses are bundled with the extension, and the editorial back link is derived from the page's own address rather than looked up. It runs only on usaco.org; no other site is touched. Your settings are stored with Chrome's own storage so they follow you across devices, and that is the only data involved.

Not affiliated with or endorsed by the USA Computing Olympiad.
