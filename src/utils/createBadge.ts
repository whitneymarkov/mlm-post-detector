import { DetectionResult } from "../types";
import { analysisResults } from "./analysisResults";
import { labels } from "./labels";

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

  const prediction = analysisResults.get(shortCode)?.prediction;

  switch (prediction) {
    case DetectionResult.MLM:
      badge.classList.add("detected");
      badge.textContent = labels.Badge.MLM;
      break;
    case DetectionResult.General:
      badge.classList.add("not-detected");
      badge.textContent = labels.Badge.General;
      break;
    default:
      badge.classList.add("unknown");
      badge.textContent = loading ? "Analysing..." : "Unknown";
  }

  return badge;
}
