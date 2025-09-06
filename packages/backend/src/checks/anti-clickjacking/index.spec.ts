import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import antiClickjackingCheck from "./index";

describe("Anti-Clickjacking Check", () => {
  it("should detect missing X-Frame-Options header", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(antiClickjackingCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: 'anti-clickjacking',
        targetRequestId: "1",
        status: "completed",
        steps: [
          {
            stepName: "checkAntiClickjacking",
            findings: [
              {
                name: "Missing X-Frame-Options Header",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not alert when X-Frame-Options is present with DENY", async () => {
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
        "content-type": ["text/html"],
        "x-frame-options": ["DENY"],
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(antiClickjackingCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "anti-clickjacking",
        targetRequestId: "2",
        status: "completed",
        steps: [
          {
            stepName: "checkAntiClickjacking",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not alert when X-Frame-Options is present with SAMEORIGIN", async () => {
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
        "content-type": ["text/html"],
        "x-frame-options": ["SAMEORIGIN"],
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(antiClickjackingCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "anti-clickjacking",
        targetRequestId: "3",
        status: "completed",
        steps: [
          {
            stepName: "checkAntiClickjacking",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect multiple X-Frame-Options headers", async () => {
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
        "content-type": ["text/html"],
        "x-frame-options": ["DENY", "SAMEORIGIN"],
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(antiClickjackingCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "anti-clickjacking",
        targetRequestId: "4",
        status: "completed",
        steps: [
          {
            stepName: "checkAntiClickjacking",
            findings: [
              {
                name: "Multiple X-Frame-Options Headers",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect malformed X-Frame-Options header", async () => {
    const request = createMockRequest({
      id: "5",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "5",
      code: 200,
      headers: {
        "content-type": ["text/html"],
        "x-frame-options": ["INVALID_VALUE"],
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(antiClickjackingCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "anti-clickjacking",
        targetRequestId: "5",
        status: "completed",
        steps: [
          {
            stepName: "checkAntiClickjacking",
            findings: [
              {
                name: "Malformed X-Frame-Options Header",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not alert when CSP frame-ancestors is present", async () => {
    const request = createMockRequest({
      id: "6",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "6",
      code: 200,
      headers: {
        "content-type": ["text/html"],
        "content-security-policy": [
          "default-src 'self'; frame-ancestors 'none'",
        ],
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(antiClickjackingCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "anti-clickjacking",
        targetRequestId: "6",
        status: "completed",
        steps: [
          {
            stepName: "checkAntiClickjacking",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not run on non-HTML responses", async () => {
    const request = createMockRequest({
      id: "7",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "7",
      code: 200,
      headers: { "content-type": ["application/json"] },
      body: '{"message": "test"}',
    });

    const executionHistory = await runCheck(antiClickjackingCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "anti-clickjacking",
        targetRequestId: "7",
        status: "completed",
        steps: [
          {
            stepName: "checkAntiClickjacking",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not run when no response", async () => {
    const request = createMockRequest({
      id: "8",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const executionHistory = await runCheck(antiClickjackingCheck, [
      { request, response: undefined },
    ]);

    expect(executionHistory).toMatchObject([]);
  });
});
