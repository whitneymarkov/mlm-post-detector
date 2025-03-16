// Main content script that is run on Instagram pages, able to access the DOM

import { instagramFeed } from "./instagram/observeFeed";
import { handleSinglePostOrReel } from "./instagram/postsReels";
import { NavigateEvent, ToggleScanningEvent } from "./types";

const script = document.createElement("script");
script.src = chrome.runtime.getURL("injected.js");
(document.head || document.documentElement).appendChild(script);

// Global flag to track scanning state
let isScanningActive = false;

// Initialise the flag from storage on load
chrome.storage.local.get(["isScanning"], (result) => {
  isScanningActive = result.isScanning || false;
  console.log(
    "Content script initialised: isScanningActive = ",
    isScanningActive
  );
});

// Listen for changes to the scanning state
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.isScanning) {
    isScanningActive = changes.isScanning.newValue;
    console.log("isScanningActive updated:", isScanningActive);
  }
});

// Listen for messages posted to the window (from the injected script)
window.addEventListener("message", (event: MessageEvent) => {
  if (event.data && event.data.type) {
    handleMessage(event.data);
  }
});

// Listen for runtime messages from the popup and/or background scripts
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
  if (message && message.type) {
    handleMessage(message);
  }
});

/**
 * Handle messages from the injected script and the background script.
 */
function handleMessage(data: NavigateEvent | ToggleScanningEvent) {
  switch (data.type) {
    case "NAVIGATE_EVENT":
      if (isScanningActive) {
        console.log("URL changed:", data.pathname);
        handleLocationChange(data.pathname);
      } else {
        console.log("Scanning is off - ignoring navigation event.");
      }
      break;
    case "TOGGLE_SCANNING":
      isScanningActive = data.isScanning;
      if (isScanningActive) {
        // Use the current path to decide what to do
        handleLocationChange(window.location.pathname);
      } else {
        // Turn off: stop observer and remove UI elements
        instagramFeed.stopObserving();
        removeMLMDetectorElements();
      }
      break;
    default:
      console.warn("Unhandled message type:", (data as MessageEvent).type);
  }
}

/**
 * Handle a change in the URL
 */
function handleLocationChange(pathname: string) {
  // Scanning turned off
  if (!isScanningActive) {
    console.log("Scanning is off - ignoring location change.");
    return;
  }

  if (pathname === "/") {
    console.log("On main Instagram feed");
    instagramFeed.observeNewArticles();
  } else {
    instagramFeed.stopObserving();
    if (pathname.includes("/p/") || pathname.includes("/reel/")) {
      handleSinglePostOrReel(pathname);
    } else {
      console.log("Other page on Instagram");
    }
  }
}

/**
 * Remove all MLM detector elements from the page
 */
function removeMLMDetectorElements() {
  const elems = document.querySelectorAll("[data-mlm-detector]");
  elems.forEach((button) => button.remove());
}
