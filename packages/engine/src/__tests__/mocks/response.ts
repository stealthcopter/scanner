import { type Body, type Response, type ResponseRaw } from "caido:utils";

import { MockBody } from "./request";
import { type MockResponseData } from "./types";

export class MockResponseRaw implements ResponseRaw {
  private data: string;

  constructor(data: string) {
    this.data = data;
  }

  toText(): string {
    return this.data;
  }

  toBytes(): Uint8Array {
    return new TextEncoder().encode(this.data);
  }
}

export class MockResponse implements Response {
  private mockData: Required<MockResponseData>;

  constructor(data: MockResponseData) {
    this.mockData = {
      id: data.id,
      code: data.code,
      headers: data.headers ?? {},
      body: data.body ?? "",
      roundtripTime: data.roundtripTime ?? 100,
      createdAt: data.createdAt ?? new Date(),
    };
  }

  getId(): string {
    return this.mockData.id;
  }

  getCode(): number {
    return this.mockData.code;
  }

  getHeaders(): Record<string, Array<string>> {
    return this.mockData.headers;
  }

  getHeader(name: string): Array<string> | undefined {
    const lowerName = name.toLowerCase();
    const headers = this.mockData.headers;

    for (const [key, value] of Object.entries(headers)) {
      if (key.toLowerCase() === lowerName) {
        return value;
      }
    }
    return undefined;
  }

  getBody(): Body | undefined {
    return this.mockData.body ? new MockBody(this.mockData.body) : undefined;
  }

  getRaw(): ResponseRaw {
    const statusLine = `HTTP/1.1 ${this.mockData.code} OK\r\n`;
    const headers = Object.entries(this.mockData.headers)
      .map(([key, values]) =>
        values.map((value) => `${key}: ${value}`).join("\r\n"),
      )
      .join("\r\n");
    const raw = `${statusLine}${headers}\r\n\r\n${this.mockData.body}`;
    return new MockResponseRaw(raw);
  }

  getRoundtripTime(): number {
    return this.mockData.roundtripTime;
  }

  getCreatedAt(): Date {
    return this.mockData.createdAt;
  }
}

export const createMockResponse = (data: MockResponseData): Response => {
  return new MockResponse(data);
};
