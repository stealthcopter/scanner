import type { INode, ITag } from "html5parser";

export type ElementSelector = {
  tagName?: string;
};

export type ParsedHtml = {
  ast: INode[];
  findElements: (selector: ElementSelector) => ITag[];
  getElementAttribute: (
    element: ITag,
    attributeName: string,
  ) => string | undefined;
  getElementText: (element: ITag) => string;
};
