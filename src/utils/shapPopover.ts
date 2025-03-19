import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light.css";
import tippy, { Instance, Props } from "tippy.js";
import { DetectionResult, ShapValue } from "../types";
import { AnalysisResult, analysisResults } from "./analysisResults";

/**
 * Attaches a popover to a badge element, displays the analysis result in greater detail, particularly the words that influenced the model's decision.
 *
 * Includes a disagree button that allows users to report misclassified results
 *
 * @param shortCode
 * @param badge
 * @param result
 */
export function attachPopover(
  shortCode: string,
  badge: HTMLElement,
  result: AnalysisResult
) {
  badge.style.cursor = "pointer";

  const handleDisagreeButtonClick = (instance: Instance<Props>) => {
    chrome.runtime.sendMessage(
      {
        type: "DISAGREE",
        payload: result,
      },
      (_response) => {
        // Update global analysis results map
        analysisResults.set(shortCode, { ...result, reported: true });

        // Replace the disagree section's content
        const disagreeContainer = instance.popper.querySelector(
          ".disagree-container"
        );
        if (disagreeContainer) {
          disagreeContainer.innerHTML =
            '<span class="text-xs text-gray-400">Thanks for letting us know!</span>';
        }
      }
    );
  };

  tippy(badge, {
    content: createPopoverContent(result),
    allowHTML: true,
    interactive: true,
    placement: "top",
    theme: "light",
    animation: "shift-toward-subtle",
    onShown(instance) {
      const disagreeButton = instance.popper.querySelector(
        ".mlm-detector-disagree-btn"
      );
      if (disagreeButton) {
        disagreeButton.addEventListener(
          "click",
          () => {
            handleDisagreeButtonClick(instance);
          },
          { once: true }
        );
      }
    },
  });
}

export function createPopoverContent(result: AnalysisResult) {
  const { prediction, confidence, word_scores, reported } = result;

  const containsText =
    prediction === DetectionResult.MLM ? "contains" : "does not contain";

  // Header
  let content = `
  <div>
    <div class="p-4">
      <div class="text-lg font-bold mb-4">
        We are ${confidence}% confident that this post ${containsText} MLM related content
      </div>
      <div class="text-base font-medium">
        Highlighted below are the words that most heavily influenced the model decision:
      </div>
    </div>
    <div class="flex flex-wrap gap-1 max-h-48 overflow-y-auto px-4 mb-4">`;

  // List of words
  word_scores?.forEach((item: ShapValue) => {
    const wordStyles = getShapWordStyles(item.value);
    content += `<span class="${wordStyles} block px-1 py-0.5">${item.word}</span>`;
  });

  content += `
    </div>
    <div class="disagree-container p-4 flex items-center gap-2 justify-end">`;

  // Conditionally render the disagree UI
  if (reported) {
    content += `<span class="text-xs text-gray-400">Thanks for letting us know!</span>`;
  } else {
    content += `
      <span class="text-xs text-gray-400">Disagree with this result?</span>
      <button type="button" class="mlm-detector-disagree-btn">👎</button>`;
  }
  content += `
    </div>
  </div>`;

  return content;
}

/**
 * Returns varying intensities of red and blue background colour based on the SHAP value of the word.
 * The higher the value, the more red it is. The lower the value, the more blue it is.
 * Neutral values have no background.
 *
 * @param value the SHAP value of the word
 * @returns string styles for the word span
 */
export function getShapWordStyles(value: number): string {
  let background: string;
  let text: string;

  switch (true) {
    // Highly positive
    case value >= 0.1:
      background = "bg-red-300";
      text = "text-red-900";
      break;
    case value >= 0.05:
      background = "bg-red-200";
      text = "text-red-800";
      break;
    case value >= 0.01:
      background = "bg-red-100";
      text = "text-red-700";
      break;
    // Neutral
    case value > -0.01:
      background = "bg-transparent";
      text = "text-gray-900";
      break;
    case value >= -0.05:
      background = "bg-sky-100";
      text = "text-sky-700";
      break;
    case value >= -0.1:
      background = "bg-sky-200";
      text = "text-sky-800";
      break;
    // Highly negative
    default:
      background = "bg-sky-300";
      text = "text-sky-900";
  }

  return `${background} ${text} rounded`;
}
