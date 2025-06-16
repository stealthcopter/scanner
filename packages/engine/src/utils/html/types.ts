import type { IAttribute, INode, ITag, IText } from "html5parser";

export type HtmlElement = ITag;
export type HtmlTextNode = IText;
export type HtmlNode = INode;
export type HtmlAttribute = IAttribute;

export type ElementSelector = {
  tagName?: string;
};

export type ParsedHtml = {
  ast: HtmlNode[];
  findElements: (selector: ElementSelector) => HtmlElement[];
  getElementAttribute: (
    element: HtmlElement,
    attributeName: string,
  ) => string | undefined;
  getElementText: (element: HtmlElement) => string;
};
