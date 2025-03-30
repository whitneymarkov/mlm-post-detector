import { DetectionResult } from "../types";
import { analysisResults } from "./analysisResults";
import { labels } from "./labels";
import { attachPopover } from "./shapPopover";
/**
 * Create a badge element to show the result of the analysis
 * @param shortCode
 * @returns HTMLSpanElement
 */
export function createBadge(
  shortCode: string,
  loading = false
): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.classList.add("mlm-detector-badge");
  badge.setAttribute("data-mlm-detector", "badge");
  badge.setAttribute("data-shortcode", shortCode);

  const result = analysisResults.get(shortCode);

  if (!result) {
    badge.classList.add("unknown");
    badge.textContent = loading ? "Analysing..." : "Unknown";
    return badge;
  }

  badge.setAttribute("tabindex", "0"); // Make focusable
  const { prediction, confidence, word_scores } = result;

  if (prediction === DetectionResult.MLM) {
    badge.classList.add("detected");
    badge.textContent = labels.Badge.MLM + " (" + confidence + "%)";
  }

  if (prediction === DetectionResult.General) {
    badge.classList.add("not-detected");
    badge.textContent = labels.Badge.General + " (" + confidence + "%)";
  }

  // If explainability data exists, initialise Tippy on the badge.
  if (word_scores && Array.isArray(word_scores) && word_scores.length > 0) {
    attachPopover(shortCode, badge, result);
  }

  return badge;
}
