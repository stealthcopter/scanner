import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  continueWith,
  defineScan,
  done,
  type Finding,
  type ScanContext,
  type ScanMetadata,
} from "../index";

import {
  createBaseFinding,
  createBaseMetadata,
  createScanContext,
} from "./__tests__/utils";

describe("defineScan", () => {
  let baseFinding: Finding;
  let baseMetadata: ScanMetadata;
  let context: ScanContext;

  beforeEach(() => {
    baseFinding = createBaseFinding();
    baseMetadata = createBaseMetadata();
    context = createScanContext();
  });

  it("should throw error when no steps are defined", () => {
    const scan = defineScan(() => ({
      metadata: baseMetadata,
    }));

    expect(() => scan.create(context)).toThrow("No steps defined for scan");
  });

  it("should execute a single step and return findings", async () => {
    const scan = defineScan(({ step }) => {
      step("execute", () => done({ findings: [baseFinding] }));

      return {
        metadata: baseMetadata,
      };
    });

    const task = scan.create(context);

    const result = await task.tick();

    expect(result.isDone).toBe(true);
    expect(result.findings).toEqual([baseFinding]);
    expect(task.getFindings()).toEqual([baseFinding]);
  });

  it("should execute multiple steps in sequence", async () => {
    const firstStepMock = vi.fn().mockReturnValue(
      continueWith({
        state: {},
        nextStep: "second",
      }),
    );

    const secondStepMock = vi.fn().mockReturnValue(
      done({
        findings: [baseFinding],
      }),
    );

    const scan = defineScan(({ step }) => {
      step("first", firstStepMock);
      step("second", secondStepMock);

      return {
        metadata: baseMetadata,
      };
    });

    const task = scan.create(context);

    await task.tick();
    await task.tick();

    expect(firstStepMock).toHaveBeenCalledTimes(1);
    expect(secondStepMock).toHaveBeenCalledTimes(1);

    expect(task.getFindings()).toEqual([baseFinding]);
  });

  it("should pass state between steps", async () => {
    let capturedState: unknown;

    const scan = defineScan(({ step }) => {
      step("first", () => {
        return continueWith({
          state: { data: "test-data", count: 42 },
          nextStep: "second",
        });
      });

      step("second", (state) => {
        capturedState = state;
        return done({ findings: [baseFinding] });
      });

      return {
        metadata: baseMetadata,
      };
    });

    const task = scan.create(context);

    await task.tick();
    await task.tick();

    expect(capturedState).toEqual({ data: "test-data", count: 42 });
  });

  it("should initialize state with initState function", async () => {
    let capturedState: unknown;

    const scan = defineScan(({ step }) => {
      step("execute", (state) => {
        capturedState = state;
        return done({ findings: [baseFinding] });
      });

      return {
        metadata: baseMetadata,
        initState: () => ({ initialized: true, value: 100 }),
      };
    });

    const task = scan.create(context);

    await task.tick();

    expect(capturedState).toEqual({ initialized: true, value: 100 });
  });

  it("should accumulate findings across steps", async () => {
    const finding1 = { ...baseFinding, name: "finding-1" };
    const finding2 = { ...baseFinding, name: "finding-2" };

    const scan = defineScan(({ step }) => {
      step("first", () => {
        return continueWith({
          state: {},
          nextStep: "second",
          findings: [finding1],
        });
      });

      step("second", () => {
        return done({ findings: [finding2] });
      });

      return {
        metadata: baseMetadata,
      };
    });

    const task = scan.create(context);

    await task.tick();
    await task.tick();

    const allFindings = task.getFindings();
    expect(allFindings).toHaveLength(2);
    expect(allFindings).toContain(finding1);
    expect(allFindings).toContain(finding2);
  });

  it("should throw error for unknown step", async () => {
    const scan = defineScan(({ step }) => {
      step("execute", () => {
        return continueWith({
          state: {},
          nextStep: "unknown-step",
        });
      });

      return {
        metadata: baseMetadata,
      };
    });

    const task = scan.create(context);

    await task.tick();
    await expect(task.tick()).rejects.toThrow("Step unknown-step not found");
  });

  it("should call the output function with the final state", async () => {
    const mockOutput = vi.fn().mockReturnValue({ hello: "world" });
    const finalState = { result: "success", data: [1, 2, 3] };

    const scan = defineScan(({ step }) => {
      step("execute", () => {
        return done({
          state: finalState,
          findings: [baseFinding],
        });
      });

      return {
        metadata: baseMetadata,
        output: mockOutput,
      };
    });

    const task = scan.create(context);
    await task.tick();

    const outputResult = task.getOutput();

    expect(mockOutput).toHaveBeenCalledTimes(1);
    expect(mockOutput).toHaveBeenCalledWith(finalState);

    expect(outputResult).toEqual({ hello: "world" });
  });
});
