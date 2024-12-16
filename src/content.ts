import jmespath from "jmespath";

const GRAPHQL_ENDPOINT = "https://www.instagram.com/graphql/query";
const INSTAGRAM_DOCUMENT_ID = "8845758582119845"; // Static document ID for posts

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
    const data = result.data;
    if (data) {
      const captions = parsePostData(data);
      if (captions) {
        return captions;
      }
    }
    throw new Error(`Data error: captions missing`);
  } catch (error) {
    console.error("Failed to fetch post data:", error);
    return null;
  }
}

/**
 * Utility function to extract shortcode from a given URL
 * @param url
 */
function extractShortcodeFromUrl(url: string) {
  if (typeof url === "string") {
    const match = url.match(/\/(p|r)\/([^/]+)\//);
    return match ? match[2] : null;
  }
  return null;
}

/**
 * Handler for when the analyse post button is clicked
 * @param event
 */
async function handleButtonClick(event: any) {
  const button = event.currentTarget as HTMLButtonElement;
  const originalText = button.textContent;
  const shortCode = button.getAttribute("data-shortcode");
  if (shortCode) {
    // Indicate loading
    button.textContent = "Analysing...";
    button.disabled = true;

    try {
      const caption = await fetchPostMetadata(shortCode);
      console.log(JSON.stringify(caption));

      chrome.runtime.sendMessage(
        {
          type: "analyse",
          payload: { post_content: caption },
        },
        (response) => {
          // runs once background script responds
          if (response && response.prediction) {
            console.log(
              "%cPrediction:",
              "font-size:16px; font-weight:bold;",
              "%c" + response.prediction,
              "font-size:16px; font-weight:bold;"
            );
          } else {
            console.warn("Analysis failed or no prediction received.");
          }

          // Revert the button text and state
          button.textContent = originalText;
          button.disabled = false;
        }
      );
    } catch (error) {
      console.warn(error);
      button.textContent = "Analysis failed.";
    } finally {
      // Revert the button text and state
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

/**
 * Add or update the button for the article
 * @param article
 * @param shortcode
 */
function addOrUpdateButton(article: HTMLElement, shortcode: string) {
  let button = article.querySelector(".mlm-detector-button");

  if (!button) {
    button = document.createElement("button");
    button.textContent = "Analyse post";
    button.classList.add("mlm-detector-button");
    button.addEventListener("click", handleButtonClick);
  }

  // Find the bookmark icon by its aria-label
  const bookmarkSvg = article.querySelector('svg[aria-label="Save"]');
  if (bookmarkSvg) {
    // Move up to the nearest containing section
    const section = bookmarkSvg.closest("section");

    if (section) {
      // Get all direct children of the section that are divs
      const sectionChildren = Array.from(section.children).filter(
        (el: any) => el.tagName === "DIV"
      );

      // Check if there's at least two divs
      if (sectionChildren.length >= 2) {
        const targetDiv = sectionChildren[1] as HTMLDivElement; // The second div child
        if (button.parentElement !== targetDiv) {
          targetDiv.appendChild(button);
          targetDiv.style.display = "flex";
          targetDiv.style.flexDirection = "row-reverse";
        }
      } else {
        // Fallback: append to article if structure not as expected
        article.appendChild(button);
      }
    } else {
      // No section found, fallback
      article.appendChild(button);
    }
  } else {
    // No bookmark icon found, fallback
    article.appendChild(button);
  }

  button.setAttribute("data-shortcode", shortcode);
}

/**
 * Observe changes inside a single article, update button when changed
 * @param article
 */
function observeArticle(article: any) {
  const articleObserver = new MutationObserver(() => {
    const linkElement = article.querySelector('a[href*="/p/"], a[href*="/r/"]');
    const postLink = linkElement?.getAttribute("href");
    const shortcode = postLink ? extractShortcodeFromUrl(postLink) : null;

    if (shortcode) {
      addOrUpdateButton(article, shortcode);
    }
  });

  articleObserver.observe(article, {
    childList: true,
    subtree: true,
  });

  // Run once initially to set things up if already loaded
  const initialLink = article.querySelector('a[href*="/p/"], a[href*="/r/"]');
  if (initialLink) {
    const initialShortcode = extractShortcodeFromUrl(
      initialLink.getAttribute("href")
    );
    if (initialShortcode) {
      addOrUpdateButton(article, initialShortcode);
    }
  }
}

/**
 * Main observer to detect new articles
 */
function observeNewArticles() {
  const mainObserver = new MutationObserver(() => {
    const articles = document.querySelectorAll("article");
    // If article not already initialised, start observing it
    articles.forEach((article) => {
      if (!article.hasAttribute("data-observed")) {
        article.setAttribute("data-observed", "true");
        observeArticle(article);
      }
    });
  });

  mainObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Check if any articles already present
  const initialArticles = document.querySelectorAll("article");
  initialArticles.forEach((article) => {
    if (!article.hasAttribute("data-observed")) {
      article.setAttribute("data-observed", "true");
      observeArticle(article);
    }
  });
}

observeNewArticles();
