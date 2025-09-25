import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import cookieHttpOnlyCheck from "./index";

describe("Cookie HttpOnly Check", () => {
  it("should detect cookie without HttpOnly flag", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "set-cookie": ["sessionId=abc123; Path=/; Secure"],
      },
      body: "Response body",
    });

    const executionHistory = await runCheck(cookieHttpOnlyCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-httponly",
        targetRequestId: "1",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieHttpOnly",
            findings: [
              {
                name: "Cookie without HttpOnly flag set",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not alert when cookie has HttpOnly flag", async () => {
    const request = createMockRequest({
      id: "2",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "2",
      code: 200,
      headers: {
        "set-cookie": ["sessionId=abc123; Path=/; Secure; HttpOnly"],
      },
      body: "Response body",
    });

    const executionHistory = await runCheck(cookieHttpOnlyCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-httponly",
        targetRequestId: "2",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieHttpOnly",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect multiple cookies without HttpOnly flag", async () => {
    const request = createMockRequest({
      id: "3",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "3",
      code: 200,
      headers: {
        "set-cookie": [
          "sessionId=abc123; Path=/; Secure",
          "userId=456; Path=/; HttpOnly",
          "preferences=dark; Path=/",
        ],
      },
      body: "Response body",
    });

    const executionHistory = await runCheck(cookieHttpOnlyCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-httponly",
        targetRequestId: "3",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieHttpOnly",
            findings: [
              {
                name: "Cookie without HttpOnly flag set",
                severity: "low",
              },
              {
                name: "Cookie without HttpOnly flag set",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should handle case-insensitive HttpOnly flag", async () => {
    const request = createMockRequest({
      id: "4",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "4",
      code: 200,
      headers: {
        "set-cookie": ["sessionId=abc123; Path=/; httponly"],
      },
      body: "Response body",
    });

    const executionHistory = await runCheck(cookieHttpOnlyCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-httponly",
        targetRequestId: "4",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieHttpOnly",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not run when no Set-Cookie headers", async () => {
    const request = createMockRequest({
      id: "5",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "5",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Response body",
    });

    const executionHistory = await runCheck(cookieHttpOnlyCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-httponly",
        targetRequestId: "5",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieHttpOnly",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not run when no response", async () => {
    const request = createMockRequest({
      id: "6",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const executionHistory = await runCheck(cookieHttpOnlyCheck, [
      { request, response: undefined },
    ]);

    expect(executionHistory).toMatchObject([]);
  });

  it("should handle malformed cookie headers gracefully", async () => {
    const request = createMockRequest({
      id: "7",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "7",
      code: 200,
      headers: {
        "set-cookie": ["=; Path=/; HttpOnly", "malformed; ; ;"],
      },
      body: "Response body",
    });

    const executionHistory = await runCheck(cookieHttpOnlyCheck, [
      { request, response },
    ]);

    // Malformed cookies are skipped by the utility, so no findings should be generated
    expect(executionHistory).toMatchObject([
      {
        checkId: "cookie-httponly",
        targetRequestId: "7",
        status: "completed",
        steps: [
          {
            stepName: "checkCookieHttpOnly",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });
});
