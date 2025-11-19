# USACO Dark Mode Chrome Extension

A Chrome extension that enables dark mode and customizable visual filters for the USACO website (usaco.org). Transform your USACO browsing experience with a modern dark theme and adjustable contrast, grayscale, and invert filters.

## Features

- **Dark Mode**: Switch the USACO website to a comfortable dark theme
- **Visual Filters**: Adjustable contrast, grayscale, and invert filters for customizing appearance
- **Quick Toggle**: Floating button on the page for instant dark mode toggle
- **Settings Persistence**: Your preferences are saved automatically and persist across sessions
- **Real-time Updates**: Changes apply immediately without page reload
- **Non-intrusive**: Works seamlessly without modifying the original website

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the `dark-mode-usaco` folder
6. The extension is now installed and active!

### Extension Icons

The extension requires icons in the `icons/` directory:
- `icon16.png` (16x16 pixels)
- `icon48.png` (48x48 pixels)
- `icon128.png` (128x128 pixels)

You can create placeholder icons or use any 16x16, 48x48, and 128x128 pixel images for now.

## Usage

### Accessing Settings

1. Click the extension icon in your Chrome toolbar
2. The popup will open with all available settings

### Settings Options

- **Enable Extension**: Toggle the extension on/off globally
- **Dark Mode**: Switch between light and dark themes
- **Contrast**: Adjust contrast level (0-200%, default: 100%)
- **Grayscale**: Convert colors to grayscale (0-100%, default: 0%)
- **Invert**: Invert colors (0-100%, default: 0%)

### Quick Toggle Button

A floating toggle button appears in the bottom-left corner of USACO pages. Click it to quickly toggle dark mode on/off without opening the settings popup.

## How It Works

- **Content Script**: Injects styles and applies filters to the USACO website
- **CSS Filters**: Uses CSS `filter` property for contrast, grayscale, and invert adjustments
- **Dark Mode Styles**: Applies comprehensive dark mode CSS overrides
- **Message Passing**: Communicates between popup and content script for real-time updates
- **Storage API**: Saves preferences using Chrome's storage API

## File Structure

```
dark-mode-usaco/
├── manifest.json          # Extension manifest (Manifest V3)
├── src/
│   ├── content.js        # Content script for injecting styles/filters
│   ├── popup.html        # Settings popup UI
│   ├── popup.js          # Popup logic and event handlers
│   ├── popup.css         # Popup styling
│   └── styles.css        # Dark mode CSS for USACO site
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Permissions

This extension requires the following permissions:

- `storage`: To save your preferences
- `activeTab`: To access and modify the USACO website
- `https://usaco.org/*`: To run on USACO pages

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
- Problem pages
- Contest pages
- Training pages

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

- **1.0.0** - Initial release
  - Dark mode support
  - Contrast, grayscale, and invert filters
  - Quick toggle button
  - Settings persistence

