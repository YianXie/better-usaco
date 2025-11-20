// USACO Dark Mode Content Script
// Handles dark mode, filters, and toggle button

const IMAGE_SRC_PREFIX = "https://usaco.org/current/images/";

let settings = {
    enabled: true,
    darkMode: false,
    contrast: 100,
    grayscale: 0,
    invert: 0,
};

let styleElement = null;
let toggleButton = null;

// Initialize on page load
function init() {
    loadSettings();
    createToggleButton();
    applyStyles();
}

// Load settings from chrome.storage
function loadSettings() {
    chrome.storage.sync.get(
        ["enabled", "darkMode", "contrast", "grayscale", "invert"],
        (data) => {
            settings.enabled = data.enabled !== undefined ? data.enabled : true;
            settings.darkMode = data.darkMode || false;
            settings.contrast =
                data.contrast !== undefined ? data.contrast : 100;
            settings.grayscale =
                data.grayscale !== undefined ? data.grayscale : 0;
            settings.invert = data.invert !== undefined ? data.invert : 0;
            applyStyles();
            updateToggleButton();
        }
    );
}

// Apply styles and filters based on settings
function applyStyles() {
    if (!settings.enabled) {
        removeStyles();
        return;
    }

    // Create or update style element
    if (!styleElement) {
        styleElement = document.createElement("style");
        styleElement.id = "usaco-dark-mode-styles";
        document.head.appendChild(styleElement);
    }

    // Build filter string
    const filters = [];
    if (settings.contrast !== 100) {
        filters.push(`contrast(${settings.contrast}%)`);
    }
    if (settings.grayscale > 0) {
        filters.push(`grayscale(${settings.grayscale}%)`);
    }
    if (settings.invert > 0) {
        filters.push(`invert(${settings.invert}%)`);
    }

    const filterString = filters.length > 0 ? filters.join(" ") : "none";

    // Apply filters to html element
    if (filterString !== "none") {
        document.documentElement.style.filter = filterString;
    } else {
        document.documentElement.style.filter = "";
    }

    // Apply dark mode class
    if (settings.darkMode) {
        document.documentElement.classList.add("usaco-dark-mode");
    } else {
        document.documentElement.classList.remove("usaco-dark-mode");
    }

    document.querySelectorAll("a>img").forEach((img) => {
        console.log(img.src);
        switch (img.src) {
            case `${IMAGE_SRC_PREFIX}usaco_logo.png`:
                img.src =
                    "https://res.cloudinary.com/do3fxs95y/image/upload/v1763638736/image-removebg-preview_hwrwpt.png";
                break;
            case `${IMAGE_SRC_PREFIX}sponsors/logo_vplanet.jpg`:
                img.src =
                    "https://res.cloudinary.com/do3fxs95y/image/upload/v1763639040/logo_vplanet-no-background_vtzqrx.png";
                break;
            default:
                break;
        }
    });

    // document.querySelector("a>img").src =
    //     "https://res.cloudinary.com/do3fxs95y/image/upload/v1763638736/image-removebg-preview_hwrwpt.png";
}

// Remove all styles
function removeStyles() {
    document.documentElement.style.filter = "";
    document.documentElement.classList.remove("usaco-dark-mode");
    if (styleElement) {
        styleElement.remove();
        styleElement = null;
    }
}

// Create floating toggle button
function createToggleButton() {
    // Check if button already exists
    if (document.getElementById("usaco-dark-toggle")) {
        return;
    }

    toggleButton = document.createElement("button");
    toggleButton.id = "usaco-dark-toggle";
    toggleButton.setAttribute("aria-label", "Toggle dark mode");
    toggleButton.innerHTML = settings.darkMode ? "☀️" : "🌙";
    toggleButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    border: none;
    background-color: #4a5568;
    color: white;
    font-size: 24px;
    cursor: pointer;
    z-index: 10000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  `;

    toggleButton.addEventListener("mouseenter", () => {
        toggleButton.style.transform = "scale(1.1)";
        toggleButton.style.backgroundColor = "#2d3748";
    });

    toggleButton.addEventListener("mouseleave", () => {
        toggleButton.style.transform = "scale(1)";
        toggleButton.style.backgroundColor = "#4a5568";
    });

    toggleButton.addEventListener("click", () => {
        settings.darkMode = !settings.darkMode;
        chrome.storage.sync.set({ darkMode: settings.darkMode });
        applyStyles();
        updateToggleButton();
    });

    document.body.appendChild(toggleButton);
    updateToggleButton();
}

// Update toggle button appearance
function updateToggleButton() {
    if (toggleButton) {
        toggleButton.innerHTML = settings.darkMode ? "☀️" : "🌙";
        toggleButton.style.display = settings.enabled ? "block" : "none";
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "updateSettings") {
        settings.enabled =
            request.enabled !== undefined ? request.enabled : settings.enabled;
        settings.darkMode =
            request.darkMode !== undefined
                ? request.darkMode
                : settings.darkMode;
        settings.contrast =
            request.contrast !== undefined
                ? request.contrast
                : settings.contrast;
        settings.grayscale =
            request.grayscale !== undefined
                ? request.grayscale
                : settings.grayscale;
        settings.invert =
            request.invert !== undefined ? request.invert : settings.invert;
        applyStyles();
        updateToggleButton();
        sendResponse({ success: true });
    } else if (request.action === "getSettings") {
        sendResponse(settings);
    }
    return true;
});

// Handle page navigation (for SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        // Re-apply styles after navigation
        setTimeout(() => {
            applyStyles();
            if (!toggleButton || !document.body.contains(toggleButton)) {
                createToggleButton();
            }
        }, 100);
    }
}).observe(document, { subtree: true, childList: true });

// Initialize when DOM is ready
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
