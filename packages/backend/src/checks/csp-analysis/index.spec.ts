import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import cspAnalysisCheck from "./index";

describe("CSP Analysis Check", () => {
  it("should detect missing Content Security Policy", async () => {
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

    const executionHistory = await runCheck(cspAnalysisCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "csp-analysis",
        targetRequestId: "1",
        status: "completed",
        steps: [
          {
            stepName: "checkCSP",
            findings: [
              {
                name: "Missing Content Security Policy",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not alert when CSP is present and properly configured", async () => {
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
        "content-security-policy": ["default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'"]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(cspAnalysisCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "csp-analysis",
        targetRequestId: "2",
        status: "completed",
        steps: [
          {
            stepName: "checkCSP",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect multiple CSP headers", async () => {
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
        "content-security-policy": [
          "default-src 'self'",
          "script-src 'self'"
        ]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(cspAnalysisCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "csp-analysis",
        targetRequestId: "3",
        status: "completed",
        steps: [
          {
            stepName: "checkCSP",
            findings: [
              {
                name: "Multiple Content Security Policy Headers",
                severity: "low",
              },
              {
                name: "CSP: Missing object-src Directive",
                severity: "low",
              },
              {
                name: "CSP: Missing base-uri Directive",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect unsafe-inline in script-src", async () => {
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
        "content-security-policy": ["default-src 'self'; script-src 'self' 'unsafe-inline'"]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(cspAnalysisCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "csp-analysis",
        targetRequestId: "4",
        status: "completed",
        steps: [
          {
            stepName: "checkCSP",
            findings: [
              {
                name: "CSP: Unsafe Inline Scripts",
                severity: "medium",
              },
              {
                name: "CSP: Missing object-src Directive",
                severity: "low",
              },
              {
                name: "CSP: Missing base-uri Directive",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect unsafe-eval in script-src", async () => {
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
        "content-security-policy": ["default-src 'self'; script-src 'self' 'unsafe-eval'"]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(cspAnalysisCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "csp-analysis",
        targetRequestId: "5",
        status: "completed",
        steps: [
          {
            stepName: "checkCSP",
            findings: [
              {
                name: "CSP: Unsafe Eval",
                severity: "medium",
              },
              {
                name: "CSP: Missing object-src Directive",
                severity: "low",
              },
              {
                name: "CSP: Missing base-uri Directive",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect wildcard in script-src", async () => {
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
        "content-security-policy": ["default-src 'self'; script-src *"]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(cspAnalysisCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "csp-analysis",
        targetRequestId: "6",
        status: "completed",
        steps: [
          {
            stepName: "checkCSP",
            findings: [
              {
                name: "CSP: Wildcard in Script Source",
                severity: "medium",
              },
              {
                name: "CSP: Missing object-src Directive",
                severity: "low",
              },
              {
                name: "CSP: Missing base-uri Directive",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect missing object-src directive", async () => {
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
        "content-type": ["text/html"],
        "content-security-policy": ["default-src 'self'; script-src 'self'"]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(cspAnalysisCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "csp-analysis",
        targetRequestId: "7",
        status: "completed",
        steps: [
          {
            stepName: "checkCSP",
            findings: [
              {
                name: "CSP: Missing object-src Directive",
                severity: "low",
              },
              {
                name: "CSP: Missing base-uri Directive",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect missing base-uri directive", async () => {
    const request = createMockRequest({
      id: "8",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "8",
      code: 200,
      headers: { 
        "content-type": ["text/html"],
        "content-security-policy": ["default-src 'self'; script-src 'self'; object-src 'none'"]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(cspAnalysisCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "csp-analysis",
        targetRequestId: "8",
        status: "completed",
        steps: [
          {
            stepName: "checkCSP",
            findings: [
              {
                name: "CSP: Missing base-uri Directive",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect multiple CSP issues", async () => {
    const request = createMockRequest({
      id: "9",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "9",
      code: 200,
      headers: { 
        "content-type": ["text/html"],
        "content-security-policy": [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "default-src 'self'"
        ]
      },
      body: "<html><body>Test</body></html>",
    });

    const executionHistory = await runCheck(cspAnalysisCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "csp-analysis",
        targetRequestId: "9",
        status: "completed",
        steps: [
          {
            stepName: "checkCSP",
            findings: [
              {
                name: "Multiple Content Security Policy Headers",
                severity: "low",
              },
              {
                name: "CSP: Unsafe Inline Scripts",
                severity: "medium",
              },
              {
                name: "CSP: Unsafe Eval",
                severity: "medium",
              },
              {
                name: "CSP: Missing object-src Directive",
                severity: "low",
              },
              {
                name: "CSP: Missing base-uri Directive",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not run on non-HTML responses", async () => {
    const request = createMockRequest({
      id: "10",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "10",
      code: 200,
      headers: { "content-type": ["application/json"] },
      body: '{"message": "test"}',
    });

    const executionHistory = await runCheck(cspAnalysisCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "csp-analysis",
        targetRequestId: "10",
        status: "completed",
        steps: [
          {
            stepName: "checkCSP",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not run when no response", async () => {
    const request = createMockRequest({
      id: "11",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const executionHistory = await runCheck(cspAnalysisCheck, [
      { request, response: undefined },
    ]);

    expect(executionHistory).toMatchObject([]);
  });
});
