/**
 * Add the interactive element to the article
 * @param element
 * @param article
 */
export function addElementToArticle(element: Element, article: HTMLElement) {
  const bookmarkSvg = article.querySelector('svg[aria-label="Save"]');
  if (bookmarkSvg) {
    const section = bookmarkSvg.closest("section");

    if (section) {
      section.style.alignItems = "center";

      // Main feed
      const sectionChildren = Array.from(section.children).filter(
        (el: Element) => el.tagName === "DIV"
      );
      // Posts/reels page
      const articleChildren = Array.from(section.children).filter(
        (el: Element) => el.tagName === "SPAN"
      );

      if (sectionChildren.length >= 2) {
        // Main feed
        const targetDiv = sectionChildren[1] as HTMLDivElement;
        if (element.parentElement !== targetDiv) {
          targetDiv.appendChild(element);
          targetDiv.style.display = "flex";
          targetDiv.style.flexDirection = "row-reverse";
        }
      } else if (articleChildren.length === 4) {
        // Posts/reels page
        const targetSpan = articleChildren[3] as HTMLSpanElement;
        let container = targetSpan.querySelector(
          '[data-mlm-detector="container"]'
        );
        if (!container) {
          container = document.createElement("div");
          container.classList.add("mlm-detector-container");
          container.setAttribute("data-mlm-detector", "container");
          targetSpan.appendChild(container);
        }

        // If an interactive element already exists, replace it
        const existingElement = container.querySelector(
          '[data-mlm-detector="badge"]'
        );
        if (existingElement) {
          container.replaceChild(element, existingElement);
          return;
        }

        if (element.parentElement !== container) {
          container.appendChild(element);
          targetSpan.style.display = "flex";
          targetSpan.style.flexDirection = "row-reverse";
        }
      }
    } else {
      article.appendChild(element);
    }
  } else {
    article.appendChild(element);
  }
}
