import { instagramApi } from "../api/instagramApi";
import { extractShortcodeFromUrl } from "../utils/shortCode";
import { analysisResults } from "../utils/analysisResults";
import { DetectionReport } from "../types";
import { createBadge } from "../utils/createBadge";
import { addElementToArticle } from "../utils/addElementToArticle";

let mainObserver: MutationObserver | null = null;
const articleShortcodes = new Map<HTMLElement, string>();

/**
 * Observes the Instagram feed for new articles and processes them
 * @returns void
 */
function observeNewArticles() {
  if (mainObserver) {
    processAllArticles();
    return;
  }

  // Find the first article
  const firstArticle = document.querySelector("article");
  if (!firstArticle) {
    // If no article is found yet, just observe body
    mainObserver = new MutationObserver(() => processAllArticles());
    mainObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    return;
  }

  // Target the direct parent container of the first article
  const articleContainer = firstArticle.parentElement;
  if (!articleContainer) {
    // Fallback to document.body if something unexpected occurs
    mainObserver = new MutationObserver(() => processAllArticles());
    mainObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    // Observe only this parent container
    mainObserver = new MutationObserver(() => processAllArticles());
    mainObserver.observe(articleContainer, {
      childList: true,
      subtree: true,
    });
  }

  // Initial run
  processAllArticles();
}

/**
 * Stop observing the Instagram feed
 */
function stopObserving() {
  if (mainObserver) {
    mainObserver.disconnect();
    mainObserver = null;
  }
  articleShortcodes.clear();
}

/**
 * Process all articles on the page, adds elements depending on the shortcode as stored in the articleShortcodes map
 */
function processAllArticles() {
  const articles = document.querySelectorAll("article");
  articles.forEach((article) => {
    const linkElement = article.querySelector('a[href*="/p/"], a[href*="/r/"]');
    const currentLink = linkElement?.getAttribute("href") || null;
    const shortCode = extractShortcodeFromUrl(currentLink);

    if (shortCode) {
      const knownShortcode = articleShortcodes.get(article);
      if (knownShortcode !== shortCode) {
        addOrUpdateInteractiveElement(article as HTMLElement, shortCode);
        articleShortcodes.set(article as HTMLElement, shortCode);
      }
    } else {
      // If no shortcode, remove from map
      articleShortcodes.delete(article as HTMLElement);
    }
  });
}

/**
 * Adds or updates the interactive element (button or badge) for a given article
 * @param article
 * @param shortCode
 */
function addOrUpdateInteractiveElement(
  article: HTMLElement,
  shortCode: string
) {
  let element = article.querySelector("[data-mlm-detector]");
  if (element) {
    // If it's a button but we have a stored result, replace it
    if (
      element.tagName.toLowerCase() === "button" &&
      analysisResults.has(shortCode)
    ) {
      replaceButtonWithBadge(element as HTMLButtonElement, shortCode);
      return;
    }
    // If it’s already a badge, leave as is
    return;
  }

  // If no element exists, create one
  // If we already have a result for the shortcode, create a badge
  if (analysisResults.has(shortCode)) {
    element = createBadge(shortCode);
  } else {
    // Otherwise, create a button.
    element = createButton(shortCode);
  }

  addElementToArticle(element, article);
}

/**
 * Replace the button with a badge element
 * @param button
 * @param shortCode
 */
function replaceButtonWithBadge(button: HTMLButtonElement, shortCode: string) {
  const badge = createBadge(shortCode);

  // Copy the shortcode for reference.
  badge.setAttribute("data-shortcode", shortCode);

  // Replace the button with badge in the DOM
  button.parentElement?.replaceChild(badge, button);
}

/**
 * Create a button element to analyse the post
 *
 * @param shortCode
 * @returns HTMLButtonElement
 */
function createButton(shortCode: string) {
  const button = document.createElement("button");
  button.textContent = "Analyse post";
  button.classList.add("mlm-detector-button");
  button.setAttribute("data-mlm-detector", "button");
  button.setAttribute("data-shortcode", shortCode);
  button.addEventListener("click", handleButtonClick);

  return button;
}

/**
 * Button click handler that fetches the post content and sends it to the background script for analysis
 * @param event
 */
async function handleButtonClick(event: Event) {
  const button = event.currentTarget as HTMLButtonElement;
  const originalText = button.textContent;
  const shortCode = button.getAttribute("data-shortcode");
  if (!shortCode) return;

  if (analysisResults.has(shortCode)) {
    replaceButtonWithBadge(button, shortCode);
    return;
  }

  button.textContent = "Analysing...";
  button.disabled = true;

  try {
    const caption = await instagramApi.fetchPost(shortCode);
    console.log(caption);

    chrome.runtime.sendMessage(
      {
        type: "analyse",
        payload: { post_content: caption },
      },
      (response) => {
        if (response && response.prediction) {
          // Save the prediction for this shortcode.
          analysisResults.set(shortCode, response as DetectionReport);
          console.log(analysisResults);
          // Replace the button with a badge.
          replaceButtonWithBadge(button, shortCode);
        } else {
          console.warn("Analysis failed or no prediction received.");
          // Revert button state on failure.
          button.textContent = originalText;
          button.disabled = false;
        }
      }
    );
  } catch (error) {
    console.warn(error);
    button.textContent = "Analysis failed.";
    button.disabled = false;
  }
}

export const instagramFeed = {
  observeNewArticles,
  stopObserving,
};
