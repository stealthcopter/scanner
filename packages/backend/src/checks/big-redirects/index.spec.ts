import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import bigRedirectsCheck from "./index";

describe("Big Redirects Check", () => {
  it("should not run on non-redirect responses", async () => {
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
      body: "Normal response content",
    });

    const executionHistory = await runCheck(bigRedirectsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([]);
  });

  it("should not run on 304 Not Modified responses", async () => {
    const request = createMockRequest({
      id: "2",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "2",
      code: 304,
      headers: { location: ["https://example.com/redirect"] },
      body: "Not modified",
    });

    const executionHistory = await runCheck(bigRedirectsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([]);
  });

  it("should find no issues on redirects without location header", async () => {
    const request = createMockRequest({
      id: "3",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "3",
      code: 302,
      headers: {},
      body: "Redirect without location",
    });

    const executionHistory = await runCheck(bigRedirectsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "big-redirects",
        targetRequestId: "3",
        status: "completed",
        steps: [
          {
            stepName: "analyzeRedirect",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should find no issues on normal-sized redirect responses", async () => {
    const request = createMockRequest({
      id: "4",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const locationUrl = "https://example.com/redirect";
    const response = createMockResponse({
      id: "4",
      code: 302,
      headers: { location: [locationUrl] },
      body: "Redirecting...", // Small body, should not trigger
    });

    const executionHistory = await runCheck(bigRedirectsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "big-redirects",
        targetRequestId: "4",
        status: "completed",
        steps: [
          {
            stepName: "analyzeRedirect",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect oversized redirect responses", async () => {
    const request = createMockRequest({
      id: "5",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const locationUrl = "https://example.com/redirect";
    const largeBody = "A".repeat(500); // Much larger than expected (locationUrl.length + 300 = ~340)

    const response = createMockResponse({
      id: "5",
      code: 302,
      headers: { location: [locationUrl] },
      body: largeBody,
    });

    const executionHistory = await runCheck(bigRedirectsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "big-redirects",
        targetRequestId: "5",
        status: "completed",
        steps: [
          {
            stepName: "analyzeRedirect",
            findings: [
              {
                name: "Big Redirects - Oversized Response",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect multiple href links in redirect response", async () => {
    const request = createMockRequest({
      id: "6",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const locationUrl = "https://example.com/redirect";
    const bodyWithMultipleHrefs = `
      <html>
        <head><link href="/style.css" rel="stylesheet"></head>
        <body>
          <a href="/link1">Link 1</a>
          <a href="/link2">Link 2</a>
          <a href="/link3">Link 3</a>
        </body>
      </html>
    `;

    const response = createMockResponse({
      id: "6",
      code: 301,
      headers: { location: [locationUrl] },
      body: bodyWithMultipleHrefs,
    });

    const executionHistory = await runCheck(bigRedirectsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "big-redirects",
        targetRequestId: "6",
        status: "completed",
        steps: [
          {
            stepName: "analyzeRedirect",
            findings: [
              {
                name: "Big Redirects - Multiple Href Links",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect both oversized response and multiple href links", async () => {
    const request = createMockRequest({
      id: "7",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const locationUrl = "https://example.com/redirect";
    const largeBodyWithMultipleHrefs = `
      <html>
        <head><link href="/style.css" rel="stylesheet"></head>
        <body>
          <a href="/link1">Link 1</a>
          <a href="/link2">Link 2</a>
          <a href="/link3">Link 3</a>
          ${"A".repeat(500)}
        </body>
      </html>
    `;

    const response = createMockResponse({
      id: "7",
      code: 302,
      headers: { location: [locationUrl] },
      body: largeBodyWithMultipleHrefs,
    });

    const executionHistory = await runCheck(bigRedirectsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "big-redirects",
        targetRequestId: "7",
        status: "completed",
        steps: [
          {
            stepName: "analyzeRedirect",
            findings: [
              {
                name: "Big Redirects - Oversized Response",
                severity: "low",
              },
              {
                name: "Big Redirects - Multiple Href Links",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should handle different redirect status codes", async () => {
    const redirectCodes = [300, 301, 302, 303, 307, 308];

    for (let i = 0; i < redirectCodes.length; i++) {
      const code = redirectCodes[i]!;
      const request = createMockRequest({
        id: `8-${i}`,
        host: "example.com",
        method: "GET",
        path: "/test",
      });

      const locationUrl = "https://example.com/redirect";
      const largeBody = "A".repeat(500);

      const response = createMockResponse({
        id: `8-${i}`,
        code,
        headers: { location: [locationUrl] },
        body: largeBody,
      });

      const executionHistory = await runCheck(bigRedirectsCheck, [
        { request, response },
      ]);

      expect(executionHistory).toMatchObject([
        {
          checkId: "big-redirects",
          targetRequestId: `8-${i}`,
          status: "completed",
          steps: [
            {
              stepName: "analyzeRedirect",
              findings: [
                {
                  name: "Big Redirects - Oversized Response",
                  severity: "low",
                },
              ],
              result: "done",
            },
          ],
        },
      ]);
    }
  });

  it("should handle case-insensitive href detection", async () => {
    const request = createMockRequest({
      id: "9",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const locationUrl = "https://example.com/redirect";
    const bodyWithCaseVariations = `
      <html>
        <head><link HREF="/style.css" rel="stylesheet"></head>
        <body>
          <a href="/link1">Link 1</a>
          <a HREF="/link2">Link 2</a>
          <a href="/link3">Link 3</a>
        </body>
      </html>
    `;

    const response = createMockResponse({
      id: "9",
      code: 302,
      headers: { location: [locationUrl] },
      body: bodyWithCaseVariations,
    });

    const executionHistory = await runCheck(bigRedirectsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "big-redirects",
        targetRequestId: "9",
        status: "completed",
        steps: [
          {
            stepName: "analyzeRedirect",
            findings: [
              {
                name: "Big Redirects - Multiple Href Links",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should find no issues on single href link", async () => {
    const request = createMockRequest({
      id: "10",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const locationUrl = "https://example.com/redirect";
    const bodyWithSingleHref = `
      <html>
        <body>
          <a href="/single-link">Single Link</a>
        </body>
      </html>
    `;

    const response = createMockResponse({
      id: "10",
      code: 302,
      headers: { location: [locationUrl] },
      body: bodyWithSingleHref,
    });

    const executionHistory = await runCheck(bigRedirectsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "big-redirects",
        targetRequestId: "10",
        status: "completed",
        steps: [
          {
            stepName: "analyzeRedirect",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });
});
