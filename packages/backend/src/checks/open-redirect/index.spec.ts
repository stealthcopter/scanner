import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import openRedirectCheck from "./index";

describe("open-redirect check", () => {
  it("should not trigger when no URL parameters are present", async () => {
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

    const executionHistory = await runCheck(openRedirectCheck, [
      { request, response },
    ]);

    expect(executionHistory).toEqual([]);
  });

  it("should not trigger when no suspicious URL parameters are found", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/page",
      query: "foo=bar&baz=qux",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {},
      body: "OK",
    });

    const executionHistory = await runCheck(openRedirectCheck, [
      { request, response },
    ]);

    expect(executionHistory).toEqual([]);
  });

  it("should find URL parameters but not detect redirect when no redirect occurs", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/page",
      query: "redirect=https://example.com/safe",
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
        body: "OK",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      openRedirectCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toEqual([
      {
        checkId: "open-redirect",
        targetRequestId: "1",
        steps: [
          {
            stepName: "findUrlParams",
            stateBefore: {
              urlParams: [],
            },
            stateAfter: {
              urlParams: ["redirect"],
            },
            findings: [],
            result: "continue",
            nextStep: "testParam",
          },
          {
            stepName: "testParam",
            stateBefore: {
              urlParams: ["redirect"],
            },
            stateAfter: {
              urlParams: [],
            },
            findings: [],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should detect open redirect vulnerability", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/page",
      query: "redirect=https://example.com/safe",
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
        code: 302,
        headers: {
          Location: ["http://example.com/"],
        },
        body: "",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      openRedirectCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "open-redirect",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "findUrlParams",
            stateBefore: {
              urlParams: [],
            },
            stateAfter: {
              urlParams: ["redirect"],
            },
            findings: [],
            result: "continue",
            nextStep: "testParam",
          },
          {
            stepName: "testParam",
            stateBefore: {
              urlParams: ["redirect"],
            },
            stateAfter: {
              urlParams: [],
            },
            findings: [
              {
                correlation: {
                  requestID: "2",
                },
              },
            ],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should handle multiple parameters and test them sequentially", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/page",
      query: "redirect=safe&url=also-safe",
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
        body: "OK",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      openRedirectCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toEqual([
      {
        checkId: "open-redirect",
        targetRequestId: "1",
        steps: [
          {
            stepName: "findUrlParams",
            stateBefore: {
              urlParams: [],
            },
            stateAfter: {
              urlParams: ["redirect", "url"],
            },
            findings: [],
            result: "continue",
            nextStep: "testParam",
          },
          {
            stepName: "testParam",
            stateBefore: {
              urlParams: ["redirect", "url"],
            },
            stateAfter: {
              urlParams: ["url"],
            },
            findings: [],
            result: "continue",
            nextStep: "testParam",
          },
          {
            stepName: "testParam",
            stateBefore: {
              urlParams: ["url"],
            },
            stateAfter: {
              urlParams: [],
            },
            findings: [],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });
});
