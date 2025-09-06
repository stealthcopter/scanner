import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import hstsCheck from "./index";

describe("HSTS Check", () => {
  it("should detect missing HSTS header on HTTPS", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/test",
      tls: true,
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(hstsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hsts",
        targetRequestId: "1",
        status: "completed",
        steps: [
          {
            stepName: "checkHSTS",
            findings: [
              {
                name: "Missing Strict-Transport-Security Header",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not alert when HSTS header is present with valid max-age", async () => {
    const request = createMockRequest({
      id: "2",
      host: "example.com",
      method: "GET",
      path: "/test",
      tls: true,
    });

    const response = createMockResponse({
      id: "2",
      code: 200,
      headers: { 
        "content-type": ["text/html"],
        "strict-transport-security": ["max-age=31536000"]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(hstsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hsts",
        targetRequestId: "2",
        status: "completed",
        steps: [
          {
            stepName: "checkHSTS",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect HSTS with max-age=0", async () => {
    const request = createMockRequest({
      id: "3",
      host: "example.com",
      method: "GET",
      path: "/test",
      tls: true,
    });

    const response = createMockResponse({
      id: "3",
      code: 200,
      headers: { 
        "content-type": ["text/html"],
        "strict-transport-security": ["max-age=0"]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(hstsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hsts",
        targetRequestId: "3",
        status: "completed",
        steps: [
          {
            stepName: "checkHSTS",
            findings: [
              {
                name: "HSTS Disabled (max-age=0)",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect multiple HSTS headers", async () => {
    const request = createMockRequest({
      id: "4",
      host: "example.com",
      method: "GET",
      path: "/test",
      tls: true,
    });

    const response = createMockResponse({
      id: "4",
      code: 200,
      headers: { 
        "content-type": ["text/html"],
        "strict-transport-security": ["max-age=31536000", "max-age=63072000"]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(hstsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hsts",
        targetRequestId: "4",
        status: "completed",
        steps: [
          {
            stepName: "checkHSTS",
            findings: [
              {
                name: "Multiple Strict-Transport-Security Headers",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect missing max-age in HSTS header", async () => {
    const request = createMockRequest({
      id: "5",
      host: "example.com",
      method: "GET",
      path: "/test",
      tls: true,
    });

    const response = createMockResponse({
      id: "5",
      code: 200,
      headers: { 
        "content-type": ["text/html"],
        "strict-transport-security": ["includeSubDomains"]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(hstsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hsts",
        targetRequestId: "5",
        status: "completed",
        steps: [
          {
            stepName: "checkHSTS",
            findings: [
              {
                name: "Missing max-age in HSTS Header",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect malformed max-age in HSTS header", async () => {
    const request = createMockRequest({
      id: "6",
      host: "example.com",
      method: "GET",
      path: "/test",
      tls: true,
    });

    const response = createMockResponse({
      id: "6",
      code: 200,
      headers: { 
        "content-type": ["text/html"],
        "strict-transport-security": ["max-age=invalid"]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(hstsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hsts",
        targetRequestId: "6",
        status: "completed",
        steps: [
          {
            stepName: "checkHSTS",
            findings: [
              {
                name: "Malformed max-age in HSTS Header",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not run on HTTP requests", async () => {
    const request = createMockRequest({
      id: "7",
      host: "example.com",
      method: "GET",
      path: "/test",
      tls: false,
    });

    const response = createMockResponse({
      id: "7",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(hstsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([]);
  });

  it("should not run when no response", async () => {
    const request = createMockRequest({
      id: "8",
      host: "example.com",
      method: "GET",
      path: "/test",
      tls: true,
    });

    const executionHistory = await runCheck(hstsCheck, [
      { request, response: undefined },
    ]);

    expect(executionHistory).toMatchObject([]);
  });
});
