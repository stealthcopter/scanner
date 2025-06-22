import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createBaseFinding,
  createMockScanDefinition,
  createMockSDK,
  createScanTarget,
} from "../../tests/factories";
import {
  type ScanConfig,
  type ScanDefinition,
  ScanStrength,
  type ScanTarget,
} from "../../types";

import { ScanOrchestrator } from "./orchestrator";
import { TargetProcessor } from "./processor";

vi.mock("./processor");

describe("ScanOrchestrator", () => {
  let sdk: ReturnType<typeof createMockSDK>;
  let config: ScanConfig;
  let scans: ScanDefinition[];

  beforeEach(() => {
    sdk = createMockSDK();
    config = { strength: ScanStrength.HIGH };
    scans = [];
    vi.clearAllMocks();
  });

  describe("constructor and dependency resolution", () => {
    it("should correctly order scans based on dependencies", () => {
      const scanA = createMockScanDefinition({ metadata: { id: "A" } });
      const scanB = createMockScanDefinition({
        metadata: { id: "B", dependsOn: ["A"] },
      });
      const scanC = createMockScanDefinition({
        metadata: { id: "C", dependsOn: ["B"] },
      });

      const orchestrator = new ScanOrchestrator(
        [scanC, scanA, scanB],
        sdk,
        config,
      );
      const batchIds = orchestrator.batches.flat().map((s) => s.metadata.id);

      expect(batchIds).toEqual(["A", "B", "C"]);
    });

    it("should throw an error for unknown dependencies", () => {
      const scanA = createMockScanDefinition({
        metadata: { id: "A", dependsOn: ["UNKNOWN"] },
      });
      expect(() => new ScanOrchestrator([scanA], sdk, config)).toThrow(
        "Scan 'A' has unknown dependency 'UNKNOWN'",
      );
    });

    it("should throw an error for circular dependencies", () => {
      const scanA = createMockScanDefinition({
        metadata: { id: "A", dependsOn: ["B"] },
      });
      const scanB = createMockScanDefinition({
        metadata: { id: "B", dependsOn: ["A"] },
      });

      expect(() => new ScanOrchestrator([scanA, scanB], sdk, config)).toThrow(
        "Circular dependency detected in scans",
      );
    });
  });

  describe("execute", () => {
    it("should process each target and aggregate findings", async () => {
      const targets: ScanTarget[] = [createScanTarget(), createScanTarget()];
      const finding1 = createBaseFinding({ name: "finding-1" });
      const finding2 = createBaseFinding({ name: "finding-2" });

      const mockProcess = vi
        .fn()
        .mockResolvedValueOnce([finding1])
        .mockResolvedValueOnce([finding2]);

      vi.mocked(TargetProcessor).mockImplementation(
        () => ({ process: mockProcess }) as unknown as TargetProcessor,
      );

      const orchestrator = new ScanOrchestrator(scans, sdk, config);
      const allFindings = await orchestrator.execute(targets);

      expect(TargetProcessor).toHaveBeenCalledTimes(2);
      expect(mockProcess).toHaveBeenCalledTimes(2);
      expect(allFindings).toHaveLength(2);
      expect(allFindings).toEqual([finding1, finding2]);
    });

    it("should return an empty array if no targets are provided", async () => {
      const orchestrator = new ScanOrchestrator(scans, sdk, config);
      const allFindings = await orchestrator.execute([]);

      expect(TargetProcessor).not.toHaveBeenCalled();
      expect(allFindings).toEqual([]);
    });
  });
});
