import { parse } from "html5parser";

import type { CheckContext } from "../../api/types";

import { findElements, getElementAttribute, getElementText } from "./query";
import type { ParsedHtml } from "./types";

export function parseHtml(context: CheckContext): ParsedHtml | undefined {
  const response = context.response;
  if (!response) {
    return undefined;
  }

  const requestId = response.getId();

  if (context.htmlCache.has(requestId)) {
    return context.htmlCache.get(requestId)!;
  }

  const body = response.getBody();
  if (!body) {
    return undefined;
  }

  const htmlText = body.toText();
  const contentTypeHeader = response.getHeader("content-type");
  const contentType = contentTypeHeader?.[0];

  if (
    contentType === undefined ||
    !contentType.toLowerCase().includes("text/html")
  ) {
    return undefined;
  }

  const ast = parse(htmlText, { setAttributeMap: true });

  const parsedHtml: ParsedHtml = {
    ast,
    findElements: (selector) => findElements(ast, selector),
    getElementAttribute,
    getElementText,
  };

  context.htmlCache.set(requestId, parsedHtml);
  return parsedHtml;
}

export function parseHtmlFromString(htmlContent: string): ParsedHtml {
  const ast = parse(htmlContent, { setAttributeMap: true });

  return {
    ast,
    findElements: (selector) => findElements(ast, selector),
    getElementAttribute,
    getElementText,
  };
}
