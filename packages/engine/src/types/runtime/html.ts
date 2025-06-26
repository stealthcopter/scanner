import type { ParsedHtml } from "../../utils";

/**
 * Utilities to interact with the HTML parser.
 */
export type HTMLParser = {
  /**
   * Get the parsed HTML for current context.
   */
  get: () => ParsedHtml | undefined;
};
