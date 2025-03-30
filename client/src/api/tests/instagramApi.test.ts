import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { instagramApi } from "../instagramApi";
import { GRAPHQL_ENDPOINT, INSTAGRAM_DOCUMENT_ID } from "../constants";

describe("instagramApi.fetchPost", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Should return captions as a JSON string when response is valid", async () => {
    const data = {
      data: {
        xdt_shortcode_media: {
          edge_media_to_caption: {
            edges: [{ node: { text: "Hello world!" } }],
          },
        },
      },
    };

    const response = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(data),
    };

    (global.fetch as any).mockResolvedValue(response);

    const result = await instagramApi.fetchPost("abd123");
    expect(result).toBe(JSON.stringify("Hello world!"));

    // Verify params
    const expectedBody = `variables=${encodeURIComponent(
      JSON.stringify({
        shortcode: "abd123",
        fetch_tagged_user_count: null,
        hoisted_comment_id: null,
        hoisted_reply_id: null,
      })
    )}&doc_id=${INSTAGRAM_DOCUMENT_ID}`;

    expect(fetch).toHaveBeenCalledWith(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: expectedBody,
    });
  });

  it("Should return null when response is not ok", async () => {
    const response = {
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({}),
    };
    (global.fetch as any).mockResolvedValue(response);

    const result = await instagramApi.fetchPost("abc123");
    expect(result).toBeNull();
  });

  it("Should return null when data is present but captions are missing", async () => {
    const data = {
      data: {
        xdt_shortcode_media: {
          edge_media_to_caption: {
            edges: [],
          },
        },
      },
    };

    const response = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(data),
    };
    (global.fetch as any).mockResolvedValue(response);

    const result = await instagramApi.fetchPost("abc123");
    expect(result).toBeNull();
  });

  it("Should log an error and return null on fetch exception", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (global.fetch as any).mockRejectedValue(new Error("Network error"));

    const result = await instagramApi.fetchPost("abc123");

    expect(result).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
