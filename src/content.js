// Better USACO Content Script
// Handles dark mode, filters, and toggle button

// Transparent-background replacements for USACO's logo images, keyed by the
// image path relative to the site's `current/` directory. The files are bundled
// with the extension (see web_accessible_resources in manifest.json) so that
// rendering a themed page never makes a request to a third-party host.
const LOGO_REPLACEMENTS = {
    "images/usaco_logo.png": "src/assets/images/usaco-logo.png",
    "images/sponsors/logo_vplanet.jpg": "src/assets/images/logo-vplanet.png",
};

// USACO's markup writes those images as page-relative URLs
// (`current/images/usaco_logo.png`), so the absolute src depends on the
// directory the page is served from: usaco.org/index.php resolves them under
// /current/, while usaco.org/current/index.php — where every problem page and
// every link followed from one lives — resolves them under /current/current/,
// which the server happily serves for any depth. Strip the repeated segments so
// each form maps to the same key.
const LOGO_PATH_RE = /^(?:\/current)+\/(.+)$/;

function logoReplacementFor(img) {
    let path;
    try {
        const url = new URL(img.src);
        if (url.hostname !== "usaco.org") {
            return undefined;
        }
        path = url.pathname;
    } catch (error) {
        return undefined;
    }

    const match = LOGO_PATH_RE.exec(path);
    return match ? LOGO_REPLACEMENTS[match[1]] : undefined;
}

let settings = {
    enabled: true,
    darkMode: false,
    enhancedSamples: true,
    styledSolutions: true,
    spoilerGuard: false,
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
    setupLanguageMemory();
}

// --- Remember the submission language ---------------------------------------
// USACO's submit form resets its language dropdown on every page load. We save
// whatever the user picks and restore it next time. The option's visible text
// is matched first because it is more stable than USACO's numeric values;
// the value is only a fallback.
const PREFERRED_LANGUAGE_KEY = "preferredLanguage";

// Problem pages also have a translation dropdown (`#choose-language`, named
// "lang") whose change handler navigates to the translated page, so the
// submission dropdown is identified by its options, never by its name.
function findLanguageSelect() {
    const selects = Array.from(document.querySelectorAll("select")).filter(
        (s) => s.id !== "choose-language"
    );
    return (
        selects.find((s) => {
            const texts = Array.from(s.options, (o) => o.text.toLowerCase());
            return (
                texts.some((t) => t.includes("python")) &&
                texts.some((t) => t.includes("java") || t.includes("c++"))
            );
        }) || null
    );
}

function setupLanguageMemory() {
    const select = findLanguageSelect();
    if (!select || select.dataset.busacoLangMemory) return;
    select.dataset.busacoLangMemory = "true";
    let restoring = false;

    chrome.storage.sync.get(PREFERRED_LANGUAGE_KEY, (data) => {
        const saved = data[PREFERRED_LANGUAGE_KEY];
        if (!saved || !settings.enabled) return;
        const options = Array.from(select.options);
        const match =
            options.find((o) => o.text.trim() === saved.text) ||
            options.find((o) => o.value === saved.value);
        if (match && select.value !== match.value) {
            select.value = match.value;
            // Let the page react as if the user picked it
            restoring = true;
            select.dispatchEvent(new Event("change", { bubbles: true }));
            restoring = false;
        }
    });

    select.addEventListener("change", () => {
        if (restoring) return; // don't re-save our own restore
        const option = select.options[select.selectedIndex];
        if (!option) return;
        chrome.storage.sync.set({
            [PREFERRED_LANGUAGE_KEY]: {
                value: option.value,
                text: option.text.trim(),
            },
        });
    });
}

// Load settings from chrome.storage
function loadSettings() {
    chrome.storage.sync.get(
        [
            "enabled",
            "darkMode",
            "enhancedSamples",
            "styledSolutions",
            "spoilerGuard",
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
            settings.styledSolutions =
                data.styledSolutions !== undefined
                    ? data.styledSolutions
                    : true;
            settings.spoilerGuard = data.spoilerGuard || false;
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
        const replacement = logoReplacementFor(img);
        if (replacement) {
            img.src = chrome.runtime.getURL(replacement);
        }
    });

    if (settings.enhancedSamples) {
        enhanceSamples();
    } else {
        removeSampleEnhancements();
    }

    // Defined in solution.js; a no-op on every page that is not an editorial
    if (settings.styledSolutions) {
        enhanceSolutionPage(settings.spoilerGuard);
    } else {
        removeSolutionEnhancements();
    }
}

// Remove all styles
function removeStyles() {
    document.documentElement.style.filter = "";
    document.documentElement.classList.remove("usaco-dark-mode");
    removeSampleEnhancements();
    removeSolutionEnhancements();
}

