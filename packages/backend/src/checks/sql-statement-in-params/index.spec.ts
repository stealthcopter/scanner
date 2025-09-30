import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import check from "./index";

describe("sql-statement-in-params check", () => {
  it("should detect SQL statement in query parameter", async () => {
    const request = createMockRequest({
      id: "q1",
      host: "example.com",
      method: "GET",
      path: "/search",
      query: "q=select%20*%20from%20users%20where%20id%3D1",
    });

    const response = createMockResponse({
      id: "q1",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "ok",
    });

    const history = await runCheck(check, [{ request, response }]);

    expect(history).toMatchObject([
      {
        checkId: "sql-statement-in-params",
        targetRequestId: "q1",
        status: "completed",
        steps: [
          {
            stepName: "scanParameters",
            findings: [
              {
                name: expect.stringContaining(
                  "SQL Statement Detected in Parameter",
                ),
                severity: "info",
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should detect SQL statement in body parameter (form)", async () => {
    const request = createMockRequest({
      id: "b1",
      host: "example.com",
      method: "POST",
      path: "/submit",
      headers: { "content-type": ["application/x-www-form-urlencoded"] },
      body: "comment=union+select+username%2C+password+from+users",
    });

    const response = createMockResponse({
      id: "b1",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "ok",
    });

    const history = await runCheck(check, [{ request, response }]);

    expect(history).toMatchObject([
      {
        checkId: "sql-statement-in-params",
        targetRequestId: "b1",
        status: "completed",
        steps: [
          {
            stepName: "scanParameters",
            findings: [
              {
                name: expect.stringContaining(
                  "SQL Statement Detected in Parameter",
                ),
                severity: "info",
              },
            ],
          },
        ],
      },
    ]);
  });

  it("should find no issues for benign parameters", async () => {
    const request = createMockRequest({
      id: "n1",
      host: "example.com",
      method: "GET",
      path: "/search",
      query: "q=selectivity+is+cool",
    });

    const response = createMockResponse({
      id: "n1",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "ok",
    });

    const history = await runCheck(check, [{ request, response }]);

    expect(history).toMatchObject([
      {
        checkId: "sql-statement-in-params",
        targetRequestId: "n1",
        status: "completed",
        steps: [
          {
            stepName: "scanParameters",
            findings: [],
          },
        ],
      },
    ]);
  });

  it("should handle non-string JSON values without errors", async () => {
    const request = createMockRequest({
      id: "j1",
      host: "example.com",
      method: "POST",
      path: "/api/data",
      headers: { "content-type": ["application/json"] },
      body: '{"id":123,"active":true,"query":"select * from users"}',
    });

    const response = createMockResponse({
      id: "j1",
      code: 200,
      headers: { "content-type": ["application/json"] },
      body: "ok",
    });

    const history = await runCheck(check, [{ request, response }]);

    expect(history).toMatchObject([
      {
        checkId: "sql-statement-in-params",
        targetRequestId: "j1",
        status: "completed",
        steps: [
          {
            stepName: "scanParameters",
            findings: [
              {
                name: expect.stringContaining(
                  "SQL Statement Detected in Parameter",
                ),
                severity: "info",
              },
            ],
          },
        ],
      },
    ]);
  });
});
