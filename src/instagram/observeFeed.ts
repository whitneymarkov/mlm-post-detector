import { instagramApi } from "../api/instagramApi";
import { extractShortcodeFromUrl } from "../utils/shortCode";

async function handleButtonClick(event: Event) {
  const button = event.currentTarget as HTMLButtonElement;
  const originalText = button.textContent;
  const shortCode = button.getAttribute("data-shortcode");
  if (shortCode) {
    button.textContent = "Analysing...";
    button.disabled = true;

    try {
      const caption = await instagramApi.fetchPost(shortCode);
      console.log(caption);

      chrome.runtime.sendMessage(
        {
          type: "analyse",
          payload: { post_content: caption },
        },
        (response) => {
          if (response && response.prediction) {
            console.log("Prediction:", response.prediction);
          } else {
            console.warn("Analysis failed or no prediction received.");
          }
          button.textContent = originalText;
          button.disabled = false;
        }
      );
    } catch (error) {
      console.warn(error);
      button.textContent = "Analysis failed.";
      button.disabled = false;
    }
  }
}

function addOrUpdateButton(article: HTMLElement, shortcode: string) {
  let button = article.querySelector(".mlm-detector-button");
  if (!button) {
    button = document.createElement("button");
    button.textContent = "Analyse post";
    button.classList.add("mlm-detector-button");
    button.setAttribute("data-mlm-detector", "button");
    button.addEventListener("click", handleButtonClick);
  }

  const bookmarkSvg = article.querySelector('svg[aria-label="Save"]');
  if (bookmarkSvg) {
    const section = bookmarkSvg.closest("section");
    if (section) {
      const sectionChildren = Array.from(section.children).filter(
        (el: Element) => el.tagName === "DIV"
      );
      if (sectionChildren.length >= 2) {
        const targetDiv = sectionChildren[1] as HTMLDivElement;
        if (button.parentElement !== targetDiv) {
          targetDiv.appendChild(button);
          targetDiv.style.display = "flex";
          targetDiv.style.flexDirection = "row-reverse";
        }
      } else {
        article.appendChild(button);
      }
    } else {
      article.appendChild(button);
    }
  } else {
    article.appendChild(button);
  }

  button.setAttribute("data-shortcode", shortcode);
}

const articleShortcodes = new Map<HTMLElement, string>();

function processAllArticles() {
  const articles = document.querySelectorAll("article");
  articles.forEach((article) => {
    const linkElement = article.querySelector('a[href*="/p/"], a[href*="/r/"]');
    const currentLink = linkElement?.getAttribute("href") || null;
    const shortcode = extractShortcodeFromUrl(currentLink);

    if (shortcode) {
      const knownShortcode = articleShortcodes.get(article);
      if (knownShortcode !== shortcode) {
        addOrUpdateButton(article as HTMLElement, shortcode);
        articleShortcodes.set(article as HTMLElement, shortcode);
      }
    } else {
      // If no shortcode, remove from map
      articleShortcodes.delete(article as HTMLElement);
    }
  });
}

let mainObserver: MutationObserver | null = null;

function observeNewArticles() {
  if (mainObserver) {
    processAllArticles();
    return;
  }

  // Find the first article
  const firstArticle = document.querySelector("article");
  if (!firstArticle) {
    // If no article is found yet, just observe body or
    // wait until one appears. For now, observe body as fallback.
    mainObserver = new MutationObserver(() => processAllArticles());
    mainObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
    return;
  }

  // Target the direct parent container of the first article
  const articleContainer = firstArticle.parentElement;
  if (!articleContainer) {
    // Fallback to document.body if something unexpected occurs
    mainObserver = new MutationObserver(() => processAllArticles());
    mainObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  } else {
    // Observe only this parent container
    mainObserver = new MutationObserver(() => processAllArticles());
    mainObserver.observe(articleContainer, {
      childList: true,
      subtree: true,
    });
  }

  // Initial run
  processAllArticles();
}

function stopObserving() {
  if (mainObserver) {
    mainObserver.disconnect();
    mainObserver = null;
  }
  articleShortcodes.clear();
}

export const instagramFeed = {
  observeNewArticles,
  stopObserving,
};
