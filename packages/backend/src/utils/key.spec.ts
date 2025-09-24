import { createMockRequest } from "engine";
import { describe, expect, it } from "vitest";

import { keyStrategy } from "./key";

describe("keyStrategy", () => {
  const createMockScanTarget = (requestData: any) => ({
    request: createMockRequest(requestData),
  });

  it("should generate empty key when no parts are added", () => {
    const keyFn = keyStrategy().build();
    const target = createMockScanTarget({
      id: "1",
      host: "example.com",
      port: 443,
      method: "GET",
      path: "/",
    });

    const key = keyFn(target);
    expect(key).toBe("");
  });

  it("should generate key with host only", () => {
    const keyFn = keyStrategy().withHost().build();
    const target = createMockScanTarget({
      id: "1",
      host: "Example.COM",
      port: 443,
      method: "GET",
      path: "/",
    });

    const key = keyFn(target);
    expect(key).toBe("example.com");
  });

  it("should generate key with port only", () => {
    const keyFn = keyStrategy().withPort().build();
    const target = createMockScanTarget({
      id: "1",
      host: "example.com",
      port: 8080,
      method: "GET",
      path: "/",
    });

    const key = keyFn(target);
    expect(key).toBe("8080");
  });

  it("should generate key with path only", () => {
    const keyFn = keyStrategy().withPath().build();
    const target = createMockScanTarget({
      id: "1",
      host: "example.com",
      port: 443,
      method: "GET",
      path: "/api/users",
    });

    const key = keyFn(target);
    expect(key).toBe("/api/users");
  });

  it("should generate key with method only", () => {
    const keyFn = keyStrategy().withMethod().build();
    const target = createMockScanTarget({
      id: "1",
      host: "example.com",
      port: 443,
      method: "post",
      path: "/",
    });

    const key = keyFn(target);
    expect(key).toBe("POST");
  });

  it("should generate key with host and port", () => {
    const keyFn = keyStrategy().withHost().withPort().build();
    const target = createMockScanTarget({
      id: "1",
      host: "EXAMPLE.COM",
      port: 8080,
      method: "GET",
      path: "/",
    });

    const key = keyFn(target);
    expect(key).toBe("example.com::8080");
  });

  it("should generate key with host, port, and path", () => {
    const keyFn = keyStrategy().withHost().withPort().withPath().build();
    const target = createMockScanTarget({
      id: "1",
      host: "Example.Com",
      port: 443,
      method: "GET",
      path: "/api/v1/users",
    });

    const key = keyFn(target);
    expect(key).toBe("example.com::443::/api/v1/users");
  });

  it("should generate key with all parts", () => {
    const keyFn = keyStrategy().withHost().withPort().withPath().withMethod().build();
    const target = createMockScanTarget({
      id: "1",
      host: "EXAMPLE.COM",
      port: 8080,
      method: "put",
      path: "/api/data",
    });

    const key = keyFn(target);
    expect(key).toBe("example.com::8080::/api/data::PUT");
  });

  it("should handle different order of method chaining", () => {
    const keyFn = keyStrategy().withMethod().withHost().withPath().withPort().build();
    const target = createMockScanTarget({
      id: "1",
      host: "test.com",
      port: 3000,
      method: "delete",
      path: "/items/123",
    });

    const key = keyFn(target);
    expect(key).toBe("DELETE::test.com::/items/123::3000");
  });

  it("should handle duplicate method calls", () => {
    const keyFn = keyStrategy().withHost().withHost().withPort().build();
    const target = createMockScanTarget({
      id: "1",
      host: "example.com",
      port: 443,
      method: "GET",
      path: "/",
    });

    const key = keyFn(target);
    expect(key).toBe("example.com::example.com::443");
  });

  it("should handle special characters in path", () => {
    const keyFn = keyStrategy().withPath().build();
    const target = createMockScanTarget({
      id: "1",
      host: "example.com",
      port: 443,
      method: "GET",
      path: "/api/users?filter=active&sort=name",
    });

    const key = keyFn(target);
    expect(key).toBe("/api/users?filter=active&sort=name");
  });

  it("should handle different HTTP methods case variations", () => {
    const methods = ["get", "GET", "Get", "post", "POST", "Post", "put", "PUT", "Put"];
    
    methods.forEach(method => {
      const keyFn = keyStrategy().withMethod().build();
      const target = createMockScanTarget({
        id: "1",
        host: "example.com",
        port: 443,
        method,
        path: "/",
      });

      const key = keyFn(target);
      expect(key).toBe(method.toUpperCase());
    });
  });

  it("should handle different host case variations", () => {
    const hosts = ["Example.COM", "EXAMPLE.com", "example.Com", "EXAMPLE.COM"];
    
    hosts.forEach(host => {
      const keyFn = keyStrategy().withHost().build();
      const target = createMockScanTarget({
        id: "1",
        host,
        port: 443,
        method: "GET",
        path: "/",
      });

      const key = keyFn(target);
      expect(key).toBe("example.com");
    });
  });

  it("should handle different port numbers", () => {
    const ports = [80, 443, 8080, 3000, 9000];
    
    ports.forEach(port => {
      const keyFn = keyStrategy().withPort().build();
      const target = createMockScanTarget({
        id: "1",
        host: "example.com",
        port,
        method: "GET",
        path: "/",
      });

      const key = keyFn(target);
      expect(key).toBe(String(port));
    });
  });

  it("should generate consistent keys for same input", () => {
    const keyFn = keyStrategy().withHost().withPort().withPath().withMethod().build();
    const target = createMockScanTarget({
      id: "1",
      host: "example.com",
      port: 443,
      method: "GET",
      path: "/api/users",
    });

    const key1 = keyFn(target);
    const key2 = keyFn(target);
    expect(key1).toBe(key2);
    expect(key1).toBe("example.com::443::/api/users::GET");
  });

  it("should generate different keys for different inputs", () => {
    const keyFn = keyStrategy().withHost().withPort().withPath().build();
    
    const target1 = createMockScanTarget({
      id: "1",
      host: "example.com",
      port: 443,
      method: "GET",
      path: "/api/users",
    });

    const target2 = createMockScanTarget({
      id: "2",
      host: "example.com",
      port: 8080,
      method: "GET",
      path: "/api/users",
    });

    const key1 = keyFn(target1);
    const key2 = keyFn(target2);
    
    expect(key1).toBe("example.com::443::/api/users");
    expect(key2).toBe("example.com::8080::/api/users");
    expect(key1).not.toBe(key2);
  });
});
