import type { Request, Response } from "caido:utils";

/**
 * Checks if the body of a Request or Response matches any of the provided regex patterns.
 * 
 * @param target - Either a Request or Response object
 * @param patterns - Array of regex patterns to test against the body
 * @returns true if any pattern matches, false otherwise
 */
export function bodyMatchesAny(
  target: Request | Response,
  patterns: RegExp[],
  options?: {
    trim?: boolean;
  }
): boolean {
  const { trim = true } = options ?? {};

  let body = target.getBody()?.toText();

  
  if (body === undefined) {
    return false;
  }

  if (trim) {
    body = body.trim();
  }

  return patterns.some(pattern => pattern.test(body));
}
