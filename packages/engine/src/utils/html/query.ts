import { type INode, type ITag, SyntaxKind, walk } from "html5parser";

import type { ElementSelector } from "./types";

export function findElements(ast: INode[], selector: ElementSelector): ITag[] {
  const results: ITag[] = [];

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
  element: ITag,
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

export function getElementText(element: ITag): string {
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

function matchesSelector(element: ITag, selector: ElementSelector): boolean {
  if (
    selector.tagName !== undefined &&
    element.name !== selector.tagName.toLowerCase()
  ) {
    return false;
  }

  return true;
}
