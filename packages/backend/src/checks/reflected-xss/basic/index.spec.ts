import { describe, it, expect } from "vitest";
import { createMockRequest, createMockResponse, runCheck } from "engine";

import reflectedXssCheck from "./index";

describe("basic-reflected-xss check", () => {
  it("should detect reflected XSS in query parameters", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/search",
      query: "q=hello",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "Content-Type": ["text/html"],
      },
      body: "<html><body>You searched for: hello</body></html>",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/search",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: 'You searched for: "><img src=x onerror=alert(1)>',
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response }],
      { sendHandler }
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "basic-reflected-xss",
        targetRequestId: "1",
        steps: [
          {
            stepName: "findParameters",
            findings: [],
            result: "continue",
            nextStep: "testPayloads",
          },
          {
            stepName: "testPayloads",
            findings: [
              {
                name: "Basic Reflected XSS",
                severity: "high",
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

  it("should detect reflected XSS in POST body parameters", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "POST",
      path: "/contact",
      headers: {
        "Content-Type": ["application/x-www-form-urlencoded"],
      },
      body: "name=John&message=Hello",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "Content-Type": ["text/html"],
      },
      body: "<html><body>Thank you John for your message: Hello</body></html>",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "POST",
        path: "/contact",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: 'Thank you "><img src=x onerror=alert(1)> for your message',
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response }],
      { sendHandler }
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "basic-reflected-xss",
        targetRequestId: "1",
        steps: [
          {
            stepName: "findParameters",
            findings: [],
            result: "continue",
            nextStep: "testPayloads",
          },
          {
            stepName: "testPayloads",
            findings: [
              {
                name: "Basic Reflected XSS",
                severity: "high",
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

  it("should not detect when parameters are not reflected in response", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/search",
      query: "q=hello",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "Content-Type": ["text/html"],
      },
      body: "<html><body>Search results page</body></html>",
    });

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response }],
    );

    expect(executionHistory).toEqual([
      {
        checkId: "basic-reflected-xss",
        targetRequestId: "1",
        steps: [
          {
            stepName: "findParameters",
            stateBefore: {
              testParams: [],
              currentPayloadIndex: 0,
            },
            stateAfter: {
              testParams: [],
              currentPayloadIndex: 0,
            },
            findings: [],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should not detect when payload is properly encoded", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/search",
      query: "q=hello",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "Content-Type": ["text/html"],
      },
      body: "<html><body>You searched for: hello</body></html>",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/search",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: 'You searched for: &quot;&gt;&lt;img src=x onerror=alert(1)&gt;',
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response }],
      { sendHandler }
    );

         expect(executionHistory).toMatchObject([
       {
         checkId: "basic-reflected-xss",
         targetRequestId: "1",
         steps: [
           {
             stepName: "findParameters",
             findings: [],
             result: "continue",
             nextStep: "testPayloads",
           },
           {
             stepName: "testPayloads",
             findings: [],
             result: "continue",
             nextStep: "testPayloads",
           },
           {
             stepName: "testPayloads",
             findings: [],
             result: "continue",
             nextStep: "testPayloads",
           },
           {
             stepName: "testPayloads",
             findings: [],
             result: "done",
           },
         ],
         status: "completed",
       },
     ]);
  });

  it("should not detect when response is not HTML", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/api/search",
      query: "q=hello",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "Content-Type": ["application/json"],
      },
      body: JSON.stringify({ query: "hello", results: [] }),
    });

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response }],
    );

    expect(executionHistory).toEqual([]);
  });

  it("should not detect when no response", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/search",
      query: "q=hello",
    });

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response: undefined }],
    );

    expect(executionHistory).toEqual([]);
  });
});
