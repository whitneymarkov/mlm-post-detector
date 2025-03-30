import { instagramApi } from "../api/instagramApi";
import { extractShortcodeFromUrl } from "../utils/shortCode";
import { analysisResults } from "../utils/analysisResults";
import { DetectionReport } from "../types";
import { createBadge } from "../utils/createBadge";
import { addElementToArticle } from "../utils/addElementToArticle";
import { createButton } from "../utils/createButton";
import { replaceButtonWithBadge } from "../utils/replaceButtonWithBadge";
import { labels } from "../utils/labels";

export class InstagramFeedObserver {
  private mainObserver: MutationObserver | null = null;
  private articleShortcodes = new Map<HTMLElement, string>();

  constructor() {}

  /**
   * Observes the Instagram feed for new articles and processes them
   * @returns void
   */
  public startObserving() {
    if (this.mainObserver) {
      this.processAllArticles();
      return;
    }

    // Find the first article
    const firstArticle = document.querySelector("article");
    if (!firstArticle) {
      // If no article is found yet, just observe body
      this.mainObserver = new MutationObserver(() => this.processAllArticles());
      this.mainObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
      return;
    }

    // Target the direct parent container of the first article
    const articleContainer = firstArticle.parentElement;
    if (!articleContainer) {
      // Fallback to document.body if something unexpected occurs
      this.mainObserver = new MutationObserver(() => this.processAllArticles());
      this.mainObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } else {
      // Observe only this parent container
      this.mainObserver = new MutationObserver(() => this.processAllArticles());
      this.mainObserver.observe(articleContainer, {
        childList: true,
        subtree: true,
      });
    }

    // Initial run
    this.processAllArticles();
  }

  /**
   * Stop observing the Instagram feed
   */
  public stopObserving() {
    if (this.mainObserver) {
      this.mainObserver.disconnect();
      this.mainObserver = null;
    }
    this.articleShortcodes.clear();
  }

  /**
   * Process all articles on the page, adds elements depending on the shortcode as stored in the articleShortcodes map
   */
  private processAllArticles() {
    const articles = document.querySelectorAll("article");
    articles.forEach((article) => {
      const linkElement = article.querySelector(
        'a[href*="/p/"], a[href*="/r/"]'
      );
      const currentLink = linkElement?.getAttribute("href") || null;
      const shortCode = extractShortcodeFromUrl(currentLink);

      if (shortCode) {
        const knownShortcode = this.articleShortcodes.get(article);
        if (knownShortcode !== shortCode) {
          this.addOrUpdateInteractiveElement(article as HTMLElement, shortCode);
          this.articleShortcodes.set(article as HTMLElement, shortCode);
        }
      } else {
        // If no shortcode, remove from map
        this.articleShortcodes.delete(article as HTMLElement);
      }
    });
  }
  /**
   * Adds or updates the interactive element (button or badge) for a given article
   * @param article
   * @param shortCode
   */
  private addOrUpdateInteractiveElement(
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
      element = createButton(shortCode, this.handleButtonClick.bind(this));
    }

    addElementToArticle(element, article);
  }

  /**
   * Button click handler that fetches the post content and sends it to the background script for analysis
   * @param event
   */
  private async handleButtonClick(event: MouseEvent) {
    const button = event.currentTarget as HTMLButtonElement;
    const originalText = button.textContent;
    const shortCode = button.getAttribute("data-shortcode");
    if (!shortCode) return;

    if (analysisResults.has(shortCode)) {
      replaceButtonWithBadge(button, shortCode);
      return;
    }

    button.textContent = labels.Button.loading;
    button.disabled = true;

    try {
      const caption = await instagramApi.fetchPost(shortCode);

      chrome.runtime.sendMessage(
        {
          type: "ANALYSE",
          payload: { post_content: caption },
        },
        (response) => {
          if (response && "prediction" in response) {
            console.log(response);
            // Save the prediction for this shortcode.
            analysisResults.set(shortCode, {
              ...(response as DetectionReport),
              reported: false,
            });

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
      button.textContent = labels.Button.error;
      button.disabled = false;
    }
  }
}
