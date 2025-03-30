// Main content script that is run on Instagram pages, able to access the DOM
import { InstagramFeedObserver } from "./instagram/feed";
import { InstagramPostHandler } from "./instagram/post";
import { NavigateEvent, ToggleScanningEvent } from "./types";
import { injectCSS } from "./utils/injectCSS";
import { injectNavigateScript } from "./utils/injectNavigateScript";

export class ContentScript {
  private isScanningActive = false;
  private instagramFeedObserver = new InstagramFeedObserver();

  constructor() {
    injectCSS();
    injectNavigateScript();

    // Initialise the flag from storage on load
    chrome.storage.local.get(["isScanning"], (result) => {
      this.isScanningActive = result.isScanning || false;
    });

    // Listen for changes to the scanning state
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes.isScanning) {
        this.isScanningActive = changes.isScanning.newValue;
      }
    });

    // Listen for runtime messages from the popup and/or background scripts
    chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
      if (message && message.type) {
        this.handleMessage(message);
      }
    });

    // Listen for messages posted to the window (from the navigate script)
    window.addEventListener("message", (event: MessageEvent) => {
      if (event.data && event.data.type) {
        this.handleMessage(event.data);
      }
    });
  }

  /**
   * Handle messages from the navigate script and the background script.
   */
  public handleMessage(data: NavigateEvent | ToggleScanningEvent) {
    switch (data.type) {
      case "NAVIGATE_EVENT":
        if (this.isScanningActive) {
          this.handleLocationChange(data.pathname);
        }
        break;
      case "TOGGLE_SCANNING":
        this.isScanningActive = data.isScanning;
        if (this.isScanningActive) {
          // Use the current path to decide what to do
          this.handleLocationChange(window.location.pathname);
        } else {
          // Turn off: stop observer and remove UI elements
          this.instagramFeedObserver.stopObserving();
          this.removeMLMDetectorElements();
        }
        break;
      default:
        console.warn("Unhandled message type:", (data as MessageEvent).type);
    }
  }

  /**
   * Handle a change in the URL
   */
  public handleLocationChange(pathname: string) {
    // Scanning turned off
    if (!this.isScanningActive) {
      return;
    }

    if (pathname === "/") {
      this.instagramFeedObserver.startObserving();
    } else {
      this.instagramFeedObserver.stopObserving();
      if (pathname.includes("/p/") || pathname.includes("/reel/")) {
        new InstagramPostHandler(pathname);
      }
    }
  }
  /**
   * Remove all MLM detector elements from the page
   */
  public removeMLMDetectorElements() {
    const elems = document.querySelectorAll("[data-mlm-detector]");
    elems.forEach((button) => button.remove());
  }
}

export const contentScriptInstance = new ContentScript();
