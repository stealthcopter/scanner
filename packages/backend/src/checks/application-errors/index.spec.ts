import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import applicationErrorsCheck from "./index";

describe("Application Errors Check", () => {
  it("should detect MySQL error messages", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "1",
      code: 500,
      headers: { "content-type": ["text/html"] },
      body: "mysql_fetch_array() expects parameter 1 to be resource, boolean given",
    });

    const executionHistory = await runCheck(applicationErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "application-errors",
        targetRequestId: "1",
        status: "completed",
        steps: [
          {
            stepName: "checkApplicationErrors",
            findings: [
              {
                name: "Application Error Information Disclosure",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect Oracle error messages", async () => {
    const request = createMockRequest({
      id: "2",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "2",
      code: 500,
      headers: { "content-type": ["text/html"] },
      body: "ORA-00942: table or view does not exist",
    });

    const executionHistory = await runCheck(applicationErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "application-errors",
        targetRequestId: "2",
        status: "completed",
        steps: [
          {
            stepName: "checkApplicationErrors",
            findings: [
              {
                name: "Application Error Information Disclosure",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not run on successful responses", async () => {
    const request = createMockRequest({
      id: "3",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "3",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Success",
    });

    const executionHistory = await runCheck(applicationErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([]);
  });

  it("should detect ASP.NET error messages", async () => {
    const request = createMockRequest({
      id: "4",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "4",
      code: 500,
      headers: { "content-type": ["text/html"] },
      body: "Server Error in '/' Application. System.Web.HttpException: The resource cannot be found.",
    });

    const executionHistory = await runCheck(applicationErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "application-errors",
        targetRequestId: "4",
        status: "completed",
        steps: [
          {
            stepName: "checkApplicationErrors",
            findings: [
              {
                name: "Application Error Information Disclosure",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect Java stack trace errors", async () => {
    const request = createMockRequest({
      id: "5",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "5",
      code: 500,
      headers: { "content-type": ["text/html"] },
      body: "Exception in thread \"main\" java.lang.NullPointerException at com.example.Test.main(Test.java:10)",
    });

    const executionHistory = await runCheck(applicationErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "application-errors",
        targetRequestId: "5",
        status: "completed",
        steps: [
          {
            stepName: "checkApplicationErrors",
            findings: [
              {
                name: "Application Error Information Disclosure",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect PHP fatal errors", async () => {
    const request = createMockRequest({
      id: "6",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "6",
      code: 500,
      headers: { "content-type": ["text/html"] },
      body: "Fatal error: Call to undefined function undefined_function() in /var/www/index.php on line 5",
    });

    const executionHistory = await runCheck(applicationErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "application-errors",
        targetRequestId: "6",
        status: "completed",
        steps: [
          {
            stepName: "checkApplicationErrors",
            findings: [
              {
                name: "Application Error Information Disclosure",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect Python traceback errors", async () => {
    const request = createMockRequest({
      id: "7",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "7",
      code: 500,
      headers: { "content-type": ["text/html"] },
      body: "Traceback (most recent call last):\n  File \"app.py\", line 10, in <module>\n    undefined_variable",
    });

    const executionHistory = await runCheck(applicationErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "application-errors",
        targetRequestId: "7",
        status: "completed",
        steps: [
          {
            stepName: "checkApplicationErrors",
            findings: [
              {
                name: "Application Error Information Disclosure",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should find no issues when no error patterns exist", async () => {
    const request = createMockRequest({
      id: "8",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "8",
      code: 500,
      headers: { "content-type": ["text/html"] },
      body: "Something went wrong",
    });

    const executionHistory = await runCheck(applicationErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "application-errors",
        targetRequestId: "8",
        status: "completed",
        steps: [
          {
            stepName: "checkApplicationErrors",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not run when no response body", async () => {
    const request = createMockRequest({
      id: "9",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "9",
      code: 500,
      headers: { "content-type": ["text/html"] },
      body: "",
    });

    const executionHistory = await runCheck(applicationErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "application-errors",
        targetRequestId: "9",
        status: "completed",
        steps: [
          {
            stepName: "checkApplicationErrors",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });
});
