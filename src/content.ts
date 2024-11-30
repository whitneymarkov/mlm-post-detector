import jmespath from "jmespath";

const GRAPHQL_ENDPOINT = "https://www.instagram.com/graphql/query";
const INSTAGRAM_DOCUMENT_ID = "8845758582119845"; // Static document ID for posts

let previousArticleCount = 0; // Track the number of observed articles

/**
 * 
 *     likes: edge_media_preview_like.count,
    tagged_users: edge_media_to_tagged_user.edges[].node.user.username,
    is_ad: is_ad,
    is_affiliate: is_affiliate,
    is_paid_partnership: is_paid_partnership,
 */
function parsePostData(data: Record<string, any>) {
  const parsedData = jmespath.search(
    data,
    `{
    id: id,
    shortcode: shortcode,
    captions: edge_media_to_caption.edges[].node.text
  }`
  );
  return parsedData;
}

// Fetch post metadata using Instagram's GraphQL API
async function fetchPostMetadata(shortcode: string) {
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
    const data = result.data.xdt_shortcode_media;
    if (data) {
      const parsedData = parsePostData(data);
      console.log("GraphQL Post Data:", parsedData);
      return parsedData;
    }
    throw new Error(`Data error: data.xdt_shortcode_media missing`);
  } catch (error) {
    console.error("Failed to fetch post data:", error);
    return null;
  }
}

// Extract shortcode from a post's URL
function extractShortcodeFromUrl(url: string | null | undefined) {
  if (typeof url === "string") {
    const match = url.match(/\/p\/([^/]+)\//);
    return match ? match[1] : null;
  }
  return null;
}

// Process new posts to fetch their metadata and perform actions
async function processNewPosts() {
  const articles = document.querySelectorAll("article");
  const currentArticleCount = articles.length;

  if (currentArticleCount > previousArticleCount) {
    console.log(
      `New posts detected! Old count: ${previousArticleCount}, New count: ${currentArticleCount}`
    );

    const newArticles = Array.from(articles).slice(previousArticleCount);

    for (const article of newArticles) {
      const linkElement = article.querySelector('a[href*="/p/"]');
      const postLink = linkElement?.getAttribute("href");
      const shortcode = postLink ? extractShortcodeFromUrl(postLink) : null;

      if (shortcode) {
        console.log(`Fetching metadata for shortcode: ${shortcode}`);
        const postData = await fetchPostMetadata(shortcode);

        if (postData) {
          // Example: Highlight posts containing MLM-related keywords
          const caption = postData.captions.forEach(() => {
            if (caption.toLowerCase().includes("mlm")) {
              article.style.border = "2px solid red"; // Mark flagged posts
              console.log(`Flagged MLM post: ${caption}`);
              return;
            }
          });
        }
      }
    }

    previousArticleCount = currentArticleCount; // Update the count
  }
}

// Observe new articles and throttle the processing
function observeNewArticles() {
  const throttledProcessNewPosts = (() => {
    let isProcessing = false;

    return () => {
      if (isProcessing) return; // Skip if already processing
      isProcessing = true;

      setTimeout(async () => {
        await processNewPosts();
        isProcessing = false;
      }, 1000); // Throttle requests to avoid API rate-limiting
    };
  })();

  const observer = new MutationObserver(() => {
    console.log("Mutation observed!");
    throttledProcessNewPosts();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  previousArticleCount = document.querySelectorAll("article").length;
  console.log(`Initial article count: ${previousArticleCount}`);
}

// Start observing
console.log("Content script loaded");
observeNewArticles();
