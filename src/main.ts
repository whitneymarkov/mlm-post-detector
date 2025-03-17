// JavaScript code for handling the popup UI (index.html)

// When the popup opens, get the active tab's URL
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs && tabs.length > 0) {
    const activeTabUrl = tabs[0].url || "";
    // Not instagram
    if (!activeTabUrl.includes("instagram.com")) {
      updateUI(false, false);
    } else {
      // Is Instagram, load state from storage
      chrome.storage.local.get(["isScanning"], (result) => {
        const isScanning = result.isScanning || false;
        updateUI(isScanning, true);
      });
    }
  }
});

/**
 *  Update the UI (in the popup) based on the scanning state and the current tab
 * @param isScanning
 */
function updateUI(isScanning: boolean, isInstagram = false) {
  const activelyScanning = isScanning && isInstagram;
  const statusElement = document.getElementById("scanning-status");
  const toggleButton = document.getElementById(
    "toggle-btn"
  ) as HTMLButtonElement;

  // Update the scanning status text
  if (statusElement) {
    statusElement.textContent = activelyScanning
      ? "ON"
      : isInstagram
      ? "OFF"
      : "DISABLED";
  }

  if (toggleButton) {
    // Update the aria attribute
    toggleButton.setAttribute("aria-checked", activelyScanning.toString());

    // Toggle the background colour
    if (activelyScanning) {
      toggleButton.classList.remove("bg-gray-200");
      toggleButton.classList.add("bg-pink-500");
    } else {
      toggleButton.classList.remove("bg-pink-500");
      toggleButton.classList.add("bg-gray-200");
    }

    // Toggle knob
    const knob = toggleButton.querySelector("span.pointer-events-none");
    if (knob) {
      if (activelyScanning) {
        knob.classList.remove("translate-x-0");
        knob.classList.add("translate-x-5");
      } else {
        knob.classList.remove("translate-x-5");
        knob.classList.add("translate-x-0");
      }

      // Icon inside knob
      const offIcon = knob.querySelector("span:nth-child(1)");
      const onIcon = knob.querySelector("span:nth-child(2)");
      if (offIcon && onIcon) {
        if (activelyScanning) {
          offIcon.classList.add("opacity-0");
          offIcon.classList.remove("opacity-100");
          onIcon.classList.add("opacity-100");
          onIcon.classList.remove("opacity-0");
        } else {
          offIcon.classList.add("opacity-100");
          offIcon.classList.remove("opacity-0");
          onIcon.classList.add("opacity-0");
          onIcon.classList.remove("opacity-100");
        }
      }
    }
    // Add event listener
    if (isInstagram) {
      toggleButton.addEventListener("click", toggleScanning);
    }
  }
}

/**
 * Toggle the scanning state which the switch button is clicked
 */
function toggleScanning() {
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
        updateUI(newState, isInstagram);
      }
    });
  });
}
