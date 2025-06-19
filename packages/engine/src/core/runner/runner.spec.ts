import { type SDK } from "caido:plugin";
import {
  createBaseFinding,
  createBaseMetadata,
  createMockSDK,
} from "packages/engine/src/core/__tests__/utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  defineScan,
  done,
  type Finding,
  type ScanMetadata,
  ScanRunner,
  ScanStrength,
  type ScanTarget,
} from "../../index";

describe("ScanRunner", () => {
  let baseFinding: Finding;
  let baseMetadata: ScanMetadata;
  let sdk: SDK;

  beforeEach(() => {
    baseFinding = createBaseFinding();
    baseMetadata = createBaseMetadata();
    sdk = createMockSDK();
  });

  const createTarget = ({ host = "example.com", path = "/test" } = {}) =>
    ({
      request: {
        getHost: () => host,
        getPath: () => path,
      },
      response: {
        getId: () => "123",
      },
    } as unknown as ScanTarget);

  it("should deduplicate scans based on dedupeKey", async () => {
    const mockStep = vi.fn().mockReturnValue(done({ findings: [baseFinding] }));

    const scan = defineScan(({ step }) => {
      step("execute", mockStep);

      return {
        metadata: { ...baseMetadata, id: "duplicate-scan" },
        dedupeKey: (target: ScanTarget) =>
          `${target.request.getHost()}:${target.request.getPath()}`,
      };
    });

    const runner = new ScanRunner();
    runner.register(scan);

    const targets = [
      createTarget(),
      createTarget(),
      createTarget({ path: "/different" }),
      createTarget(),
    ];

    const findings = await runner.run(sdk, targets, {
      strength: ScanStrength.HIGH,
    });

    expect(findings).toHaveLength(2);

    expect(mockStep).toHaveBeenCalledTimes(2);
  });

  it("should not run the scan if the when condition is not met", async () => {
    const mockWhen = vi.fn(() => false);
    const mockStep = vi.fn();

    const scan = defineScan(({ step }) => {
      step("execute", mockStep);

      return {
        metadata: { ...baseMetadata, id: "test-scan" },
        when: mockWhen,
      };
    });

    const runner = new ScanRunner();
    runner.register(scan);

    const findings = await runner.run(sdk, [createTarget()], {
      strength: ScanStrength.HIGH,
    });

    expect(findings).toHaveLength(0);

    expect(mockWhen).toHaveBeenCalledTimes(1);
    expect(mockStep).not.toHaveBeenCalled();
  });

  it("should pass the dependencies to the scan", async () => {
    const mockFirstStep = vi.fn().mockReturnValue(
      done({
        findings: [{ ...baseFinding, name: "first-finding" }],
        state: { path: "test" },
      })
    );

    const firstScan = defineScan<{ path: string }>(({ step }) => {
      step("execute", mockFirstStep);

      return {
        metadata: { ...baseMetadata, id: "first-scan" },
        output: (state) => ({
          path: state.path,
        }),
      };
    });

    const secondScan = defineScan(({ step }) => {
      step("execute", (_, context) => {
        const dependencies = context.runtime.dependencies.get("first-scan") as {
          path: string;
        };

        return done({
          findings: [{ ...baseFinding, name: dependencies?.path }],
        });
      });

      return {
        metadata: {
          ...baseMetadata,
          id: "second-scan",
          dependsOn: ["first-scan"],
        },
      };
    });

    const runner = new ScanRunner();
    runner.register(firstScan);
    runner.register(secondScan);

    const findings = await runner.run(sdk, [createTarget()], {
      strength: ScanStrength.HIGH,
    });

    expect(findings).toEqual([
      { ...baseFinding, name: "first-finding" },
      { ...baseFinding, name: "test" },
    ]);
  });
});
