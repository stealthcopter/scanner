import { createMockRequest, createMockResponse, runCheck, ScanAggressivity } from "engine";
import { describe, expect, it } from "vitest";

import robotsTxtCheck from "./index";

describe("Robots.txt Check", () => {
  it("should detect valid robots.txt file", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/robots.txt",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: { "content-type": ["text/plain"] },
        body: "User-Agent: *\nDisallow: /admin/\nAllow: /public/",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      robotsTxtCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "robots-txt",
        targetRequestId: "1",
        status: "completed",
        steps: [
          {
            stepName: "setupScan",
            result: "continue",
          },
          {
            stepName: "testRobotsPath",
            findings: [
              {
                name: "Robots.txt File Exposed",
                description: expect.stringContaining("Robots.txt file is publicly accessible"),
                severity: "info",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect robots.txt with sitemap directive", async () => {
    const request = createMockRequest({
      id: "2",
      host: "example.com",
      method: "GET",
      path: "/",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "3",
        host: "example.com",
        method: "GET",
        path: "/robots.txt",
      });

      const mockResponse = createMockResponse({
        id: "3",
        code: 200,
        headers: { "content-type": ["text/plain"] },
        body: "Sitemap: https://example.com/sitemap.xml",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      robotsTxtCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "robots-txt",
        targetRequestId: "2",
        status: "completed",
        steps: [
          {
            stepName: "setupScan",
            result: "continue",
          },
          {
            stepName: "testRobotsPath",
            findings: [
              {
                name: "Robots.txt File Exposed",
                severity: "info",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not detect invalid robots.txt content", async () => {
    const request = createMockRequest({
      id: "4",
      host: "example.com",
      method: "GET",
      path: "/",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "5",
        host: "example.com",
        method: "GET",
        path: "/robots.txt",
      });

      const mockResponse = createMockResponse({
        id: "5",
        code: 200,
        headers: { "content-type": ["text/plain"] },
        body: "This is just some random text\nNot a robots.txt file",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      robotsTxtCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    // Should complete all path tests without finding anything
    expect(executionHistory).toMatchObject([
      {
        checkId: "robots-txt",
        targetRequestId: "4",
        status: "completed",
      },
    ]);

    // Should not have any findings in any step
    const allFindings = executionHistory[0]?.steps.flatMap(step => step.findings) ?? [];
    expect(allFindings).toEqual([]);
  });

  it("should not detect empty robots.txt content", async () => {
    const request = createMockRequest({
      id: "6",
      host: "example.com",
      method: "GET",
      path: "/",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "7",
        host: "example.com",
        method: "GET",
        path: "/robots.txt",
      });

      const mockResponse = createMockResponse({
        id: "7",
        code: 200,
        headers: { "content-type": ["text/plain"] },
        body: "",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      robotsTxtCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    // Should complete all path tests without finding anything
    expect(executionHistory).toMatchObject([
      {
        checkId: "robots-txt",
        targetRequestId: "6",
        status: "completed",
      },
    ]);

    // Should not have any findings in any step
    const allFindings = executionHistory[0]?.steps.flatMap(step => step.findings) ?? [];
    expect(allFindings).toEqual([]);
  });

  it("should not run on 404 responses", async () => {
    const request = createMockRequest({
      id: "8",
      host: "example.com",
      method: "GET",
      path: "/",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "9",
        host: "example.com",
        method: "GET",
        path: "/robots.txt",
      });

      const mockResponse = createMockResponse({
        id: "9",
        code: 404,
        headers: {},
        body: "Not Found",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      robotsTxtCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    // Should complete all path tests without finding anything
    expect(executionHistory).toMatchObject([
      {
        checkId: "robots-txt",
        targetRequestId: "8",
        status: "completed",
      },
    ]);

    // Should not have any findings in any step
    const allFindings = executionHistory[0]?.steps.flatMap(step => step.findings) ?? [];
    expect(allFindings).toEqual([]);
  });

  it("should detect robots.txt with comments and mixed case", async () => {
    const request = createMockRequest({
      id: "10",
      host: "example.com",
      method: "GET",
      path: "/",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "11",
        host: "example.com",
        method: "GET",
        path: "/robots.txt",
      });

      const mockResponse = createMockResponse({
        id: "11",
        code: 200,
        headers: { "content-type": ["text/plain"] },
        body: "# This is a robots.txt file\nUser-Agent: *\n# Disallow admin areas\ndisallow: /admin/\nAllow: /public/",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      robotsTxtCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "robots-txt",
        targetRequestId: "10",
        status: "completed",
        steps: [
          {
            stepName: "setupScan",
            result: "continue",
          },
          {
            stepName: "testRobotsPath",
            findings: [
              {
                name: "Robots.txt File Exposed",
                severity: "info",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });
});