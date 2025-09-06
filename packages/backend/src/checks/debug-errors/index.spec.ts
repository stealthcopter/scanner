import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import debugErrorsCheck from "./index";

describe("Debug Errors Check", () => {
  it("should detect PHP debug errors", async () => {
    const request = createMockRequest({
      id: "1",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "1",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "PHP Debug: Variable $undefined is not defined",
    });

    const executionHistory = await runCheck(debugErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "debug-errors",
        targetRequestId: "1",
        status: "completed",
        steps: [
          {
            stepName: "checkDebugErrors",
            findings: [
              {
                name: "Debug Error Information Disclosure",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect ASP.NET debug information", async () => {
    const request = createMockRequest({
      id: "2",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "2",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Debug Information: Stack Trace: at System.Web.HttpApplication.ProcessRequest()",
    });

    const executionHistory = await runCheck(debugErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "debug-errors",
        targetRequestId: "2",
        status: "completed",
        steps: [
          {
            stepName: "checkDebugErrors",
            findings: [
              {
                name: "Debug Error Information Disclosure",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect Java exception stack traces", async () => {
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
      body: "Exception in thread \"main\" java.lang.NullPointerException at com.example.Test.main(Test.java:10)",
    });

    const executionHistory = await runCheck(debugErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "debug-errors",
        targetRequestId: "3",
        status: "completed",
        steps: [
          {
            stepName: "checkDebugErrors",
            findings: [
              {
                name: "Debug Error Information Disclosure",
                severity: "low",
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
      id: "4",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "4",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Traceback (most recent call last):\n  File \"app.py\", line 10, in <module>\n    undefined_variable",
    });

    const executionHistory = await runCheck(debugErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "debug-errors",
        targetRequestId: "4",
        status: "completed",
        steps: [
          {
            stepName: "checkDebugErrors",
            findings: [
              {
                name: "Debug Error Information Disclosure",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect Ruby errors", async () => {
    const request = createMockRequest({
      id: "5",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "5",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "NoMethodError: undefined method `undefined_method' for main:Object\n\tfrom app.rb:5:in `<main>'",
    });

    const executionHistory = await runCheck(debugErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "debug-errors",
        targetRequestId: "5",
        status: "completed",
        steps: [
          {
            stepName: "checkDebugErrors",
            findings: [
              {
                name: "Debug Error Information Disclosure",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect development mode indicators", async () => {
    const request = createMockRequest({
      id: "6",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "6",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Development mode: Debug information enabled",
    });

    const executionHistory = await runCheck(debugErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "debug-errors",
        targetRequestId: "6",
        status: "completed",
        steps: [
          {
            stepName: "checkDebugErrors",
            findings: [
              {
                name: "Debug Error Information Disclosure",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect database debug errors", async () => {
    const request = createMockRequest({
      id: "7",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "7",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Query failed: SELECT * FROM non_existent_table",
    });

    const executionHistory = await runCheck(debugErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "debug-errors",
        targetRequestId: "7",
        status: "completed",
        steps: [
          {
            stepName: "checkDebugErrors",
            findings: [
              {
                name: "Debug Error Information Disclosure",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect configuration debug errors", async () => {
    const request = createMockRequest({
      id: "8",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "8",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Configuration error: Environment variable DB_PASSWORD not set",
    });

    const executionHistory = await runCheck(debugErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "debug-errors",
        targetRequestId: "8",
        status: "completed",
        steps: [
          {
            stepName: "checkDebugErrors",
            findings: [
              {
                name: "Debug Error Information Disclosure",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should find no issues when no debug patterns exist", async () => {
    const request = createMockRequest({
      id: "9",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "9",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Welcome to our application",
    });

    const executionHistory = await runCheck(debugErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "debug-errors",
        targetRequestId: "9",
        status: "completed",
        steps: [
          {
            stepName: "checkDebugErrors",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not run when no response body", async () => {
    const request = createMockRequest({
      id: "10",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "10",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "",
    });

    const executionHistory = await runCheck(debugErrorsCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "debug-errors",
        targetRequestId: "10",
        status: "completed",
        steps: [
          {
            stepName: "checkDebugErrors",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });
});
