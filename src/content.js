// Better USACO Content Script
// Handles dark mode, filters, and toggle button

const IMAGE_SRC_PREFIX = "https://usaco.org/current/images/";

// Transparent-background replacements for USACO's logo images. The files are
// bundled with the extension (see web_accessible_resources in manifest.json) so
// that rendering a themed page never makes a request to a third-party host.
const LOGO_REPLACEMENTS = {
    [`${IMAGE_SRC_PREFIX}usaco_logo.png`]: "src/assets/images/usaco-logo.png",
    [`${IMAGE_SRC_PREFIX}sponsors/logo_vplanet.jpg`]:
        "src/assets/images/logo-vplanet.png",
};

let settings = {
    enabled: true,
    darkMode: false,
    enhancedSamples: true,
    contrast: 100,
    grayscale: 0,
    invert: 0,
};

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
        [
            "enabled",
            "darkMode",
            "enhancedSamples",
            "contrast",
            "grayscale",
            "invert",
        ],
        (data) => {
            settings.enabled = data.enabled !== undefined ? data.enabled : true;
            settings.darkMode = data.darkMode || false;
            settings.enhancedSamples =
                data.enhancedSamples !== undefined
                    ? data.enhancedSamples
                    : true;
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
        const replacement = LOGO_REPLACEMENTS[img.src];
        if (replacement) {
            img.src = chrome.runtime.getURL(replacement);
        }
    });

    if (settings.enhancedSamples) {
        enhanceSamples();
    } else {
        removeSampleEnhancements();
    }
}

// Remove all styles
function removeStyles() {
    document.documentElement.style.filter = "";
    document.documentElement.classList.remove("usaco-dark-mode");
    removeSampleEnhancements();
}

// --- Sample input/output boxes -------------------------------------------
// USACO renders samples as flat siblings: <h4>SAMPLE INPUT:</h4><pre class="in">
// followed by <h4>SAMPLE OUTPUT:</h4><pre class="out">. enhanceSamples() moves
// each such pair into a bordered container with a header row and a copy button;
// removeSampleEnhancements() puts the original nodes back exactly as they were.

const SAMPLE_CLASS = "busaco-sample";
const SAMPLE_SECTION_CLASS = "busaco-sample-section";
const SAMPLE_TITLE_CLASS = "busaco-sample-title";

// Collect every <h4> + <pre> sample pair, in document order
function collectSampleBlocks() {
    const blocks = [];
    document.querySelectorAll("pre.in, pre.out").forEach((pre) => {
        const heading = pre.previousElementSibling;
        if (!heading || heading.tagName !== "H4") {
            return;
        }
        if (!/sample\s+(input|output)/i.test(heading.textContent)) {
            return;
        }
        blocks.push({
            heading,
            pre,
            kind: pre.classList.contains("in") ? "in" : "out",
        });
    });
    return blocks;
}

// Group an input block with the output block that immediately follows it, so
// the two share a single bordered container
function groupSampleBlocks(blocks) {
    const groups = [];
    blocks.forEach((block) => {
        const previous = groups[groups.length - 1];
        const followsInput =
            block.kind === "out" &&
            previous &&
            previous.length === 1 &&
            previous[0].kind === "in" &&
            previous[0].pre.nextElementSibling === block.heading;

        if (followsInput) {
            previous.push(block);
        } else {
            groups.push([block]);
        }
    });
    return groups;
}

function enhanceSamples() {
    groupSampleBlocks(collectSampleBlocks()).forEach((group) => {
        // Already wrapped (applyStyles re-runs on navigation)
        if (group[0].heading.closest(`.${SAMPLE_CLASS}`)) {
            return;
        }

        const container = document.createElement("div");
        container.className = SAMPLE_CLASS;
        group[0].heading.parentNode.insertBefore(container, group[0].heading);

        group.forEach(({ heading, pre }) => {
            const section = document.createElement("div");
            section.className = SAMPLE_SECTION_CLASS;

            const header = document.createElement("div");
            header.className = "busaco-sample-header";

            heading.classList.add(SAMPLE_TITLE_CLASS);
            heading.dataset.busacoText = heading.textContent;
            heading.textContent = heading.textContent.replace(/\s*:\s*$/, "");

            header.appendChild(heading);
            header.appendChild(createCopyButton(pre));
            section.appendChild(header);
            section.appendChild(pre);
            container.appendChild(section);
        });
    });
}

function removeSampleEnhancements() {
    document.querySelectorAll(`.${SAMPLE_CLASS}`).forEach((container) => {
        const parent = container.parentNode;
        container
            .querySelectorAll(`.${SAMPLE_SECTION_CLASS}`)
            .forEach((section) => {
                const heading = section.querySelector(`.${SAMPLE_TITLE_CLASS}`);
                const pre = section.querySelector("pre");

                if (heading) {
                    heading.classList.remove(SAMPLE_TITLE_CLASS);
                    if (heading.className === "") {
                        heading.removeAttribute("class");
                    }
                    if (heading.dataset.busacoText !== undefined) {
                        heading.textContent = heading.dataset.busacoText;
                        delete heading.dataset.busacoText;
                    }
                    parent.insertBefore(heading, container);
                }
                if (pre) {
                    parent.insertBefore(pre, container);
                }
            });
        container.remove();
    });
}

function createCopyButton(pre) {
    const button = document.createElement("button");
    let resetTimer = null;

    button.type = "button";
    button.className = "busaco-copy-button";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy sample to clipboard");

    button.addEventListener("click", () => {
        copyText(sampleText(pre)).then((copied) => {
            button.textContent = copied ? "Copied!" : "Failed";
            button.classList.toggle("busaco-copied", copied);
            clearTimeout(resetTimer);
            resetTimer = setTimeout(() => {
                button.textContent = "Copy";
                button.classList.remove("busaco-copied");
            }, 1500);
        });
    });

    return button;
}

// USACO's <pre> content always ends with a newline; normalize to exactly one
function sampleText(pre) {
    return `${pre.textContent.replace(/\s+$/, "")}\n`;
}

function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(
            () => true,
            () => fallbackCopy(text)
        );
    }
    return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.cssText =
        "position:fixed;top:-1000px;left:-1000px;opacity:0";
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;
    try {
        copied = document.execCommand("copy");
    } catch (error) {
        copied = false;
    }
    textarea.remove();
    return copied;
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
    toggleButton.textContent = settings.darkMode ? "☀️" : "🌙";
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
        toggleButton.textContent = settings.darkMode ? "☀️" : "🌙";
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
        settings.enhancedSamples =
            request.enhancedSamples !== undefined
                ? request.enhancedSamples
                : settings.enhancedSamples;
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
