/**
 * Injects the public/navigate.js script into the current page.
 */
export function injectNavigateScript() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("navigate.js");
  script.setAttribute("data-extension-script", "mlm-detector");
  (document.head || document.documentElement).appendChild(script);
}
