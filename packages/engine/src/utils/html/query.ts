import { SyntaxKind, walk } from "html5parser";

import type { ElementSelector, HtmlElement, HtmlNode } from "./types";

export function findElements(
  ast: HtmlNode[],
  selector: ElementSelector,
): HtmlElement[] {
  const results: HtmlElement[] = [];

  walk(ast, {
    enter: (node) => {
      if (node.type === SyntaxKind.Tag && matchesSelector(node, selector)) {
        results.push(node);
      }
    },
  });

  return results;
}

export function getElementAttribute(
  element: HtmlElement,
  attributeName: string,
): string | undefined {
  if (!element.attributeMap) {
    const attr = element.attributes.find(
      (a) => a.name.value.toLowerCase() === attributeName.toLowerCase(),
    );
    return attr?.value?.value;
  }

  const attr = element.attributeMap[attributeName.toLowerCase()];
  return attr?.value?.value;
}

export function getElementText(element: HtmlElement): string {
  if (!element.body || !Array.isArray(element.body)) {
    return "";
  }

  let text = "";
  walk(element.body, {
    enter: (node) => {
      if (node.type === SyntaxKind.Text) {
        text += node.value;
      }
    },
  });

  return text.trim();
}

function matchesSelector(
  element: HtmlElement,
  selector: ElementSelector,
): boolean {
  if (
    selector.tagName !== undefined &&
    element.name !== selector.tagName.toLowerCase()
  ) {
    return false;
  }

  return true;
}
