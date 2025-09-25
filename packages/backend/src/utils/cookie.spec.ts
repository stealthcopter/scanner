import { createMockResponse } from "engine";
import { describe, expect, it } from "vitest";

import { getSetCookieHeaders } from "./cookie";

describe("getSetCookieHeaders", () => {
  it("should return empty array when no Set-Cookie headers are present", () => {
    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Response body",
    });

    const result = getSetCookieHeaders(response);
    expect(result).toEqual([]);
  });

  it("should parse Set-Cookie headers with HttpOnly flag", () => {
    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionId=abc123; HttpOnly; Secure",
          "userId=456; HttpOnly; SameSite=Strict",
        ],
      },
      body: "Response body",
    });

    const result = getSetCookieHeaders(response);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      key: "sessionId",
      value: "abc123",
      isHttpOnly: true,
      isSecure: true,
      flags: {},
    });
    expect(result[1]).toEqual({
      key: "userId",
      value: "456",
      isHttpOnly: true,
      isSecure: false,
      sameSite: "Strict",
      flags: {},
    });
  });

  it("should parse Set-Cookie headers without HttpOnly flag", () => {
    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionId=abc123; Secure",
          "userId=456; SameSite=Strict",
        ],
      },
      body: "Response body",
    });

    const result = getSetCookieHeaders(response);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      key: "sessionId",
      value: "abc123",
      isHttpOnly: false,
      isSecure: true,
      flags: {},
    });
    expect(result[1]).toEqual({
      key: "userId",
      value: "456",
      isHttpOnly: false,
      isSecure: false,
      sameSite: "Strict",
      flags: {},
    });
  });

  it("should handle mixed Set-Cookie headers with and without HttpOnly", () => {
    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionId=abc123; HttpOnly; Secure",
          "userId=456; SameSite=Strict",
          "preferences=dark; HttpOnly",
        ],
      },
      body: "Response body",
    });

    const result = getSetCookieHeaders(response);
    
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      key: "sessionId",
      value: "abc123",
      isHttpOnly: true,
      isSecure: true,
      flags: {},
    });
    expect(result[1]).toEqual({
      key: "userId",
      value: "456",
      isHttpOnly: false,
      isSecure: false,
      sameSite: "Strict",
      flags: {},
    });
    expect(result[2]).toEqual({
      key: "preferences",
      value: "dark",
      isHttpOnly: true,
      isSecure: false,
      flags: {},
    });
  });

  it("should handle HttpOnly flag with different casing", () => {
    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionId=abc123; HTTPONLY; Secure",
          "userId=456; httponly; SameSite=Strict",
          "preferences=dark; HttpOnly",
        ],
      },
      body: "Response body",
    });

    const result = getSetCookieHeaders(response);
    
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      key: "sessionId",
      value: "abc123",
      isHttpOnly: true,
      isSecure: true,
      flags: {},
    });
    expect(result[1]).toEqual({
      key: "userId",
      value: "456",
      isHttpOnly: true,
      isSecure: false,
      sameSite: "Strict",
      flags: {},
    });
    expect(result[2]).toEqual({
      key: "preferences",
      value: "dark",
      isHttpOnly: true,
      isSecure: false,
      flags: {},
    });
  });

  it("should handle multiple Set-Cookie headers", () => {
    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionId=abc123; HttpOnly; Secure",
          "userId=456; SameSite=Strict",
        ],
      },
      body: "Response body",
    });

    const result = getSetCookieHeaders(response);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      key: "sessionId",
      value: "abc123",
      isHttpOnly: true,
      isSecure: true,
      flags: {},
    });
    expect(result[1]).toEqual({
      key: "userId",
      value: "456",
      isHttpOnly: false,
      isSecure: false,
      sameSite: "Strict",
      flags: {},
    });
  });

  it("should handle single Set-Cookie header", () => {
    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "set-cookie": ["sessionId=abc123; HttpOnly; Secure"],
      },
      body: "Response body",
    });

    const result = getSetCookieHeaders(response);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      key: "sessionId",
      value: "abc123",
      isHttpOnly: true,
      isSecure: true,
      flags: {},
    });
  });

  it("should parse all cookie attributes correctly", () => {
    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionId=abc123; HttpOnly; Secure; SameSite=Strict; Domain=.example.com; Path=/; Max-Age=3600; Expires=Wed, 21 Oct 2015 07:28:00 GMT",
        ],
      },
      body: "Response body",
    });

    const result = getSetCookieHeaders(response);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      key: "sessionId",
      value: "abc123",
      isHttpOnly: true,
      isSecure: true,
      sameSite: "Strict",
      domain: ".example.com",
      path: "/",
      maxAge: "3600",
      expires: "Wed, 21 Oct 2015 07:28:00 GMT",
      flags: {},
    });
  });

  it("should handle cookies with no attributes", () => {
    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "set-cookie": ["simpleCookie=value"],
      },
      body: "Response body",
    });

    const result = getSetCookieHeaders(response);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      key: "simpleCookie",
      value: "value",
      isHttpOnly: false,
      isSecure: false,
      flags: {},
    });
  });

  it("should handle cookies with unknown attributes", () => {
    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "set-cookie": ["sessionId=abc123; CustomFlag; AnotherFlag=value"],
      },
      body: "Response body",
    });

    const result = getSetCookieHeaders(response);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      key: "sessionId",
      value: "abc123",
      isHttpOnly: false,
      isSecure: false,
      flags: {
        CustomFlag: true,
        "AnotherFlag=value": true,
      },
    });
  });
});
