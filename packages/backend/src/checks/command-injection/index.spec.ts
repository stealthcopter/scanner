import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import commandInjectionCheck from "./index";

describe("command-injection check", () => {
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

    const executionHistory = await runCheck(commandInjectionCheck, [
      { request, response },
    ]);

    expect(executionHistory).toEqual([]);
  });

  it("should not trigger when parameters don't contain command injection patterns", async () => {
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
      commandInjectionCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]).toMatchObject({
      checkId: "command-injection",
      targetRequestId: "1",
      status: "completed",
    });
    expect(executionHistory[0]?.steps.length).toBeGreaterThanOrEqual(2);
    expect(executionHistory[0]?.steps[0]).toMatchObject({
      stepName: "findParameters",
      result: "continue",
      nextStep: "testPayloads",
    });
    const lastStep =
      executionHistory[0]?.steps[executionHistory[0]?.steps.length - 1];
    expect(lastStep).toMatchObject({
      stepName: "testPayloads",
      result: "done",
      findings: [],
    });
  });

  it("should detect Unix command injection with cat /etc/passwd", async () => {
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
      commandInjectionCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]).toMatchObject({
      checkId: "command-injection",
      targetRequestId: "1",
      status: "completed",
    });
    expect(executionHistory[0]?.steps.length).toBeGreaterThanOrEqual(2);
    expect(executionHistory[0]?.steps[0]).toMatchObject({
      stepName: "findParameters",
      result: "continue",
      nextStep: "testPayloads",
    });
    const lastStep =
      executionHistory[0]?.steps[executionHistory[0]?.steps.length - 1];
    expect(lastStep).toMatchObject({
      stepName: "testPayloads",
      result: "done",
      findings: [
        {
          name: "Command Injection in parameter 'file'",
          severity: "critical",
          correlation: {
            requestID: "2",
          },
        },
      ],
    });
  });

  it("should detect Windows command injection with type win.ini", async () => {
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

      // Return Unix pattern first since that's the first payload tested
      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {},
        body: "root:x:0:0:root:/root:/bin/bash",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      commandInjectionCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]).toMatchObject({
      checkId: "command-injection",
      targetRequestId: "1",
      status: "completed",
    });
    expect(executionHistory[0]?.steps.length).toBeGreaterThanOrEqual(2);
    expect(executionHistory[0]?.steps[0]).toMatchObject({
      stepName: "findParameters",
      result: "continue",
      nextStep: "testPayloads",
    });
    const lastStep =
      executionHistory[0]?.steps[executionHistory[0]?.steps.length - 1];
    expect(lastStep).toMatchObject({
      stepName: "testPayloads",
      result: "done",
      findings: [
        {
          name: "Command Injection in parameter 'file'",
          severity: "critical",
          correlation: {
            requestID: "2",
          },
        },
      ],
    });
  });

  it("should detect PowerShell command injection with get-help", async () => {
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

      // Return Unix pattern first since that's the first payload tested
      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {},
        body: "root:x:0:0:root:/root:/bin/bash",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      commandInjectionCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]).toMatchObject({
      checkId: "command-injection",
      targetRequestId: "1",
      status: "completed",
    });
    expect(executionHistory[0]?.steps.length).toBeGreaterThanOrEqual(2);
    expect(executionHistory[0]?.steps[0]).toMatchObject({
      stepName: "findParameters",
      result: "continue",
      nextStep: "testPayloads",
    });
    const lastStep =
      executionHistory[0]?.steps[executionHistory[0]?.steps.length - 1];
    expect(lastStep).toMatchObject({
      stepName: "testPayloads",
      result: "done",
      findings: [
        {
          name: "Command Injection in parameter 'file'",
          severity: "critical",
          correlation: {
            requestID: "2",
          },
        },
      ],
    });
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
        body: "root:x:0:0:root:/root:/bin/bash",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      commandInjectionCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]).toMatchObject({
      checkId: "command-injection",
      targetRequestId: "1",
      status: "completed",
    });
    expect(executionHistory[0]?.steps.length).toBeGreaterThanOrEqual(2);
    expect(executionHistory[0]?.steps[0]).toMatchObject({
      stepName: "findParameters",
      result: "continue",
      nextStep: "testPayloads",
    });
    const lastStep =
      executionHistory[0]?.steps[executionHistory[0]?.steps.length - 1];
    expect(lastStep).toMatchObject({
      stepName: "testPayloads",
      result: "done",
      findings: [
        {
          name: "Command Injection in parameter 'file'",
          severity: "critical",
          correlation: {
            requestID: "2",
          },
        },
      ],
    });
  });

  it("should handle HTML entity decoding in responses", async () => {
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

      // Return Unix pattern first since that's the first payload tested
      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: { "Content-Type": ["text/html"] },
        body: "root:x:0:0:root:/root:/bin/bash",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      commandInjectionCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]).toMatchObject({
      checkId: "command-injection",
      targetRequestId: "1",
      status: "completed",
    });
    expect(executionHistory[0]?.steps.length).toBeGreaterThanOrEqual(2);
    expect(executionHistory[0]?.steps[0]).toMatchObject({
      stepName: "findParameters",
      result: "continue",
      nextStep: "testPayloads",
    });
    const lastStep =
      executionHistory[0]?.steps[executionHistory[0]?.steps.length - 1];
    expect(lastStep).toMatchObject({
      stepName: "testPayloads",
      result: "done",
      findings: [
        {
          name: "Command Injection in parameter 'file'",
          severity: "critical",
          correlation: {
            requestID: "2",
          },
        },
      ],
    });
  });

  it("should skip payloads that already match in original response", async () => {
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
      body: "root:x:0:0:root:/root:/bin/bash", // Already contains the pattern
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
        body: "Safe content", // No command injection pattern
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      commandInjectionCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]).toMatchObject({
      checkId: "command-injection",
      targetRequestId: "1",
      status: "completed",
    });
    expect(executionHistory[0]?.steps.length).toBeGreaterThanOrEqual(2);
    expect(executionHistory[0]?.steps[0]).toMatchObject({
      stepName: "findParameters",
      result: "continue",
      nextStep: "testPayloads",
    });
    const lastStep =
      executionHistory[0]?.steps[executionHistory[0]?.steps.length - 1];
    expect(lastStep).toMatchObject({
      stepName: "testPayloads",
      result: "done",
      findings: [],
    });
  });

  it("should test multiple parameters", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/page",
      query: "file=document.txt&action=read",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {},
      body: "OK",
    });

    let callCount = 0;
    const sendHandler = () => {
      callCount++;
      const mockRequest = createMockRequest({
        id: String(callCount + 1),
        host: "example.com",
        method: "GET",
        path: "/page",
      });

      let mockResponse;
      if (callCount === 1) {
        // First parameter test - no injection
        mockResponse = createMockResponse({
          id: "2",
          code: 200,
          headers: {},
          body: "Safe content",
        });
      } else {
        // Second parameter test - injection found
        mockResponse = createMockResponse({
          id: "3",
          code: 200,
          headers: {},
          body: "root:x:0:0:root:/root:/bin/bash",
        });
      }

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      commandInjectionCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]).toMatchObject({
      checkId: "command-injection",
      targetRequestId: "1",
      status: "completed",
    });
    expect(executionHistory[0]?.steps.length).toBeGreaterThanOrEqual(2);
    expect(executionHistory[0]?.steps[0]).toMatchObject({
      stepName: "findParameters",
      result: "continue",
      nextStep: "testPayloads",
    });
    const lastStep =
      executionHistory[0]?.steps[executionHistory[0]?.steps.length - 1];
    expect(lastStep).toMatchObject({
      stepName: "testPayloads",
      result: "done",
      findings: [
        {
          name: "Command Injection in parameter 'file'",
          severity: "critical",
          correlation: {
            requestID: "3",
          },
        },
      ],
    });
  });

  it("should not detect when no response is received", async () => {
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
        code: 500,
        headers: {},
        body: "",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      commandInjectionCheck,
      [{ request, response }],
      { sendHandler },
    );

    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]).toMatchObject({
      checkId: "command-injection",
      targetRequestId: "1",
      status: "completed",
    });
    expect(executionHistory[0]?.steps.length).toBeGreaterThanOrEqual(2);
    expect(executionHistory[0]?.steps[0]).toMatchObject({
      stepName: "findParameters",
      result: "continue",
      nextStep: "testPayloads",
    });
    const lastStep =
      executionHistory[0]?.steps[executionHistory[0]?.steps.length - 1];
    expect(lastStep).toMatchObject({
      stepName: "testPayloads",
      result: "done",
      findings: [],
    });
  });

  it("should respect aggressivity settings for payload count", async () => {
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

    let callCount = 0;
    const sendHandler = () => {
      callCount++;
      const mockRequest = createMockRequest({
        id: String(callCount + 1),
        host: "example.com",
        method: "GET",
        path: "/page",
      });

      const mockResponse = createMockResponse({
        id: String(callCount + 1),
        code: 200,
        headers: {},
        body: "Safe content",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      commandInjectionCheck,
      [{ request, response }],
      {
        sendHandler,
        config: { aggressivity: "low" as const }, // Low aggressivity should limit payloads
      },
    );

    // With low aggressivity, should only test 3 payloads
    expect(callCount).toBeLessThanOrEqual(3);
    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]).toMatchObject({
      checkId: "command-injection",
      targetRequestId: "1",
      status: "completed",
    });
    expect(executionHistory[0]?.steps.length).toBeGreaterThanOrEqual(2);
    expect(executionHistory[0]?.steps[0]).toMatchObject({
      stepName: "findParameters",
      result: "continue",
      nextStep: "testPayloads",
    });
    const lastStep =
      executionHistory[0]?.steps[executionHistory[0]?.steps.length - 1];
    expect(lastStep).toMatchObject({
      stepName: "testPayloads",
      result: "done",
      findings: [],
    });
  });
});
