import { describe, it, expect, beforeEach } from "vitest";
import { addElementToArticle } from "../addElementToArticle";

describe("addElementToArticle", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("Should append the element directly to the article when no bookmark svg is present", () => {
    const article = document.createElement("article");
    const element = document.createElement("div");

    addElementToArticle(element, article);

    expect(article.contains(element)).toBe(true);
  });

  it("Should append the element to the second DIV inside the section when bookmarkSvg exists (main feed scenario)", () => {
    const article = document.createElement("article");
    const bookmarkSvg = document.createElement("svg");
    bookmarkSvg.setAttribute("aria-label", "Save");

    const section = document.createElement("section");
    section.appendChild(bookmarkSvg);

    const div1 = document.createElement("div");
    const div2 = document.createElement("div");
    section.appendChild(div1);
    section.appendChild(div2);
    article.appendChild(section);

    const element = document.createElement("span");
    addElementToArticle(element, article);

    expect(div2.contains(element)).toBe(true);
    expect(div2.style.display).toBe("flex");
    expect(div2.style.flexDirection).toBe("row-reverse");
  });

  it("Should create a container and append the element in posts/reels scenario when no container exists", () => {
    const article = document.createElement("article");
    const bookmarkSvg = document.createElement("svg");
    bookmarkSvg.setAttribute("aria-label", "Save");

    const section = document.createElement("section");
    section.appendChild(bookmarkSvg);

    const span1 = document.createElement("span");
    const span2 = document.createElement("span");
    const span3 = document.createElement("span");
    const span4 = document.createElement("span");
    section.append(span1, span2, span3, span4);

    article.appendChild(section);

    const element = document.createElement("div");
    addElementToArticle(element, article);

    const container = span4.querySelector('[data-mlm-detector="container"]');
    expect(container).toBeDefined();
    expect(container?.contains(element)).toBe(true);
    expect(span4.style.display).toBe("flex");
    expect(span4.style.flexDirection).toBe("row-reverse");
  });

  it("Should replace an existing interactive element in the container", () => {
    const article = document.createElement("article");
    const bookmarkSvg = document.createElement("svg");
    bookmarkSvg.setAttribute("aria-label", "Save");

    const section = document.createElement("section");
    section.appendChild(bookmarkSvg);

    const span1 = document.createElement("span");
    const span2 = document.createElement("span");
    const span3 = document.createElement("span");
    const span4 = document.createElement("span");
    section.append(span1, span2, span3, span4);

    article.appendChild(section);

    const container = document.createElement("div");
    container.classList.add("mlm-detector-container");
    container.setAttribute("data-mlm-detector", "container");

    const existingElement = document.createElement("div");
    existingElement.setAttribute("data-mlm-detector", "badge");
    container.appendChild(existingElement);
    span4.appendChild(container);

    const newElement = document.createElement("div");
    addElementToArticle(newElement, article);

    expect(container.contains(newElement)).toBe(true);
    expect(container.contains(existingElement)).toBe(false);
  });
});
