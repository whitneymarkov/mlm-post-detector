let previousArticleCount = 0;

async function fetchMetadataFromBackground(url: string) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type: "FETCH_METADATA", url }, (response) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Error sending message to background script:",
          chrome.runtime.lastError
        );
        reject(chrome.runtime.lastError);
      } else if (response.error) {
        console.error(
          "Error in response from background script:",
          response.error
        );
        reject(response.error);
      } else {
        resolve(response);
      }
    });
  });
}

async function processNewPosts() {
  const articles = document.querySelectorAll("article");
  const currentArticleCount = articles.length;

  console.log(`previousArticleCount: ${previousArticleCount}`);
  console.log(`currentArticleCount: ${currentArticleCount}`);

  if (currentArticleCount > previousArticleCount) {
    console.log(
      `New posts detected! Old count: ${previousArticleCount}, New count: ${currentArticleCount}`
    );

    const newArticles = Array.from(articles).filter(
      (article) => !article.hasAttribute("data-processed")
    );

    for (const article of newArticles) {
      const linkElement = article.querySelector(
        'a[href*="/p/"], a[href*="/reel/"]'
      );
      const postLink = linkElement
        ? `https://www.instagram.com${linkElement.getAttribute("href")}`
        : null;

      console.log(`Processing new post: ${postLink}`);

      if (postLink) {
        try {
          const postText = await fetchMetadataFromBackground(postLink);
          console.log(postText);
          article.style.border = "2px solid green"; // Mark successful
        } catch (error) {
          console.error(`Error processing post: ${postLink}`, error);
          article.style.border = "2px solid red"; // Mark failure
        }
      }

      article.setAttribute("data-processed", "true");
    }

    previousArticleCount = currentArticleCount;
  }
}

function observeNewArticles() {
  const throttledProcessNewPosts = (() => {
    let isProcessing = false;

    return () => {
      if (isProcessing) return;
      isProcessing = true;

      setTimeout(async () => {
        await processNewPosts();
        isProcessing = false;
      }, 500); // Adjust delay as needed
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

observeNewArticles();

fetch("https://www.instagram.com/p/DC4oGVCJwE-/")
  .then((response) => {
    console.log("Manual fetch response:", response);
    return response.text();
  })
  .then((html) => {
    console.log("Fetched HTML:", html);
  })
  .catch((error) => {
    console.error("Manual fetch failed:", error);
  });
