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
