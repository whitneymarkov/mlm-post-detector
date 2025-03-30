// Handles the communication between the content script and the server

import { AnalyseEvent, UserFeedbackEvent } from "./types";

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "ANALYSE") {
    handleAnalyseMessage(message, sendResponse);
    return true; // Keep the messaging channel open
  }
});

/**
 * Handles the analyse message from the content script
 * @param message
 * @param sendResponse
 */
export function handleAnalyseMessage(
  message: AnalyseEvent,
  sendResponse: Function
) {
  chrome.storage.local.get(["modelType", "explanations"], (result) => {
    const modelType = result.modelType || "advanced";
    const explanations =
      result.explanations !== undefined ? result.explanations : true;

    // Build the endpoint based on settings
    let endpoint = `${import.meta.env.VITE_API_BASE_URL}/analyse/${modelType}`;

    // Only allow explanations for the advanced model
    if (modelType === "advanced") {
      endpoint += `?explanations=${explanations.toString()}`;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message.payload),
    })
      .then((res) => res.json())
      .then((data) => {
        sendResponse(data);
      })
      .catch((err) => {
        console.error(err);
        sendResponse({ error: "Network request failed" });
      });
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "DISAGREE") {
    handleUserFeedback(message, sendResponse);
    return true; // Keep the messaging channel open
  }
});

/**
 * Handles user feedback from the content script
 * @param message
 * @param sendResponse
 */
export function handleUserFeedback(
  message: UserFeedbackEvent,
  sendResponse: Function
) {
  fetch(`${import.meta.env.VITE_API_BASE_URL}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message.payload),
  })
    .then((res) => res.json())
    .then((data) => {
      sendResponse(data);
    })
    .catch((err) => {
      console.error(err);
      sendResponse({ error: "Network request failed" });
    });
}

// Listen for when a tab is updated (e.g., URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateIcon(tabId, tab.url);
  }
});

// Listen for when the active tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      updateIcon(activeInfo.tabId, tab.url);
      pingServer(tab.url);
    }
  });
});

/**
 * Updates the icon based on the URL
 *
 * Icon customised from https://www.flaticon.com/free-icon/visible_9679347?term=eye&page=1&position=5&origin=search&related_id=9679347
 * @param tabId
 * @param url
 */
export function updateIcon(tabId: number, url: string) {
  if (url.includes("instagram.com")) {
    chrome.action.setIcon({
      tabId,
      path: {
        "16": "icons/icon16-active.png",
        "48": "icons/icon48-active.png",
        "128": "icons/icon128-active.png",
      },
    });
  } else {
    chrome.action.setIcon({
      tabId,
      path: {
        "16": "icons/icon16-disabled.png",
        "48": "icons/icon48-disabled.png",
        "128": "icons/icon128-disabled.png",
      },
    });
  }
}

/**
 * Sends a ping to the server to warm it up when the user is on Instagram
 * @param url
 */
export function pingServer(url: string) {
  if (url.includes("instagram.com")) {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/ping`)
      .then((response) => response.text())
      .then((text) => console.log("Server warmed up:", text))
      .catch((err) => console.error("Ping failed:", err));
  }
}
