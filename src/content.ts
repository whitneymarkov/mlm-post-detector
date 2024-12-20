import { instagramFeed } from "./instagram/observeFeed";
import { handleSinglePostOrReel } from "./instagram/postsReels";
import { NavigateEvent } from "./types";

const script = document.createElement("script");
script.src = chrome.runtime.getURL("injected.js");
(document.head || document.documentElement).appendChild(script);

// Listen for NAVIGATE_EVENT message from the injected script
window.addEventListener("message", (event: MessageEvent<NavigateEvent>) => {
  if (event.data && event.data.type === "NAVIGATE_EVENT") {
    console.log("URL changed:", event.data.pathname);
    handleLocationChange(event.data.pathname);
  }
});

function handleLocationChange(pathname: string) {
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
