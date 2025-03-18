import { describe, it, expect } from "vitest";
import { extractShortcodeFromUrl } from "../../utils/shortCode";

describe("extractShortcodeFromUrl", () => {
  it("Should extract the shortcode from a post URL", () => {
    const url = "https://www.instagram.com/p/abc123xyz/";
    const shortcode = extractShortcodeFromUrl(url);
    expect(shortcode).toBe("abc123xyz");
  });

  it("Should extract the shortcode from a reel URL", () => {
    const url = "https://www.instagram.com/r/def456uvw/";
    const shortcode = extractShortcodeFromUrl(url);
    expect(shortcode).toBe("def456uvw");
  });

  it("Should return null when the URL does not match the expected pattern", () => {
    const url = "https://www.instagram.com/stories/ghi789/";
    const shortcode = extractShortcodeFromUrl(url);
    expect(shortcode).toBeNull();
  });

  it("Should return null when given a null URL", () => {
    const shortcode = extractShortcodeFromUrl(null);
    expect(shortcode).toBeNull();
  });

  it("Should return null if URL is missing the trailing slash", () => {
    const url = "https://www.instagram.com/p/abc123xyz";
    const shortcode = extractShortcodeFromUrl(url);
    expect(shortcode).toBeNull();
  });
});
