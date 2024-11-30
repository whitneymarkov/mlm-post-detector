function fetchPostMetadata(
  url: string
): Promise<Record<string, string | null | undefined>> {
  return fetch(url)
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const title = doc
        .querySelector('meta[property="og:title"]')
        ?.getAttribute("content");
      const description = doc
        .querySelector('meta[property="og:description"]')
        ?.getAttribute("content");
      const imageUrl = doc
        .querySelector('meta[property="og:image"]')
        ?.getAttribute("content");

      return { title, description, imageUrl };
    })
    .catch((error) => {
      console.error("Error fetching metadata:", error);
      return { error: "Failed to fetch metadata." };
    });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "FETCH_METADATA") {
    console.log(`Fetching metadata for: ${message.url}`);

    fetchPostMetadata(message.url)
      .then((metadata) => {
        sendResponse(metadata);
      })
      .catch(() => {
        sendResponse({ error: "Failed to fetch metadata." });
      });

    return true; // Keeps the message channel open for asynchronous response
  }
});
