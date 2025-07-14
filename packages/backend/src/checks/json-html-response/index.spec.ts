import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import jsonHtmlResponseCheck from "./index";

describe("json-html-response check", () => {
  it("should detect JSON response with HTML content-type", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/api/data",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "Content-Type": ["text/html; charset=utf-8"],
      },
      body: JSON.stringify({ message: "Hello World", data: [1, 2, 3] }),
    });

    const executionHistory = await runCheck(jsonHtmlResponseCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "json-html-response",
        targetRequestId: "1",
        steps: [
          {
            stepName: "checkJsonHtmlResponse",
            stateBefore: {},
            stateAfter: {},
            findings: [
              {
                correlation: {
                  requestID: "1",
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

  it("should not detect when content-type is not HTML", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/api/data",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "Content-Type": ["application/json"],
      },
      body: JSON.stringify({ message: "Hello World", data: [1, 2, 3] }),
    });

    const executionHistory = await runCheck(jsonHtmlResponseCheck, [
      { request, response },
    ]);

    expect(executionHistory).toEqual([
      {
        checkId: "json-html-response",
        targetRequestId: "1",
        steps: [
          {
            stepName: "checkJsonHtmlResponse",
            stateBefore: {},
            stateAfter: {},
            findings: [],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should not detect when body is not valid JSON", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/page",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "Content-Type": ["text/html; charset=utf-8"],
      },
      body: "<html><body><h1>Hello World</h1></body></html>",
    });

    const executionHistory = await runCheck(jsonHtmlResponseCheck, [
      { request, response },
    ]);

    expect(executionHistory).toEqual([
      {
        checkId: "json-html-response",
        targetRequestId: "1",
        steps: [
          {
            stepName: "checkJsonHtmlResponse",
            stateBefore: {},
            stateAfter: {},
            findings: [],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should not detect when body is empty", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/empty",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: {
        "Content-Type": ["text/html; charset=utf-8"],
      },
      body: "",
    });

    const executionHistory = await runCheck(jsonHtmlResponseCheck, [
      { request, response },
    ]);

    expect(executionHistory).toEqual([
      {
        checkId: "json-html-response",
        targetRequestId: "1",
        steps: [
          {
            stepName: "checkJsonHtmlResponse",
            stateBefore: {},
            stateAfter: {},
            findings: [],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });
});
