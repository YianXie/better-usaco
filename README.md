# Better USACO Chrome Extension

A Chrome extension that makes the USACO website (usaco.org) easier to read and easier to practice on: a dark theme with adjustable visual filters, sample cases you can copy in one click, and editorial pages rebuilt with a readable layout and working syntax highlighting.

## Features

- **Dark Mode**: Switch the USACO website to a comfortable dark theme
- **Visual Filters**: Adjustable contrast, grayscale, and invert filters for customizing appearance
- **Quick Toggle**: Floating button on the page for instant dark mode toggle
- **Sample I/O Boxes**: Sample input and output are laid out in bordered boxes with a copy button on each
- **Readable Solution Pages**: USACO's editorials ship as bare HTML with no styling at all — they get a centered reading column, real typography, and dark mode support
- **Syntax Highlighting**: C++, Java, and Python code in editorials is highlighted, with a copy button per block. (USACO's own highlighter has been broken since the service it loaded from shut down in 2016.)
- **Editorial Navigation**: A header showing which problem and contest you're reading, a link back to the problem list, and a browser tab title that isn't "Contest Results" on every page
- **Spoiler Guard**: Optionally blur only the code in an editorial, never the write-up, so you can read the approach and decide separately whether to see the implementation (off by default)
- **Settings Persistence**: Your preferences are saved automatically and persist across sessions
- **Real-time Updates**: Changes apply immediately without page reload
- **Non-intrusive**: Works seamlessly without modifying the original website

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the `better-usaco` folder
6. The extension is now installed and active!

### Extension Icons

Icons are included in the `icons/` directory at the three sizes Chrome asks for: `icon16.png`, `icon48.png`, and `icon128.png`.

## Usage

### Accessing Settings

1. Click the extension icon in your Chrome toolbar
2. The popup will open with all available settings

### Settings Options

- **Enable Extension**: Toggle the extension on/off globally
- **Dark Mode**: Switch between light and dark themes (default: off)
- **Styled Sample I/O**: Bordered sample boxes with copy buttons; off uses the original USACO style (default: on)
- **Styled Solutions**: Readable layout and syntax highlighting on editorial pages (default: on)
- **Spoiler Guard**: Blur solution code until you reveal it (default: off)
- **Contrast**: Adjust contrast level (0-200%, default: 100%)
- **Grayscale**: Convert colors to grayscale (0-100%, default: 0%)
- **Invert**: Invert colors (0-100%, default: 0%)

### Quick Toggle Button

A floating toggle button appears in the bottom-left corner of USACO pages. Click it to quickly toggle dark mode on/off without opening the settings popup.

## How It Works

- **Content Script**: Injects styles and applies filters to the USACO website
- **CSS Filters**: Uses CSS `filter` property for contrast, grayscale, and invert adjustments
- **Dark Mode Styles**: Applies comprehensive dark mode CSS overrides
- **Sample Restructuring**: Regroups USACO's flat `<h4>` + `<pre>` sample markup into bordered boxes, and puts the original nodes back when the setting is turned off
- **Editorial Rebuild**: On `current/data/sol_*.html`, moves the page into a reading column and tokenizes `<pre class="prettyprint">` with a bundled highlighter. Highlighting only wraps the source in spans, so the copy button always yields the original code untouched.
- **Message Passing**: Communicates between popup and content script for real-time updates
- **Storage API**: Saves preferences using Chrome's storage API

Everything runs locally. The extension makes no network requests of its own — the logo replacements are bundled with it, and the editorial back link is derived from the page's own filename rather than looked up. See [docs/privacy.md](docs/privacy.md).

## File Structure

```
better-usaco/
├── manifest.json          # Extension manifest (Manifest V3), and the version number
├── src/
│   ├── content.js         # Dark mode, filters, toggle button, sample I/O boxes
│   ├── solution.js        # Editorial page layout, back link, syntax highlighter
│   ├── solution.css       # Editorial page styles (light and dark)
│   ├── styles.css         # Dark mode CSS for the rest of usaco.org
│   ├── popup.html         # Settings popup UI
│   ├── popup.js           # Popup logic and event handlers
│   ├── popup.css          # Popup styling
│   └── assets/images/     # Bundled transparent-background logo replacements
├── docs/
│   ├── privacy.md         # Published privacy policy
│   └── store-listing.md   # Chrome Web Store listing copy
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file
```

## Permissions

This extension requires the following permissions:

- `storage`: To save your preferences
- `https://usaco.org/*`: To run on and restyle USACO pages

## Browser Compatibility

- Chrome (Manifest V3)
- Edge (Chromium-based)
- Other Chromium-based browsers

## Development

### Prerequisites

- Chrome browser
- Basic knowledge of Chrome extensions

### Making Changes

1. Edit the source files in the `src/` directory
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload the USACO website to see changes

### Testing

Test the extension on various USACO pages:

- Homepage
- Problem pages (check the sample I/O boxes and their copy buttons)
- Contest results pages
- Training pages
- Solution pages, linked as "Solution" from any results page — try both the modern `sol_prob1_bronze_season26contest1.html` naming and the older `sol_maxflow_platinum_dec15.html` form, and check C++, Java, and Python blocks

After editing `src/`, click refresh on the extension card, then reload the USACO page. Popup-only changes just need reopening the popup.

## Troubleshooting

**Extension not working?**

- Make sure you're on a USACO website (usaco.org)
- Check that the extension is enabled in `chrome://extensions/`
- Try reloading the page

**Settings not saving?**

- Ensure Chrome sync is enabled (for sync storage)
- Check browser console for errors

**Toggle button not appearing?**

- Make sure the extension is enabled
- Try refreshing the page
- Check that you're on a USACO website

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

## License

This project is open source and available for personal and educational use.

## Acknowledgments

Inspired by [DocsAfterDark](https://github.com/waymondrang/docsafterdark), a similar extension for Google Docs.

## Version History

- **1.4.0** - Solution pages
    - Readable layout and typography for editorial pages, in light and dark
    - Syntax highlighting for C++, Java, and Python, with a copy button per code block
    - Header with problem/contest title, a link back to the problem list, and a real page title
    - Optional spoiler guard covering code blocks only
- **1.3.0** - Sample input/output copy buttons and styling improvements
- **1.2.1** - Removed unsafe features
- **1.2.0** - Renamed the project to "Better USACO"
- **1.1.0** - Main content background, and padding for `pre` and `code` blocks
- **1.0.0** - Initial release
    - Dark mode support
    - Contrast, grayscale, and invert filters
    - Quick toggle button
    - Settings persistence
