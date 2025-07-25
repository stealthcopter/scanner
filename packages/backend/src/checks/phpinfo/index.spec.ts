import {
  createMockRequest,
  createMockResponse,
  runCheck,
  ScanAggressivity,
} from "engine";
import { describe, expect, it } from "vitest";

import phpinfoCheck from "./index";

describe("phpinfo check", () => {
  it("should detect exposed phpinfo page with valid content", async () => {
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
        path: "/app/phpinfo.php",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: "<html><head><title>PHP Version 8.1.2</title></head><body><h1>PHP Version 8.1.2</h1><table><tr><td>PHP Extension</td><td>Core</td></tr></table></body></html>",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      phpinfoCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      }
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "phpinfo",
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              phpinfoPaths: [],
              basePath: "",
            },
            stateAfter: {
              phpinfoPaths: ["phpinfo.php"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: ["phpinfo.php"],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: ["phpinfo.php"],
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

  it("should not detect when phpinfo file returns 404", async () => {
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
        path: "/app/phpinfo.php",
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
      phpinfoCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      }
    );

    expect(executionHistory).toEqual([
      {
        checkId: "phpinfo",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              phpinfoPaths: [],
              basePath: "",
            },
            stateAfter: {
              phpinfoPaths: ["phpinfo.php"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: ["phpinfo.php"],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: [],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: [],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: [],
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

  it("should not detect when file content is not valid phpinfo format", async () => {
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
        path: "/app/phpinfo.php",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: "<html><body><h1>Regular HTML Page</h1><p>This is not a phpinfo page</p></body></html>",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      phpinfoCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      }
    );

    expect(executionHistory).toEqual([
      {
        checkId: "phpinfo",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              phpinfoPaths: [],
              basePath: "",
            },
            stateAfter: {
              phpinfoPaths: ["phpinfo.php"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: ["phpinfo.php"],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: [],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: [],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: [],
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

  it("should not detect when response has only PHP Version but no PHP Extension", async () => {
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
        path: "/app/phpinfo.php",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: "<html><body><h1>PHP Version 8.1.2</h1><p>Just version info</p></body></html>",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      phpinfoCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      }
    );

    expect(executionHistory).toEqual([
      {
        checkId: "phpinfo",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              phpinfoPaths: [],
              basePath: "",
            },
            stateAfter: {
              phpinfoPaths: ["phpinfo.php"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: ["phpinfo.php"],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: [],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: [],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: [],
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

  it("should not detect when response body is empty", async () => {
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
        path: "/app/phpinfo.php",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: "",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      phpinfoCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.LOW },
      }
    );

    expect(executionHistory).toEqual([
      {
        checkId: "phpinfo",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              phpinfoPaths: [],
              basePath: "",
            },
            stateAfter: {
              phpinfoPaths: ["phpinfo.php"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: ["phpinfo.php"],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: [],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: [],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: [],
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

  it("should test multiple paths on medium aggressivity", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/app/index.html",
    });

    let callCount = 0;
    const sendHandler = () => {
      callCount++;
      const mockRequest = createMockRequest({
        id: (callCount + 1).toString(),
        host: "example.com",
        method: "GET",
        path: callCount === 1 ? "/app/phpinfo.php" : "/app/php_info.php",
      });

      const mockResponse = createMockResponse({
        id: (callCount + 1).toString(),
        code: 404,
        headers: {
          "Content-Type": ["text/html"],
        },
        body: "Not Found",
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      phpinfoCheck,
      [{ request, response: undefined }],
      {
        sendHandler,
        config: { aggressivity: ScanAggressivity.MEDIUM },
      }
    );

    expect(executionHistory).toEqual([
      {
        checkId: "phpinfo",
        finalOutput: undefined,
        targetRequestId: "1",
        steps: [
          {
            stepName: "setupScan",
            stateBefore: {
              phpinfoPaths: [],
              basePath: "",
            },
            stateAfter: {
              phpinfoPaths: ["phpinfo.php", "php_info.php"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: ["phpinfo.php", "php_info.php"],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: ["php_info.php"],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: ["php_info.php"],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: [],
              basePath: "/app",
            },
            findings: [],
            result: "continue",
            nextStep: "testPhpinfoPath",
          },
          {
            stepName: "testPhpinfoPath",
            stateBefore: {
              phpinfoPaths: [],
              basePath: "/app",
            },
            stateAfter: {
              phpinfoPaths: [],
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
