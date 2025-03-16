// JavaScript code for handling the popup UI (index.html)

// Get the current scanning state
chrome.storage.local.get(["isScanning"], (result) => {
  const isScanning: boolean = result.isScanning || false;
  updateUI(isScanning);
});

/**
 *  Update the UI (in the popup) based on the scanning state
 * @param isScanning
 */
function updateUI(isScanning: boolean) {
  const statusElement = document.getElementById("scanning-status");
  const toggleButton = document.getElementById(
    "toggle-btn"
  ) as HTMLButtonElement;

  // Update the scanning status text
  if (statusElement) {
    statusElement.textContent = isScanning ? "ON" : "OFF";
  }

  if (toggleButton) {
    // Update the aria attribute
    toggleButton.setAttribute("aria-checked", isScanning.toString());

    // Toggle the background colour
    if (isScanning) {
      toggleButton.classList.remove("bg-gray-200");
      toggleButton.classList.add("bg-indigo-600");
    } else {
      toggleButton.classList.remove("bg-indigo-600");
      toggleButton.classList.add("bg-gray-200");
    }

    // Toggle knob
    const knob = toggleButton.querySelector("span.pointer-events-none");
    if (knob) {
      if (isScanning) {
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
        if (isScanning) {
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
    toggleButton.addEventListener("click", toggleScanning);
  }
}

/**
 * Toggle the scanning state which the switch button is clicked
 */
function toggleScanning() {
  chrome.storage.local.get(["isScanning"], (result) => {
    const current: boolean = result.isScanning || false;
    const newState = !current;
    chrome.storage.local.set({ isScanning: newState });

    // Notify the content script about the state change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "TOGGLE_SCANNING",
          isScanning: newState,
        });
      }
    });

    updateUI(newState);
  });
}
