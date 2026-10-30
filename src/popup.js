// Better USACO Popup Script
// Handles user interactions and settings management

const elements = {
    enabled: document.getElementById("enabled"),
    darkMode: document.getElementById("darkMode"),
    enhancedSamples: document.getElementById("enhancedSamples"),
    styledSolutions: document.getElementById("styledSolutions"),
    spoilerGuard: document.getElementById("spoilerGuard"),
    contrast: document.getElementById("contrast"),
    grayscale: document.getElementById("grayscale"),
    invert: document.getElementById("invert"),
    contrastValue: document.getElementById("contrastValue"),
    grayscaleValue: document.getElementById("grayscaleValue"),
    invertValue: document.getElementById("invertValue"),
};

// Load saved settings
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
            elements.enabled.checked =
                data.enabled !== undefined ? data.enabled : true;
            elements.darkMode.checked = data.darkMode || false;
            elements.enhancedSamples.checked =
                data.enhancedSamples !== undefined
                    ? data.enhancedSamples
                    : true;
            elements.styledSolutions.checked =
                data.styledSolutions !== undefined
                    ? data.styledSolutions
                    : true;
            elements.spoilerGuard.checked = data.spoilerGuard || false;
            elements.contrast.value =
                data.contrast !== undefined ? data.contrast : 100;
            elements.grayscale.value =
                data.grayscale !== undefined ? data.grayscale : 0;
            elements.invert.value = data.invert !== undefined ? data.invert : 0;

            updateSliderValues();
        }
    );
}

// Update slider value displays
function updateSliderValues() {
    elements.contrastValue.textContent = `${elements.contrast.value}%`;
    elements.grayscaleValue.textContent = `${elements.grayscale.value}%`;
    elements.invertValue.textContent = `${elements.invert.value}%`;
}

// Save settings and send to content script
function saveSettings() {
    const settings = {
        enabled: elements.enabled.checked,
        darkMode: elements.darkMode.checked,
        enhancedSamples: elements.enhancedSamples.checked,
        styledSolutions: elements.styledSolutions.checked,
        spoilerGuard: elements.spoilerGuard.checked,
        contrast: parseInt(elements.contrast.value),
        grayscale: parseInt(elements.grayscale.value),
        invert: parseInt(elements.invert.value),
    };

    // Save to chrome.storage
    chrome.storage.sync.set(settings, () => {
        // Send message to content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes("usaco.org")) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "updateSettings",
                    ...settings,
                });
            }
        });
    });
}

// Submission language: stored as {value, text} under "preferredLanguage",
// separately from the settings above. The option list comes from the last
// submit form the content script saw ("submissionLanguages" in local storage).
const languageSelect = document.getElementById("preferredLanguage");
const languageNote = document.getElementById("preferredLanguageNote");

function loadLanguageSetting() {
    chrome.storage.local.get("submissionLanguages", (local) => {
        chrome.storage.sync.get("preferredLanguage", (sync) => {
            const options = local.submissionLanguages || [];
            const saved = sync.preferredLanguage;
            for (const { value, text } of options) {
                languageSelect.add(new Option(text, value));
            }
            // Keep a saved choice selectable even before the list is loaded
            if (saved && !options.some((o) => o.text === saved.text)) {
                languageSelect.add(new Option(saved.text, saved.value));
            }
            if (saved) {
                const match = Array.from(languageSelect.options).find(
                    (o) => o.text === saved.text
                );
                if (match) match.selected = true;
            }
            languageNote.hidden = options.length > 0;
        });
    });
}

languageSelect.addEventListener("change", () => {
    const option = languageSelect.options[languageSelect.selectedIndex];
    if (!option.value) {
        chrome.storage.sync.remove("preferredLanguage");
    } else {
        chrome.storage.sync.set({
            preferredLanguage: { value: option.value, text: option.text },
        });
    }
});

// Event listeners
elements.enabled.addEventListener("change", saveSettings);
elements.darkMode.addEventListener("change", saveSettings);
elements.enhancedSamples.addEventListener("change", saveSettings);
elements.styledSolutions.addEventListener("change", saveSettings);
elements.spoilerGuard.addEventListener("change", saveSettings);

elements.contrast.addEventListener("input", () => {
    updateSliderValues();
    saveSettings();
});

elements.grayscale.addEventListener("input", () => {
    updateSliderValues();
    saveSettings();
});

elements.invert.addEventListener("input", () => {
    updateSliderValues();
    saveSettings();
});

// Initialize on load
document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    loadLanguageSetting();
});
