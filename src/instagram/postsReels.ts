import { instagramApi } from "../api/instagramApi"; // adjust path as needed
import { DetectionReport } from "../types";
import { addElementToArticle } from "../utils/addElementToArticle";
import { analysisResults } from "../utils/analysisResults";
import { createBadge } from "../utils/createBadge";
import { extractShortcodeFromUrl } from "../utils/shortCode";

/**
 * Display the detection result below the first <article>
 */
function displayResultBelowArticle(shortCode: string, loading = false) {
  const firstArticle = document.querySelector("article");
  if (!firstArticle) {
    console.warn("No article found to display results below.");
    return;
  }

  const badge = createBadge(shortCode, loading);
  console.log(firstArticle);
  addElementToArticle(badge, firstArticle);
}

/**
 * Handle logic for a single post or reel page.
 * This function fetches the post content and sends it for analysis.
 */
export async function handleSinglePostOrReel(pathname: string) {
  const shortCode = extractShortcodeFromUrl(pathname);

  if (!shortCode) {
    console.warn("No shortcode found in URL:", pathname);
    return;
  }

  if (analysisResults.has(shortCode)) {
    console.log("Post already analysed, skipping new fetch.");
    displayResultBelowArticle(shortCode);
    return;
  }

  try {
    const caption = await instagramApi.fetchPost(shortCode);
    displayResultBelowArticle(shortCode, true);

    chrome.runtime.sendMessage(
      { type: "analyse", payload: { post_content: caption } },
      (response) => {
        if (response && response.prediction) {
          // Save the prediction for this shortcode.
          analysisResults.set(shortCode, response as DetectionReport);
          console.log(analysisResults);
        } else {
          console.warn("Analysis failed or no prediction received.");
        }
        displayResultBelowArticle(shortCode, false);
      }
    );
  } catch (error) {
    console.error("Failed to fetch post data:", error);
  }
}
