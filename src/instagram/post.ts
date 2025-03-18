import { instagramApi } from "../api/instagramApi";
import { DetectionReport } from "../types";
import { addElementToArticle } from "../utils/addElementToArticle";
import { analysisResults } from "../utils/analysisResults";
import { createBadge } from "../utils/createBadge";
import { extractShortcodeFromUrl } from "../utils/shortCode";

export class InstagramPostHandler {
  constructor(private pathname: string) {
    this.processPath();
  }

  /**
   * Fetches the post content and sends it for analysis
   */
  private async processPath() {
    const shortCode = extractShortcodeFromUrl(this.pathname);

    if (!shortCode) {
      console.warn("No shortcode found in URL:", this.pathname);
      return;
    }

    if (analysisResults.has(shortCode)) {
      this.displayResultBelowArticle(shortCode);
      return;
    }

    try {
      const caption = await instagramApi.fetchPost(shortCode);
      this.displayResultBelowArticle(shortCode, true);

      chrome.runtime.sendMessage(
        { type: "ANALYSE", payload: { post_content: caption } },
        (response) => {
          if (response && response.prediction) {
            // Save the prediction
            analysisResults.set(shortCode, response as DetectionReport);
          } else {
            console.warn("Analysis failed or no prediction received.");
          }
          this.displayResultBelowArticle(shortCode, false);
        }
      );
    } catch (error) {
      console.error("Failed to fetch post data:", error);
    }
  }
  /**
   * Display the detection result below the first <article>
   */
  private displayResultBelowArticle(shortCode: string, loading = false) {
    const firstArticle = document.querySelector("article");
    if (!firstArticle) {
      console.warn("No article found to display results below.");
      return;
    }

    const badge = createBadge(shortCode, loading);

    addElementToArticle(badge, firstArticle);
  }
}
