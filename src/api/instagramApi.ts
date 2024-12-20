import { GRAPHQL_ENDPOINT, INSTAGRAM_DOCUMENT_ID } from "./constants";
import jmespath from "jmespath";

/**
 * Parses GRAPHQL POST response
 * @param data
 */
function parsePostData(data: Record<string, any>) {
  const parsedData = jmespath.search(
    data,
    `xdt_shortcode_media.edge_media_to_caption.edges[0].node.text`
  );
  return parsedData;
}

/**
 * Fetchs the full post data from instagram GRAPHQL endpoint using shortcode
 * @param shortcode
 */
async function fetchPost(shortcode: string) {
  const variables = {
    shortcode,
    fetch_tagged_user_count: null,
    hoisted_comment_id: null,
    hoisted_reply_id: null,
  };

  const body = `variables=${encodeURIComponent(
    JSON.stringify(variables)
  )}&doc_id=${INSTAGRAM_DOCUMENT_ID}`;

  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data;
    if (data) {
      const captions = parsePostData(data);
      if (captions) {
        return JSON.stringify(captions);
      }
    }
    throw new Error(`Data error: captions missing`);
  } catch (error) {
    console.error("Failed to fetch post data:", error);
    return null;
  }
}

export const instagramApi = {
  fetchPost,
};
