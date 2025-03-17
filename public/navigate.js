// Listens for navigation events
navigation.addEventListener("navigate", (e) => {
  const parsedUrl = new URL(e.destination.url);
  const pathname = parsedUrl.pathname;

  window.postMessage({ type: "NAVIGATE_EVENT", pathname }, "*");
});