// --- Sample input/output boxes -------------------------------------------
// USACO renders samples as flat siblings: <h4>SAMPLE INPUT:</h4><pre class="in">
// followed by <h4>SAMPLE OUTPUT:</h4><pre class="out">. enhanceSamples() moves
// each such pair into a bordered container with a header row and a copy button;
// removeSampleEnhancements() puts the original nodes back exactly as they were.
// Pre-2015 problems have no such markup at all (see the legacy section below),
// so enhanceSamples() synthesizes it first.

const SAMPLE_CLASS = "busaco-sample";
const SAMPLE_SECTION_CLASS = "busaco-sample-section";
const SAMPLE_TITLE_CLASS = "busaco-sample-title";

// Collect every <h4> + <pre> sample pair, in document order. The heading is
// what identifies a sample, not the <pre>: 2015-era problems (cpid ~520-540)
// write the pair as `<h4>SAMPLE INPUT:</h4><pre>` with no in/out class at all,
// so keying off `pre.in, pre.out` misses them entirely.
function collectSampleBlocks() {
    const blocks = [];
    document.querySelectorAll("h4").forEach((heading) => {
        const match = /sample\s+(input|output)/i.exec(heading.textContent);
        if (!match) {
            return;
        }
        const pre = heading.nextElementSibling;
        if (!pre || pre.tagName !== "PRE") {
            return;
        }
        // enhanceSamples() pulls everything between the two into the box, so
        // insist there is nothing there worth reading
        if (!onlyWhitespaceBetween(heading, pre)) {
            return;
        }
        blocks.push({
            heading,
            pre,
            kind: /input/i.test(match[1]) ? "in" : "out",
        });
    });
    return blocks;
}

// True when nothing but whitespace (and comments) separates two siblings.
// nextElementSibling alone is not enough: on legacy pages the sample input and
// sample output are the nearest elements to each other but have paragraphs of
// prose between them, and that prose must not be stranded outside the box.
function onlyWhitespaceBetween(start, end) {
    let node = start.nextSibling;
    while (node && node !== end) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.data.trim() !== "") {
                return false;
            }
        } else if (node.nodeType !== Node.COMMENT_NODE) {
            return false;
        }
        node = node.nextSibling;
    }
    return node === end;
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
            previous[0].pre.nextElementSibling === block.heading &&
            onlyWhitespaceBetween(previous[0].pre, block.heading);

        if (followsInput) {
            previous.push(block);
        } else {
            groups.push([block]);
        }
    });
    return groups;
}

function enhanceSamples() {
    normalizeLegacySamples();

    groupSampleBlocks(collectSampleBlocks()).forEach((group) => {
        // Already wrapped (applyStyles re-runs on navigation)
        if (group[0].heading.closest(`.${SAMPLE_CLASS}`)) {
            return;
        }

        // Every node from the first heading to the last <pre>, in order. The
        // pair is not enough: the whitespace between the nodes has to travel
        // with them, or removeSampleEnhancements() would reinsert the pair in
        // front of what was left behind rather than around it, quietly shifting
        // the statement's whitespace on every toggle.
        const last = group[group.length - 1].pre;
        const originals = [];
        for (let node = group[0].heading; node; node = node.nextSibling) {
            originals.push(node);
            if (node === last) {
                break;
            }
        }

        const container = document.createElement("div");
        container.className = SAMPLE_CLASS;
        container.busacoOriginals = originals;
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

        // The headings and <pre>s now live in the sections; whatever sat
        // between them does not, so bring it along. Its resting place inside
        // the container does not matter (it is whitespace, per
        // collectSampleBlocks / groupSampleBlocks) — the recorded order is what
        // puts it back.
        originals.forEach((node) => {
            if (node.parentNode === container.parentNode) {
                container.appendChild(node);
            }
        });
    });
}

function removeSampleEnhancements() {
    document.querySelectorAll(`.${SAMPLE_CLASS}`).forEach((container) => {
        const parent = container.parentNode;

        // Recorded by enhanceSamples(). The fallback is for a container this
        // page's script did not build — there should be none, but an empty list
        // would take the statement down with the container.
        const originals =
            container.busacoOriginals ||
            Array.from(
                container.querySelectorAll(`.${SAMPLE_TITLE_CLASS}, pre`)
            );

        container
            .querySelectorAll(`.${SAMPLE_TITLE_CLASS}`)
            .forEach((heading) => {
                heading.classList.remove(SAMPLE_TITLE_CLASS);
                if (heading.className === "") {
                    heading.removeAttribute("class");
                }
                if (heading.dataset.busacoText !== undefined) {
                    heading.textContent = heading.dataset.busacoText;
                    delete heading.dataset.busacoText;
                }
            });

        originals.forEach((node) => parent.insertBefore(node, container));
        container.remove();
    });

    // After the containers are gone the synthesized headings and <pre>s are
    // plain siblings again, which is where denormalizeLegacySamples() expects
    // to find them.
    denormalizeLegacySamples();
}

