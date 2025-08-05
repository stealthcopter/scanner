import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import reflectedXssCheck from "./index";

describe("basic-reflected-xss check", () => {
  it("should detect reflected XSS with WAF evasion first", async () => {
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

    let callCount = 0;
    const sendHandler = () => {
      callCount++;
      if (callCount === 1) {
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
          body: 'You searched for: "><z xxx=a()>',
        });

        return Promise.resolve({
          request: mockRequest,
          response: mockResponse,
        });
      } else {
        const mockRequest = createMockRequest({
          id: "3",
          host: "example.com",
          method: "GET",
          path: "/search",
        });

        const mockResponse = createMockResponse({
          id: "3",
          code: 200,
          headers: {
            "Content-Type": ["text/html"],
          },
          body: 'You searched for: "><img src=x onerror=alert(1)>',
        });

        return Promise.resolve({
          request: mockRequest,
          response: mockResponse,
        });
      }
    };

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response }],
      { sendHandler },
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
            findings: [
              {
                name: "Basic Reflected XSS in parameter 'q'",
                severity: "high",
                correlation: {
                  requestID: "3",
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

    let callCount = 0;
    const sendHandler = () => {
      callCount++;
      const mockRequest = createMockRequest({
        id: String(callCount + 1),
        host: "example.com",
        method: "POST",
        path: "/contact",
      });

      if (callCount === 1) {
        const mockResponse = createMockResponse({
          id: "2",
          code: 200,
          headers: {
            "Content-Type": ["text/html"],
          },
          body: 'Thank you "><z xxx=a()> for your message',
        });

        return Promise.resolve({
          request: mockRequest,
          response: mockResponse,
        });
      } else {
        const mockResponse = createMockResponse({
          id: "3",
          code: 200,
          headers: {
            "Content-Type": ["text/html"],
          },
          body: 'Thank you "><img src=x onerror=alert(1)> for your message',
        });

        return Promise.resolve({
          request: mockRequest,
          response: mockResponse,
        });
      }
    };

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response }],
      { sendHandler },
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
            findings: [
              {
                name: "Basic Reflected XSS in parameter 'name'",
                severity: "high",
                correlation: {
                  requestID: "3",
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

    const executionHistory = await runCheck(reflectedXssCheck, [
      { request, response },
    ]);

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
              wafEvadedParams: [],
              possibleWafBlocked: false,
            },
            stateAfter: {
              testParams: [],
              currentPayloadIndex: 0,
              wafEvadedParams: [],
              possibleWafBlocked: false,
            },
            findings: [],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should detect WAF protection when harmless payload reflects but XSS payload is blocked", async () => {
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

    let callCount = 0;
    const sendHandler = () => {
      callCount++;
      if (callCount === 1) {
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
          body: 'You searched for: "><z xxx=a()>',
        });

        return Promise.resolve({
          request: mockRequest,
          response: mockResponse,
        });
      } else {
        const mockRequest = createMockRequest({
          id: "3",
          host: "example.com",
          method: "GET",
          path: "/search",
        });

        const mockResponse = createMockResponse({
          id: "3",
          code: 200,
          headers: {
            "Content-Type": ["text/html"],
          },
          body: "You searched for: hello",
        });

        return Promise.resolve({
          request: mockRequest,
          response: mockResponse,
        });
      }
    };

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response }],
      { sendHandler },
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
            findings: [
              {
                name: "Potential XSS with WAF Protection in parameter 'q'",
                severity: "medium",
                correlation: {
                  requestID: "3",
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

    let callCount = 0;
    const sendHandler = () => {
      callCount++;
      const mockRequest = createMockRequest({
        id: String(callCount + 1),
        host: "example.com",
        method: "GET",
        path: "/search",
      });

      const mockResponse = createMockResponse({
        id: String(callCount + 1),
        code: 200,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: "You searched for: (encoded payload content)",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response }],
      { sendHandler },
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

    const executionHistory = await runCheck(reflectedXssCheck, [
      { request, response },
    ]);

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

    const executionHistory = await runCheck(reflectedXssCheck, [
      { request, response: undefined },
    ]);

    expect(executionHistory).toEqual([]);
  });

  it("should handle POST request with form data and WAF evasion", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "POST",
      path: "/contact",
      query: "",
      headers: { "Content-Type": ["application/x-www-form-urlencoded"] },
      body: "name=John&message=Hello world",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "Content-Type": ["text/html"],
      },
      body: "<html><body>Thank you John for your message: Hello world</body></html>",
    });

    let callCount = 0;
    const sendHandler = () => {
      callCount++;
      if (callCount === 1) {
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
          body: 'Thank you "><z xxx=a()> for your message: Hello world',
        });

        return Promise.resolve({
          request: mockRequest,
          response: mockResponse,
        });
      } else {
        const mockRequest = createMockRequest({
          id: "3",
          host: "example.com",
          method: "POST",
          path: "/contact",
        });

        const mockResponse = createMockResponse({
          id: "3",
          code: 200,
          headers: {
            "Content-Type": ["text/html"],
          },
          body: 'Thank you "><img src=x onerror=alert(1)> for your message: Hello world',
        });

        return Promise.resolve({
          request: mockRequest,
          response: mockResponse,
        });
      }
    };

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "basic-reflected-xss",
        targetRequestId: "1",
        steps: [
          {
            stepName: "findParameters",
            result: "continue",
            nextStep: "testPayloads",
          },
          {
            stepName: "testPayloads",
            result: "continue",
            nextStep: "testPayloads",
          },
          {
            stepName: "testPayloads",
            result: "done",
            findings: [
              {
                name: "Basic Reflected XSS in parameter 'name'",
                severity: "high",
                correlation: {
                  requestID: "3",
                },
              },
            ],
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should detect WAF protection with multiple payload attempts", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/search",
      query: "term=test",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "Content-Type": ["text/html"],
      },
      body: "<html><body>Search results for: test</body></html>",
    });

    let callCount = 0;
    const sendHandler = () => {
      callCount++;
      if (callCount === 1) {
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
          body: 'Search results for: "><z xxx=a()>',
        });

        return Promise.resolve({
          request: mockRequest,
          response: mockResponse,
        });
      } else {
        const mockRequest = createMockRequest({
          id: "3",
          host: "example.com",
          method: "GET",
          path: "/search",
        });

        const mockResponse = createMockResponse({
          id: "3",
          code: 200,
          headers: {
            "Content-Type": ["text/html"],
          },
          body: "Search results for: [FILTERED]",
        });

        return Promise.resolve({
          request: mockRequest,
          response: mockResponse,
        });
      }
    };

    const executionHistory = await runCheck(
      reflectedXssCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "basic-reflected-xss",
        targetRequestId: "1",
        steps: [
          {
            stepName: "findParameters",
            result: "continue",
            nextStep: "testPayloads",
          },
          {
            stepName: "testPayloads",
            result: "continue",
            nextStep: "testPayloads",
          },
          {
            stepName: "testPayloads",
            result: "done",
            findings: [
              {
                name: "Potential XSS with WAF Protection in parameter 'term'",
                severity: "medium",
                correlation: {
                  requestID: "3",
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
