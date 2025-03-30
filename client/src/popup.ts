// JavaScript code for handling the popup UI (index.html)

/**
 * Initialise the local storage with default values
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(
    ["modelType", "explanations", "isScanning"],
    (result) => {
      if (result.modelType === undefined) {
        chrome.storage.local.set({ modelType: "advanced" });
      }
      if (result.explanations === undefined) {
        chrome.storage.local.set({ explanations: true });
      }
      if (result.isScanning === undefined) {
        chrome.storage.local.set({ isScanning: false });
      }
    }
  );
});

// When the popup opens, get the active tab's URL
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs && tabs.length > 0) {
    const activeTabUrl = tabs[0].url || "";
    // Not instagram
    if (!activeTabUrl.includes("instagram.com")) {
      updateScanningUI(false, false);
    } else {
      // Is Instagram, load state from storage
      chrome.storage.local.get(["isScanning"], (result) => {
        const isScanning = result.isScanning || false;
        updateScanningUI(isScanning, true);
      });
    }
  }
});

/**
 *  Update the UI (in the popup) based on the scanning state and the current tab
 * @param isScanning
 */
export function updateScanningUI(isScanning: boolean, isInstagram = false) {
  const activelyScanning = isScanning && isInstagram;
  const statusElement = document.getElementById("scanning-status");
  const toggleButton = document.getElementById(
    "toggle-btn"
  ) as HTMLButtonElement;

  // Update scanning status text
  if (statusElement) {
    statusElement.textContent = isInstagram
      ? activelyScanning
        ? "ON"
        : "OFF"
      : "DISABLED";
  }

  if (toggleButton) {
    toggleButton.setAttribute("aria-checked", activelyScanning.toString());

    if (isInstagram) {
      toggleButton.disabled = false;
    } else {
      toggleButton.disabled = true;
    }
  }
}

/**
 * Toggle the scanning state which the switch button is clicked
 */
export function toggleScanning() {
  chrome.storage.local.get(["isScanning"], (result) => {
    const current = result.isScanning || false;
    const newState = !current;
    chrome.storage.local.set({ isScanning: newState });

    // Notify the content script about the state change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "TOGGLE_SCANNING",
          isScanning: newState,
        });

        // Determine if the active tab is on Instagram
        const activeTabUrl = tabs[0].url || "";
        const isInstagram = activeTabUrl.includes("instagram.com");

        // Update the UI
        updateScanningUI(newState, isInstagram);
      }
    });
  });
}

/**
 * Add event listeners to the toggle button, radio buttons, and checkbox
 */
document.addEventListener("DOMContentLoaded", () => {
  const toggleButton = document.getElementById(
    "toggle-btn"
  ) as HTMLButtonElement;
  if (toggleButton) {
    toggleButton.addEventListener("click", toggleScanning);
  }

  const basicRadio = document.getElementById("model-basic") as HTMLInputElement;
  const advancedRadio = document.getElementById(
    "model-advanced"
  ) as HTMLInputElement;
  const explanationsCheckbox = document.getElementById(
    "explanations-checkbox"
  ) as HTMLInputElement;

  // Update the settings UI based on stored settings
  // Disables the checkbox if the basic model is selected
  const updateSettingsUI = (modelType: string, explanations: boolean) => {
    if (basicRadio && advancedRadio) {
      basicRadio.checked = modelType === "basic";
      advancedRadio.checked = modelType === "advanced";
    }
    if (explanationsCheckbox) {
      explanationsCheckbox.checked = explanations;
      explanationsCheckbox.disabled = modelType === "basic";
    }
  };

  // Retrieve stored settings
  chrome.storage.local.get(["modelType", "explanations"], (result) => {
    const modelType = result.modelType || "advanced";
    const explanations =
      result.explanations !== undefined ? result.explanations : true;
    updateSettingsUI(modelType, explanations);
  });

  // Listeners
  const attachRadioListener = (radioEl: HTMLInputElement, type: string) => {
    if (radioEl) {
      radioEl.addEventListener("change", () => {
        if (radioEl.checked) {
          chrome.storage.local.set({ modelType: type });
          if (explanationsCheckbox) {
            explanationsCheckbox.disabled = type === "basic";
          }
        }
      });
    }
  };

  attachRadioListener(basicRadio, "basic");
  attachRadioListener(advancedRadio, "advanced");

  if (explanationsCheckbox) {
    explanationsCheckbox.addEventListener("change", function () {
      chrome.storage.local.set({ explanations: this.checked });
    });
  }
});
