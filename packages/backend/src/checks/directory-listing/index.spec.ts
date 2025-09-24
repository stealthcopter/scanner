import {
  createMockRequest,
  createMockResponse,
  runCheck,
  ScanAggressivity,
} from "engine";
import { describe, expect, it } from "vitest";

import directoryListingCheck from "./index";

describe("directory-listing check", () => {
  it("should detect Apache style directory listing at current directory", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/uploads/file.txt",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "2",
        host: "example.com",
        method: "GET",
        path: "/uploads/",
      });

      const mockResponse = createMockResponse({
        id: "2",
        code: 200,
        headers: { "content-type": ["text/html"] },
        body: '<html><head><title>Index of /uploads/</title></head><body><h1>Index of /uploads/</h1><a href="../">Parent Directory</a></body></html>',
      });

      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      directoryListingCheck,
      [{ request, response: undefined }],
      { sendHandler, config: { aggressivity: ScanAggressivity.LOW } },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "directory-listing",
        targetRequestId: "1",
        status: "completed",
        steps: [
          { stepName: "setupScan" },
          {
            stepName: "testCandidate",
            findings: [
              {
                name: "Directory Listing Enabled",
                severity: "medium",
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should not run when response probing returns non-200 for all candidates", async () => {
    const request = createMockRequest({
      id: "10",
      host: "example.com",
      method: "GET",
      path: "/images/pic.png",
    });

    const sendHandler = () => {
      const mockRequest = createMockRequest({
        id: "11",
        host: "example.com",
        method: "GET",
        path: "/images/",
      });
      const mockResponse = createMockResponse({
        id: "11",
        code: 404,
        headers: {},
        body: "Not Found",
      });
      return Promise.resolve({ request: mockRequest, response: mockResponse });
    };

    const executionHistory = await runCheck(
      directoryListingCheck,
      [{ request, response: undefined }],
      { sendHandler, config: { aggressivity: ScanAggressivity.LOW } },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "directory-listing",
        targetRequestId: "10",
        status: "completed",
        steps: [
          { stepName: "setupScan" },
          { stepName: "testCandidate", findings: [] },
          { stepName: "testCandidate", findings: [] },
        ],
      },
    ]);
  });
});
