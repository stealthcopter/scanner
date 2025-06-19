import type { ParsedHtml } from "../../utils";

/**
 * Utilities to interact with the HTML parser.
 */
export type HtmlSDK = {
  /**
   * Used internally to avoid running the HTML parser multiple times on same requestID.
   * Map<requestID, ParsedHtml>
   */
  _cache: Map<string, ParsedHtml>;

  /**
   * Get the parsed HTML for current context.
   */
  get: () => ParsedHtml | undefined;
};
