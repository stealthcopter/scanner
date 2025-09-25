import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import cookieSecureCheck from "./index";

describe("Cookie Secure Flag Check", () => {
  it("should detect TLS cookie without Secure flag", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/login",
      tls: true, // TLS connection
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "set-cookie": ["sessionid=abc123; HttpOnly"], // Missing Secure flag
      },
      body: "Login successful",
    });

    const executionHistory = await runCheck(cookieSecureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-secure",
        targetRequestId: "1",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieSecure",
            findings: [
              {
                name: "TLS cookie without Secure flag set",
                description: expect.stringContaining(
                  "The cookie 'sessionid' is set over a TLS connection without the Secure flag",
                ),
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect multiple TLS cookies without Secure flag", async () => {
    const request = createMockRequest({
      id: "2",
      host: "example.com",
      method: "GET",
      path: "/dashboard",
      tls: true,
    });

    const response = createMockResponse({
      id: "2",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionid=abc123; HttpOnly",
          "userid=456; HttpOnly",
          "preferences=dark; HttpOnly",
        ],
      },
      body: "Dashboard",
    });

    const executionHistory = await runCheck(cookieSecureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-secure",
        targetRequestId: "2",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieSecure",
            findings: [
              {
                name: "TLS cookie without Secure flag set",
                description: expect.stringContaining("The cookie 'sessionid'"),
                severity: "medium",
              },
              {
                name: "TLS cookie without Secure flag set",
                description: expect.stringContaining("The cookie 'userid'"),
                severity: "medium",
              },
              {
                name: "TLS cookie without Secure flag set",
                description: expect.stringContaining(
                  "The cookie 'preferences'",
                ),
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not detect cookies with Secure flag on TLS", async () => {
    const request = createMockRequest({
      id: "3",
      host: "example.com",
      method: "GET",
      path: "/secure",
      tls: true,
    });

    const response = createMockResponse({
      id: "3",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionid=abc123; HttpOnly; Secure",
          "userid=456; HttpOnly; Secure; SameSite=Strict",
        ],
      },
      body: "Secure page",
    });

    const executionHistory = await runCheck(cookieSecureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-secure",
        targetRequestId: "3",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieSecure",
            findings: [], // No findings - cookies have Secure flag
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not run on HTTP connections", async () => {
    const request = createMockRequest({
      id: "4",
      host: "example.com",
      method: "GET",
      path: "/http",
      tls: false, // HTTP connection
    });

    const response = createMockResponse({
      id: "4",
      code: 200,
      headers: {
        "set-cookie": ["sessionid=abc123"], // No Secure flag, but HTTP connection
      },
      body: "HTTP page",
    });

    const executionHistory = await runCheck(cookieSecureCheck, [
      { request, response },
    ]);

    // Check should not run on HTTP connections
    expect(executionHistory).toMatchObject([]);
  });

  it("should not run when no response", async () => {
    const request = createMockRequest({
      id: "5",
      host: "example.com",
      method: "GET",
      path: "/no-response",
      tls: true,
    });

    const executionHistory = await runCheck(cookieSecureCheck, [
      { request, response: undefined },
    ]);

    // Check should not run when no response
    expect(executionHistory).toMatchObject([]);
  });

  it("should find no issues when no cookies are set", async () => {
    const request = createMockRequest({
      id: "6",
      host: "example.com",
      method: "GET",
      path: "/no-cookies",
      tls: true,
    });

    const response = createMockResponse({
      id: "6",
      code: 200,
      headers: {},
      body: "No cookies",
    });

    const executionHistory = await runCheck(cookieSecureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-secure",
        targetRequestId: "6",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieSecure",
            findings: [], // No findings - no cookies set
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should handle mixed cookies with and without Secure flag", async () => {
    const request = createMockRequest({
      id: "7",
      host: "example.com",
      method: "GET",
      path: "/mixed",
      tls: true,
    });

    const response = createMockResponse({
      id: "7",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionid=abc123; HttpOnly; Secure", // Has Secure flag
          "userid=456; HttpOnly", // Missing Secure flag
          "preferences=dark; HttpOnly; Secure; SameSite=Strict", // Has Secure flag
        ],
      },
      body: "Mixed cookies",
    });

    const executionHistory = await runCheck(cookieSecureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-secure",
        targetRequestId: "7",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieSecure",
            findings: [
              {
                name: "TLS cookie without Secure flag set",
                description: expect.stringContaining("The cookie 'userid'"),
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should handle cookies with various attributes", async () => {
    const request = createMockRequest({
      id: "8",
      host: "example.com",
      method: "GET",
      path: "/complex",
      tls: true,
    });

    const response = createMockResponse({
      id: "8",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionid=abc123; HttpOnly; Domain=.example.com; Path=/; Max-Age=3600", // Missing Secure
          "userid=456; HttpOnly; Secure; SameSite=Lax; Expires=Wed, 09 Jun 2021 10:18:14 GMT", // Has Secure
        ],
      },
      body: "Complex cookies",
    });

    const executionHistory = await runCheck(cookieSecureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-secure",
        targetRequestId: "8",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieSecure",
            findings: [
              {
                name: "TLS cookie without Secure flag set",
                description: expect.stringContaining("The cookie 'sessionid'"),
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should handle case-insensitive Secure flag", async () => {
    const request = createMockRequest({
      id: "9",
      host: "example.com",
      method: "GET",
      path: "/case",
      tls: true,
    });

    const response = createMockResponse({
      id: "9",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionid=abc123; HttpOnly; SECURE", // Uppercase Secure
          "userid=456; HttpOnly; secure", // Lowercase secure
        ],
      },
      body: "Case test",
    });

    const executionHistory = await runCheck(cookieSecureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-secure",
        targetRequestId: "9",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieSecure",
            findings: [], // No findings - both cookies have Secure flag (case-insensitive)
            result: "done",
          },
        ],
      },
    ]);
  });
});
