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
                name: "MD4 / MD5 Hash Disclosure",
                severity: "low",
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
                name: "SHA-1 Hash Disclosure",
                severity: "low",
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
                name: "SHA-256 Hash Disclosure",
                severity: "low",
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
                name: "BCrypt Hash Disclosure",
                severity: "high",
              },
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
                name: "NTLM Hash Disclosure",
                severity: "high",
              },
              {
                name: "MD4 / MD5 Hash Disclosure",
                severity: "low",
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
                name: "SHA-1 Hash Disclosure",
                severity: "low",
              },
              {
                name: "MD4 / MD5 Hash Disclosure",
                severity: "low",
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

  it("should detect MD5 Crypt hash", async () => {
    const request = createMockRequest({
      id: "11",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "11",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Password: $1$O3JMY.Tw$AdLnLjQ/5jXF9.MTp3gHv/",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "11",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "MD5 Crypt Hash Disclosure",
                severity: "high",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect SHA-256 Crypt hash", async () => {
    const request = createMockRequest({
      id: "12",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "12",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Hash: $5$MnfsQ4iN$ZMTppKN16y/tIsUYs/obHlhdP.Os80yXhTurpBMUbA5",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "12",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "SHA-256 Crypt Hash Disclosure",
                severity: "high",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect SHA-512 Crypt hash", async () => {
    const request = createMockRequest({
      id: "13",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "13",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Hash: $6$zWwwXKNj$gLAOoZCjcr8p/.VgV/FkGC3NX7BsXys3KHYePfuIGMNjY83dVxugPYlxVg/evpcVEJLT/rSwZcDMlVVf/bhf.1",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "13",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "SHA-512 Crypt Hash Disclosure",
                severity: "high",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect LanMan hash", async () => {
    const request = createMockRequest({
      id: "14",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "14",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "LanMan: $LM$aad3b435b51404ee",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "14",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "LanMan / DES Hash Disclosure",
                severity: "high",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect OpenBSD Blowfish hash", async () => {
    const request = createMockRequest({
      id: "15",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "15",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Password: $2a$05$bvIG6Nmid91Mu9RcmmWZfO5HJIMCT8riNW0hEp8f6/FuA2/mHZFpe",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "15",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "OpenBSD Blowfish Hash Disclosure",
                severity: "high",
              },
              {
                name: "BCrypt Hash Disclosure",
                severity: "high",
              },
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

  it("should detect salted SHA-1 hash", async () => {
    const request = createMockRequest({
      id: "16",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "16",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Hash: 0E6A48F765D0FFFFF6247FA80D748E615F91DD0C7431E4D9",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "16",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "Salted SHA-1 Hash Disclosure",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect SHA-224 hash", async () => {
    const request = createMockRequest({
      id: "17",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "17",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Hash: d14a028c2a3a2bc9476102bb288234c415a2b01f828ea62ac5b3e42f",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "17",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "SHA-224 Hash Disclosure",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should detect SHA-384 hash", async () => {
    const request = createMockRequest({
      id: "18",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "18",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "Hash: 38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "18",
        status: "completed",
        steps: [
          {
            stepName: "checkHashDisclosure",
            findings: [
              {
                name: "SHA-384 Hash Disclosure",
                severity: "low",
              },
            ],
            result: "done",
          },
        ],
      },
    ]);
  });

  it("should not detect JSESSIONID as MD5 hash", async () => {
    const request = createMockRequest({
      id: "19",
      host: "example.com",
      method: "GET",
      path: "/test",
    });

    const response = createMockResponse({
      id: "19",
      code: 200,
      headers: { "content-type": ["text/html"] },
      body: "jsessionid=5d41402abc4b2a76b9719d911017c592",
    });

    const executionHistory = await runCheck(hashDisclosureCheck, [
      { request, response },
    ]);

    expect(executionHistory).toMatchObject([
      {
        checkId: "hash-disclosure",
        targetRequestId: "19",
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
