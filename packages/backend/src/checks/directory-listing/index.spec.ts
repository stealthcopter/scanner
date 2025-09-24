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

  it("should escalate candidate set with aggressivity and detect via 'Index of' marker", async () => {
    const request = createMockRequest({
      id: "20",
      host: "example.com",
      method: "GET",
      path: "/a/b/c/file.js",
    });

    let call = 0;
    const sendHandler = () => {
      call += 1;
      if (call === 1) {
        const r = createMockRequest({
          id: "21",
          host: "example.com",
          method: "GET",
          path: "/a/b/c/",
          query: "",
        });
        const resp = createMockResponse({
          id: "21",
          code: 404,
          headers: {},
          body: "Not Found",
        });
        return Promise.resolve({ request: r, response: resp });
      }
      if (call === 2) {
        const r = createMockRequest({
          id: "22",
          host: "example.com",
          method: "GET",
          path: "/a/b/",
          query: "",
        });
        const resp = createMockResponse({
          id: "22",
          code: 200,
          headers: { "content-type": ["text/html"] },
          body: "<h1>Index of /a/b/</h1>",
        });
        return Promise.resolve({ request: r, response: resp });
      }
      const r = createMockRequest({
        id: "23",
        host: "example.com",
        method: "GET",
        path: "/a/",
        query: "",
      });
      const resp = createMockResponse({
        id: "23",
        code: 200,
        headers: { "content-type": ["text/html"] },
        body: "OK",
      });
      return Promise.resolve({ request: r, response: resp });
    };

    const executionHistory = await runCheck(
      directoryListingCheck,
      [{ request, response: undefined }],
      { sendHandler, config: { aggressivity: ScanAggressivity.HIGH } },
    );

    expect(executionHistory).toMatchObject([
      {
        checkId: "directory-listing",
        targetRequestId: "20",
        status: "completed",
        steps: expect.arrayContaining([
          expect.objectContaining({ stepName: "setupScan" }),
          expect.objectContaining({
            stepName: "testCandidate",
            findings: [
              expect.objectContaining({
                name: "Directory Listing Enabled",
                severity: "medium",
              }),
            ],
          }),
        ]),
      },
    ]);
  });
});
