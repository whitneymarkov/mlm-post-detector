// Handles the communication between the content script and the server

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "analyse") {
    fetch("http://127.0.0.1:5000/analyse", {
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
    return true; // Keep the message channel open for async response
  }
});

// Function to update the icon based on the URL
// Icon customised from https://www.flaticon.com/free-icon/visible_9679347?term=eye&page=1&position=5&origin=search&related_id=9679347
function updateIcon(tabId: number, url: string) {
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
    }
  });
});
