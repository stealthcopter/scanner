import {
  createMockRequest,
  createMockResponse,
  runCheck,
  ScanAggressivity,
} from "engine";
import { describe, expect, it } from "vitest";

import gitConfigCheck from "./index";

describe("git-config check", () => {
  it("should detect exposed git config file with valid content", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/app/index.html",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/app/.git/config",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {
          "Content-Type": ["text/plain"],
        },
        body: '[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n[remote "origin"]\n\turl = https://github.com/user/repo.git\n[branch "main"]\n\tremote = origin',
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      gitConfigCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "git-config",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              gitFiles: [],
              basePath: "",
            },
            stateAfter: {
              gitFiles: [".git/config"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testGitFile",
          },
          {
            stepName: "testGitFile",
            stateBefore: {
              gitFiles: [".git/config"],
              basePath: "/app",
            },
            stateAfter: {
              gitFiles: [".git/config"],
              basePath: "/app",
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

  it("should not detect when git file returns 404", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/app/index.html",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/app/.git/config",
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
      gitConfigCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    expect(executionHistory).toEqual([
      {
        checkId: "git-config",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              gitFiles: [],
              basePath: "",
            },
            stateAfter: {
              gitFiles: [".git/config"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testGitFile",
          },
          {
            stepName: "testGitFile",
            stateBefore: {
              gitFiles: [".git/config"],
              basePath: "/app",
            },
            stateAfter: {
              gitFiles: [],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testGitFile",
          },
          {
            stepName: "testGitFile",
            stateBefore: {
              gitFiles: [],
              basePath: "/app",
            },
            stateAfter: {
              gitFiles: [],
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

  it("should not detect when file content is not valid git format", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/app/index.html",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/app/.git/config",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: "<html><body><h1>Access Denied</h1></body></html>",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      gitConfigCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      },
    );

    expect(executionHistory).toEqual([
      {
        checkId: "git-config",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              gitFiles: [],
              basePath: "",
            },
            stateAfter: {
              gitFiles: [".git/config"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testGitFile",
          },
          {
            stepName: "testGitFile",
            stateBefore: {
              gitFiles: [".git/config"],
              basePath: "/app",
            },
            stateAfter: {
              gitFiles: [],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testGitFile",
          },
          {
            stepName: "testGitFile",
            stateBefore: {
              gitFiles: [],
              basePath: "/app",
            },
            stateAfter: {
              gitFiles: [],
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
