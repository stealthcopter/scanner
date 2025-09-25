import type { Response } from "caido:utils";

export type SetCookieHeader = {
  key: string;
  value: string;
  isHttpOnly: boolean;
  isSecure: boolean;
  sameSite?: string;
  domain?: string;
  path?: string;
  maxAge?: string;
  expires?: string;
  flags: Record<string, unknown>;
};

/**
 * Extracts and parses Set-Cookie headers from a response.
 * 
 * @param response - The response object to extract Set-Cookie headers from
 * @returns Array of SetCookieHeader objects with parsed cookie information
 */
export function getSetCookieHeaders(response: Response): SetCookieHeader[] {
  const setCookieHeaders = response.getHeader("set-cookie");

  if (!setCookieHeaders || setCookieHeaders.length === 0) {
    return [];
  }

  const parsedCookies: SetCookieHeader[] = [];

  for (const cookieHeader of setCookieHeaders) {
    if (cookieHeader === undefined) {
      continue;
    }

    // Parse cookie attributes
    const cookieParts = cookieHeader.split(";").map((part) => part.trim());
    
    // Extract key=value from the first part
    const firstPart = cookieParts[0];
    if (firstPart === undefined) {
      continue;
    }
    
    const equalIndex = firstPart.indexOf("=");
    if (equalIndex === -1) {
      continue;
    }
    
    const key = firstPart.substring(0, equalIndex);
    const value = firstPart.substring(equalIndex + 1);
    
    // Parse flags from remaining parts
    const flags: Record<string, unknown> = {};
    let hasHttpOnly = false;
    let hasSecure = false;
    let sameSite: string | undefined;
    let domain: string | undefined;
    let path: string | undefined;
    let maxAge: string | undefined;
    let expires: string | undefined;
    
    for (let i = 1; i < cookieParts.length; i++) {
      const part = cookieParts[i];
      if (part === undefined) {
        continue;
      }
      
      const lowerPart = part.toLowerCase();
      
      if (lowerPart === "httponly") {
        hasHttpOnly = true;
      } else if (lowerPart === "secure") {
        hasSecure = true;
      } else if (lowerPart.startsWith("samesite=")) {
        sameSite = part.substring(9);
      } else if (lowerPart.startsWith("domain=")) {
        domain = part.substring(7);
      } else if (lowerPart.startsWith("path=")) {
        path = part.substring(5);
      } else if (lowerPart.startsWith("max-age=")) {
        maxAge = part.substring(8);
      } else if (lowerPart.startsWith("expires=")) {
        expires = part.substring(8);
      } else {
        // Store any other flags as-is
        flags[part] = true;
      }
    }

    parsedCookies.push({
      key,
      value,
      isHttpOnly: hasHttpOnly,
      isSecure: hasSecure,
      sameSite,
      domain,
      path,
      maxAge,
      expires,
      flags,
    });
  }

  return parsedCookies;
}
