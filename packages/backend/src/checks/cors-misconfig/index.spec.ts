import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import corsMisconfigCheck from "./index";

describe("cors-misconfig check", () => {
  // Passive tests
  it("should detect wildcard origin with credentials", async () => {
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
        "Access-Control-Allow-Origin": ["*"],
        "Access-Control-Allow-Credentials": ["true"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(corsMisconfigCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cors-misconfig",
        targetRequestId: "1",
        steps: [
          {
            stepName: "passiveCheck",
            findings: [
              {
                name: "CORS Wildcard with Credentials",
                correlation: { requestID: "1" },
              },
            ],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });

  // Active tests - origin reflection
  it("should detect arbitrary origin reflection", async () => {
    const request = createMockRequest({
      id: "4",
      host: "example.com",
      method: "GET",
      path: "/api/data",
      tls: true,
    });

    const response = createMockResponse({
      id: "4",
      code: 200,
      headers: {
        "Access-Control-Allow-Origin": ["https://example.com"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(
      corsMisconfigCheck,
      [{ request, response }],
      {
        sendHandler: (spec) => {
          const origin = spec.getHeader("Origin")?.[0];

          const request = createMockRequest({
            id: `test-${Math.random()}`,
            host: spec.getHost(),
            method: spec.getMethod(),
            path: spec.getPath(),
          });

          const response = createMockResponse({
            id: `test-${Math.random()}`,
            code: 200,
            headers: {
              "Access-Control-Allow-Origin":
                origin !== undefined ? [origin] : [],
            },
            body: "test",
          });

          return { request, response };
        },
      },
    );

    // Should trigger active tests and find origin reflection
    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]?.status).toBe("completed");
    expect(executionHistory[0]?.steps.length).toBeGreaterThan(1);

    const hasOriginReflectionFinding = executionHistory[0]?.steps.some((step) =>
      step.findings.some(
        (finding) => finding.name === "CORS Arbitrary Origin Reflection",
      ),
    );
    expect(hasOriginReflectionFinding).toBe(true);
  });

  // Active tests - null origin
  it("should detect null origin allowed", async () => {
    const request = createMockRequest({
      id: "5",
      host: "example.com",
      method: "GET",
      path: "/api/data",
      tls: true,
    });

    const response = createMockResponse({
      id: "5",
      code: 200,
      headers: {
        "Access-Control-Allow-Origin": ["https://example.com"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(
      corsMisconfigCheck,
      [{ request, response }],
      {
        sendHandler: (spec) => {
          const origin = spec.getHeader("Origin")?.[0];

          const request = createMockRequest({
            id: `test-${Math.random()}`,
            host: spec.getHost(),
            method: spec.getMethod(),
            path: spec.getPath(),
          });

          const responseHeaders: Record<string, string[]> = {};
          if (origin === "null") {
            responseHeaders["Access-Control-Allow-Origin"] = ["null"];
          }

          const response = createMockResponse({
            id: `test-${Math.random()}`,
            code: 200,
            headers: responseHeaders,
            body: "test",
          });

          return { request, response };
        },
      },
    );

    // Should trigger active tests and find null origin
    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]?.status).toBe("completed");
    expect(executionHistory[0]?.steps.length).toBeGreaterThan(1);

    const hasNullOriginFinding = executionHistory[0]?.steps.some((step) =>
      step.findings.some(
        (finding) => finding.name === "CORS Null Origin Allowed",
      ),
    );
    expect(hasNullOriginFinding).toBe(true);
  });

  // Active tests - subdomain wildcard
  it("should detect subdomain wildcard", async () => {
    const request = createMockRequest({
      id: "6",
      host: "example.com",
      method: "GET",
      path: "/api/data",
      tls: true,
    });

    const response = createMockResponse({
      id: "6",
      code: 200,
      headers: {
        "Access-Control-Allow-Origin": ["https://example.com"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(
      corsMisconfigCheck,
      [{ request, response }],
      {
        sendHandler: (spec) => {
          const origin = spec.getHeader("Origin")?.[0];

          const request = createMockRequest({
            id: `test-${Math.random()}`,
            host: spec.getHost(),
            method: spec.getMethod(),
            path: spec.getPath(),
          });

          const responseHeaders: Record<string, string[]> = {};
          if (origin === "https://example.com.example.com") {
            responseHeaders["Access-Control-Allow-Origin"] = [origin];
          }

          const response = createMockResponse({
            id: `test-${Math.random()}`,
            code: 200,
            headers: responseHeaders,
            body: "test",
          });

          return { request, response };
        },
      },
    );

    // Should trigger active tests and find subdomain wildcard
    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]?.status).toBe("completed");
    expect(executionHistory[0]?.steps.length).toBeGreaterThan(1);

    const hasSubdomainWildcardFinding = executionHistory[0]?.steps.some(
      (step) =>
        step.findings.some(
          (finding) => finding.name === "CORS Subdomain Wildcard",
        ),
    );
    expect(hasSubdomainWildcardFinding).toBe(true);
  });

  // Negative tests
  it("should not detect when no CORS headers present", async () => {
    const request = createMockRequest({
      id: "7",
      host: "example.com",
      method: "GET",
      path: "/api/data",
    });

    const response = createMockResponse({
      id: "7",
      code: 200,
      headers: {
        "Content-Type": ["application/json"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(corsMisconfigCheck, [
      { request, response },
    ]);

    expect(executionHistory).toEqual([
      {
        checkId: "cors-misconfig",
        targetRequestId: "7",
        steps: [
          {
            stepName: "passiveCheck",
            stateBefore: {
              originTests: [],
              requestHost: "",
              requestScheme: "",
            },
            stateAfter: {
              originTests: [],
              requestHost: "",
              requestScheme: "",
            },
            findings: [],
            result: "done",
          },
        ],
        status: "completed",
      },
    ]);
  });

  it("should not detect when wildcard origin without credentials", async () => {
    const request = createMockRequest({
      id: "8",
      host: "example.com",
      method: "GET",
      path: "/api/data",
    });

    const response = createMockResponse({
      id: "8",
      code: 200,
      headers: {
        "Access-Control-Allow-Origin": ["*"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(corsMisconfigCheck, [
      { request, response },
    ]);

    // Should proceed to active tests but not find any vulnerabilities
    expect(
      executionHistory[0]?.steps.every(
        (step) =>
          !step.findings.some((finding) =>
            finding.name.includes("Wildcard with Credentials"),
          ),
      ),
    ).toBe(true);
  });

  it("should not detect when legitimate same-origin CORS", async () => {
    const request = createMockRequest({
      id: "9",
      host: "example.com",
      method: "GET",
      path: "/api/data",
      tls: true,
      headers: {
        Origin: ["https://example.com"],
      },
    });

    const response = createMockResponse({
      id: "9",
      code: 200,
      headers: {
        "Access-Control-Allow-Origin": ["https://example.com"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(corsMisconfigCheck, [
      { request, response },
    ]);

    // Should proceed to active tests but not find any vulnerabilities
    expect(executionHistory).toHaveLength(1);
    expect(executionHistory[0]?.status).toBe("completed");
  });

  it("should not detect when no response", async () => {
    const request = createMockRequest({
      id: "10",
      host: "example.com",
      method: "GET",
      path: "/api/data",
    });

    const executionHistory = await runCheck(corsMisconfigCheck, [
      { request, response: undefined },
    ]);

    expect(executionHistory).toEqual([
      {
        checkId: "cors-misconfig",
        targetRequestId: "10",
        steps: [
          {
            stepName: "passiveCheck",
            stateBefore: {
              originTests: [],
              requestHost: "",
              requestScheme: "",
            },
            stateAfter: {
              originTests: [],
              requestHost: "",
              requestScheme: "",
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
