import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import pathTraversalCheck from "./index";

describe("path-traversal check", () => {
  it("should not trigger when no parameters are present", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/page",
      query: "",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {},
      body: "OK",
    });

    const executionHistory = await runCheck(pathTraversalCheck, [
      { request, response },
    ]);

    expect(executionHistory).toEqual([]);
  });

  it("should not trigger when parameters don't contain traversal patterns", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/page",
      query: "file=document.txt",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {},
      body: "Safe content",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/page",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {},
        body: "Safe content",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      pathTraversalCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "path-traversal",
        targetRequestId: "1",
        steps: [
          {
            stepName: "findParameters",
            result: "continue",
            nextStep: "testParameter",
          },
          {
            stepName: "testParameter",
            result: "done",
            findings: [],
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should detect Windows system.ini file access", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/page",
      query: "file=document.txt",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {},
      body: "OK",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/page",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {},
        body: "[drivers]\nwave=mmdrv.dll\n[fonts]",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      pathTraversalCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "path-traversal",
        targetRequestId: "1",
        steps: [
          {
            stepName: "findParameters",
            result: "continue",
            nextStep: "testParameter",
          },
          {
            stepName: "testParameter",
            result: "done",
            findings: [
              {
                name: "Path Traversal in parameter 'file'",
                severity: "critical",
                correlation: {
                  requestID: "2",
                },
              },
            ],
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should detect Unix passwd file access", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/page",
      query: "file=document.txt",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {},
      body: "OK",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/page",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {},
        body: "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      pathTraversalCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "path-traversal",
        targetRequestId: "1",
        steps: [
          {
            stepName: "findParameters",
            result: "continue",
            nextStep: "testParameter",
          },
          {
            stepName: "testParameter",
            result: "done",
            findings: [
              {
                name: "Path Traversal in parameter 'file'",
                severity: "critical",
                correlation: {
                  requestID: "2",
                },
              },
            ],
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should test POST body parameters", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "POST",
      path: "/upload",
      query: "",
      headers: { "Content-Type": ["application/x-www-form-urlencoded"] },
      body: "file=document.txt&action=upload",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {},
      body: "OK",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "POST",
        path: "/upload",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {},
        body: "</web-app>",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      pathTraversalCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "path-traversal",
        targetRequestId: "1",
        steps: [
          {
            stepName: "findParameters",
            result: "continue",
            nextStep: "testParameter",
          },
          {
            stepName: "testParameter",
            result: "done",
            findings: [
              {
                name: "Path Traversal in parameter 'file'",
                severity: "critical",
                correlation: {
                  requestID: "2",
                },
              },
            ],
          },
        ],
        status: "completed",
      },
    ]);
  });
});
