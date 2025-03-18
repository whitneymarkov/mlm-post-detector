import { describe, it, expect, beforeEach } from "vitest";
import { createBadge } from "../createBadge";
import { DetectionResult } from "../../types";
import { analysisResults } from "../analysisResults";
import { labels } from "../labels";

describe("createBadge", () => {
  const shortCode = "abc123";

  beforeEach(() => {
    analysisResults.clear();
  });

  it('Should create a badge with "unknown" class and text "Unknown" when no prediction and loading is false', () => {
    const badge = createBadge(shortCode, false);

    expect(badge.tagName).toBe("SPAN");
    expect(badge.classList.contains("mlm-detector-badge")).toBe(true);
    expect(badge.classList.contains("unknown")).toBe(true);
    expect(badge.textContent).toBe("Unknown");
    expect(badge.getAttribute("data-shortcode")).toBe(shortCode);
  });

  it('Should create a badge with "unknown" class and text "Analysing..." when no prediction and loading is true', () => {
    const badge = createBadge(shortCode, true);

    expect(badge.classList.contains("unknown")).toBe(true);
    expect(badge.textContent).toBe("Analysing...");
  });

  it('Should create a badge with "detected" class and proper text when prediction is MLM', () => {
    analysisResults.set(shortCode, { prediction: DetectionResult.MLM });

    const badge = createBadge(shortCode, false);

    expect(badge.classList.contains("detected")).toBe(true);
    expect(badge.textContent).toBe(labels.Badge.MLM);
  });

  it('Should create a badge with "not-detected" class and proper text when prediction is General', () => {
    analysisResults.set(shortCode, { prediction: DetectionResult.General });

    const badge = createBadge(shortCode, false);

    expect(badge.classList.contains("not-detected")).toBe(true);
    expect(badge.textContent).toBe(labels.Badge.General);
  });
});