// --- Legacy (pre-2015) sample blocks --------------------------------------
// Problems older than roughly cpid 530 have no sample markup to enhance: the
// whole statement is one plain-text node inside `span#probtext-text`, with the
// samples marked only by a line of text —
//
//     SAMPLE INPUT (file paint.in):
//     <blank line>
//     6 2
//     2 R
//     <blank line>
//     INPUT DETAILS:
//
// normalizeLegacySamples() rewrites each of those runs into the markup the
// modern pages already ship (<h4> + <pre class="in">), so collectSampleBlocks()
// and enhanceSamples() below need no special case. Every synthesized element
// carries the exact source text it replaced in `data-busaco-legacy`, so
// denormalizeLegacySamples() can put the text node back character for character
// — the sample data is therefore held twice, in the <pre> and in the attribute,
// which is a few hundred bytes well spent on an exact round trip.

// A few statements are served with CRLF line endings; the HTML parser folds
// those to LF in the DOM, but tolerate a stray \r so the matching does not
// depend on that.
const LEGACY_SAMPLE_HEADER_RE =
    /^[ \t]*SAMPLE[ \t]+(INPUT|OUTPUT)\b[^\n]*:[ \t\r]*$/i;

// Locate every legacy sample run in a block of text, as offsets into it
function findLegacySampleSections(text) {
    const sections = [];
    const lines = text.split("\n");
    let offset = 0;

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const headStart = offset;
        // The final line has no trailing newline; slice() clamps, so counting
        // one anyway costs nothing and keeps the arithmetic uniform.
        offset += line.length + 1;

        const match = LEGACY_SAMPLE_HEADER_RE.exec(line);
        if (!match) {
            continue;
        }

        // Blank lines between the heading and the data belong to the heading
        let dataStart = offset;
        let cursor = index + 1;
        while (cursor < lines.length && lines[cursor].trim() === "") {
            dataStart += lines[cursor].length + 1;
            cursor++;
        }

        // The data runs until the next blank line (or the end of the text)
        let dataEnd = dataStart;
        let end = cursor;
        while (end < lines.length && lines[end].trim() !== "") {
            dataEnd += lines[end].length + 1;
            end++;
        }

        // A heading with no data under it is prose, not a sample
        if (end === cursor) {
            continue;
        }

        sections.push({
            kind: /input/i.test(match[1]) ? "in" : "out",
            title: line.trim(),
            headText: text.slice(headStart, dataStart),
            dataText: text.slice(dataStart, dataEnd),
            start: headStart,
            end: dataEnd,
        });

        offset = dataEnd;
        index = end - 1;
    }

    return sections;
}

function normalizeLegacySamples() {
    document.querySelectorAll("#probtext-text").forEach((statement) => {
        // Modern statements already ship the markup this would synthesize
        if (statement.querySelector("pre.in, pre.out")) {
            return;
        }

        Array.from(statement.childNodes).forEach((node) => {
            if (node.nodeType !== Node.TEXT_NODE) {
                return;
            }

            const sections = findLegacySampleSections(node.data);
            if (sections.length === 0) {
                return;
            }

            const fragment = document.createDocumentFragment();
            let cursor = 0;

            sections.forEach((section) => {
                if (section.start > cursor) {
                    fragment.appendChild(
                        document.createTextNode(
                            node.data.slice(cursor, section.start)
                        )
                    );
                }

                const heading = document.createElement("h4");
                heading.textContent = section.title;
                heading.dataset.busacoLegacy = section.headText;

                const pre = document.createElement("pre");
                pre.className = section.kind;
                pre.textContent = section.dataText;
                pre.dataset.busacoLegacy = section.dataText;

                fragment.appendChild(heading);
                fragment.appendChild(pre);
                cursor = section.end;
            });

            const tail = node.data.slice(cursor);
            if (tail !== "") {
                fragment.appendChild(document.createTextNode(tail));
            }

            node.parentNode.replaceChild(fragment, node);
        });
    });
}

function denormalizeLegacySamples() {
    const parents = new Set();

    document.querySelectorAll("[data-busaco-legacy]").forEach((element) => {
        parents.add(element.parentNode);
        element.parentNode.replaceChild(
            document.createTextNode(element.dataset.busacoLegacy),
            element
        );
    });

    // Merge the restored slices back into the single text node they came from
    parents.forEach((parent) => parent.normalize());
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
        settings.styledSolutions =
            request.styledSolutions !== undefined
                ? request.styledSolutions
                : settings.styledSolutions;
        settings.spoilerGuard =
            request.spoilerGuard !== undefined
                ? request.spoilerGuard
                : settings.spoilerGuard;
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
