import {
  createMockRequest,
  createMockResponse,
  runCheck,
  ScanAggressivity,
} from "engine";
import { describe, expect, it } from "vitest";

import exposedEnvCheck from "./index";

describe("exposed-env check", () => {
  it("should detect exposed .env file with valid content", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/app/page.php",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/app/.env",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {
          "Content-Type": ["text/plain"],
        },
        body: "API_KEY=secret123",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      exposedEnvCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "exposed-env",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              envFiles: [],
              basePath: "",
            },
            stateAfter: {
              envFiles: [".env"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testEnvFile",
          },
          {
            stepName: "testEnvFile",
            stateBefore: {
              envFiles: [".env"],
              basePath: "/app",
            },
            stateAfter: {
              envFiles: [],
              basePath: "/app",
            },
            findings: [
              {
                correlation: {
                  requestID: "2",
                },
              },
            ],
            result: "continue",
            nextStep: "testEnvFile",
          },
          {
            stepName: "testEnvFile",
            stateBefore: {
              envFiles: [],
              basePath: "/app",
            },
            stateAfter: {
              envFiles: [],
              basePath: "/app",
            },
            findings: [],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should not detect when .env file returns 404", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/app/page.php",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/app/.env",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 404,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: "Not Found",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      exposedEnvCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    expect(executionHistory).toEqual([
      {
        checkId: "exposed-env",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              envFiles: [],
              basePath: "",
            },
            stateAfter: {
              envFiles: [".env"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testEnvFile",
          },
          {
            stepName: "testEnvFile",
            stateBefore: {
              envFiles: [".env"],
              basePath: "/app",
            },
            stateAfter: {
              envFiles: [],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testEnvFile",
          },
          {
            stepName: "testEnvFile",
            stateBefore: {
              envFiles: [],
              basePath: "/app",
            },
            stateAfter: {
              envFiles: [],
              basePath: "/app",
            },
            findings: [],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should not detect when file content is not valid env format", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/app/page.php",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/app/.env",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: "<html><body><h1>Welcome</h1></body></html>",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      exposedEnvCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    expect(executionHistory).toEqual([
      {
        checkId: "exposed-env",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              envFiles: [],
              basePath: "",
            },
            stateAfter: {
              envFiles: [".env"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testEnvFile",
          },
          {
            stepName: "testEnvFile",
            stateBefore: {
              envFiles: [".env"],
              basePath: "/app",
            },
            stateAfter: {
              envFiles: [],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testEnvFile",
          },
          {
            stepName: "testEnvFile",
            stateBefore: {
              envFiles: [],
              basePath: "/app",
            },
            stateAfter: {
              envFiles: [],
              basePath: "/app",
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
