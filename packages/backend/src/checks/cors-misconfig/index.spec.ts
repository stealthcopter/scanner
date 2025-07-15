import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import corsMisconfigCheck from "./index";

describe("cors-misconfig check", () => {
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
            stepName: "checkCorsHeaders",
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

  it("should detect null origin allowed", async () => {
    const request = createMockRequest({
      id: "2",
      host: "example.com",
      method: "GET",
      path: "/api/data",
    });

    const response = createMockResponse({
      id: "2",
      code: 200,
      headers: {
        "Access-Control-Allow-Origin": ["null"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(corsMisconfigCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cors-misconfig",
        targetRequestId: "2",
        steps: [
          {
            stepName: "checkCorsHeaders",
            stateBefore: {},
            stateAfter: {},
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

  it("should detect origin reflection", async () => {
    const request = createMockRequest({
      id: "3",
      host: "example.com",
      method: "GET",
      path: "/api/data",
      headers: {
        Origin: ["https://attacker.com"],
      },
    });

    const response = createMockResponse({
      id: "3",
      code: 200,
      headers: {
        "Access-Control-Allow-Origin": ["https://attacker.com"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(corsMisconfigCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "cors-misconfig",
        targetRequestId: "3",
        steps: [
          {
            stepName: "checkCorsHeaders",
            stateBefore: {},
            stateAfter: {},
            findings: [
              {
                correlation: {
                  requestID: "3",
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

  it("should not detect when no CORS headers present", async () => {
    const request = createMockRequest({
      id: "4",
      host: "example.com",
      method: "GET",
      path: "/api/data",
    });

    const response = createMockResponse({
      id: "4",
      code: 200,
      headers: {
        "Content-Type": ["application/json"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(corsMisconfigCheck, [
      { request, response },
    ]);

    expect(executionHistory).toEqual([]);
  });

  it("should not detect when wildcard origin without credentials", async () => {
    const request = createMockRequest({
      id: "5",
      host: "example.com",
      method: "GET",
      path: "/api/data",
    });

    const response = createMockResponse({
      id: "5",
      code: 200,
      headers: {
        "Access-Control-Allow-Origin": ["*"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(corsMisconfigCheck, [
      { request, response },
    ]);

    expect(executionHistory).toEqual([
      {
        checkId: "cors-misconfig",
        targetRequestId: "5",
        steps: [
          {
            stepName: "checkCorsHeaders",
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

  it("should not detect when legitimate same-origin CORS", async () => {
    const request = createMockRequest({
      id: "6",
      host: "example.com",
      method: "GET",
      path: "/api/data",
      headers: {
        Origin: ["https://example.com"],
      },
    });

    const response = createMockResponse({
      id: "6",
      code: 200,
      headers: {
        "Access-Control-Allow-Origin": ["https://legitimate.com"],
      },
      body: JSON.stringify({ data: "test" }),
    });

    const executionHistory = await runCheck(corsMisconfigCheck, [
      { request, response },
    ]);

    expect(executionHistory).toEqual([
      {
        checkId: "cors-misconfig",
        targetRequestId: "6",
        steps: [
          {
            stepName: "checkCorsHeaders",
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

  it("should not detect when no response", async () => {
    const request = createMockRequest({
      id: "7",
      host: "example.com",
      method: "GET",
      path: "/api/data",
    });

    const executionHistory = await runCheck(corsMisconfigCheck, [
      { request, response: undefined },
    ]);

    expect(executionHistory).toEqual([]);
  });
});
