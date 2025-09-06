import { createMockRequest, createMockResponse, runCheck } from "engine";
import { describe, expect, it } from "vitest";

import hashDisclosureCheck from "./index";

describe("Hash Disclosure Check", () => {
  it("should detect MD5 hash", async () => {
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
      body: "User hash: 5d41402abc4b2a76b9719d911017c592",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "1",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "MD5 Hash Disclosure",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect SHA-1 hash", async () => {
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
      body: "Password hash: aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "2",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "MD5 Hash Disclosure",
                severity: "medium",
              },
              {
                name: "SHA-1 Hash Disclosure",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect SHA-256 hash", async () => {
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
      body: "File hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "3",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "MD5 Hash Disclosure",
                severity: "medium",
              },
              {
                name: "MD5 Hash Disclosure",
                severity: "medium",
              },
              {
                name: "SHA-1 Hash Disclosure",
                severity: "medium",
              },
              {
                name: "SHA-256 Hash Disclosure",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect bcrypt hash", async () => {
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
      body: "Password: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "4",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "bcrypt Hash Disclosure",
                severity: "high",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect Argon2 hash", async () => {
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
      body: "Hash: $argon2id$v=19$m=65536,t=2,p=1$gZiV/M1gPc22ElAH/Jh1Hw$CWOrkoo7oJBQ/iyh7uJ0LO2aLEfrHwTWllSAxT0zRno",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "5",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "Argon2 Hash Disclosure",
                severity: "high",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect NTLM hash", async () => {
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
      body: "NTLM: $NT$5d41402abc4b2a76b9719d911017c592",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "6",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "MD5 Hash Disclosure",
                severity: "medium",
              },
              {
                name: "NTLM Hash Disclosure",
                severity: "high",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect multiple hashes", async () => {
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
      body: "MD5: 5d41402abc4b2a76b9719d911017c592\nSHA-1: aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "7",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "MD5 Hash Disclosure",
                severity: "medium",
              },
              {
                name: "MD5 Hash Disclosure",
                severity: "medium",
              },
              {
                name: "SHA-1 Hash Disclosure",
                severity: "medium",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not detect UUIDs as hashes", async () => {
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
      body: "User ID: 550e8400-e29b-41d4-a716-446655440000",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "8",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should find no issues when no hashes exist", async () => {
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

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "9",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
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

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "10",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [],
            result: "done",
          },
        ],
      },
    ]);
  });
});
