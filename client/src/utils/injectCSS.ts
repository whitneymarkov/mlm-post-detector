/**
 * Injects the extension's CSS file into the document head replacing any relative
 * font URLs with absolute URLs.
 */
export function injectCSS() {
  fetch(chrome.runtime.getURL("global.css"))
    .then((res) => res.text())
    .then((cssText) => {
      // Get the extension base URL
      const extUrl = chrome.runtime.getURL("");

      // Replace any url(...) that doesn't start with a recognised scheme
      cssText = cssText.replace(
        /url\(\s*(['"]?)(?!data:|http:|https:|chrome-extension:)([^'")]+)\1\s*\)/gi,
        (_, quote, urlPath) => {
          // Remove a leading slash if present
          if (urlPath.startsWith("/")) {
            urlPath = urlPath.slice(1);
          }
          // New absolute URL
          return `url(${quote}${extUrl}${urlPath}${quote})`;
        }
      );

      // Inject the modified CSS into the document head
      const style = document.createElement("style");
      style.textContent = cssText;
      style.setAttribute("data-extension-style", "mlm-detector");
      document.head.appendChild(style);
    })
    .catch((err) => console.error("Error injecting CSS:", err));
}
