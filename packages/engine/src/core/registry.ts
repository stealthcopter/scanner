import { type SDK } from "caido:plugin";

import { type CheckDefinition } from "../types/check";
import {
  type ScanConfig,
  type ScanRegistry,
  type ScanRunnable,
} from "../types/runner";

import { ScanRegistryError, ScanRegistryErrorCode } from "./errors";
import { createRunnable } from "./runnable";

export const createRegistry = (): ScanRegistry => {
  const checks: CheckDefinition[] = [];

  const register = (check: CheckDefinition) => {
    checks.push(check);
  };

  const validate = () => {
    if (checks.length === 0) {
      throw new ScanRegistryError(
        "No checks registered",
        ScanRegistryErrorCode.NO_CHECKS_REGISTERED,
      );
    }

    for (const check of checks) {
      if (check.metadata.dependsOn) {
        for (const dependency of check.metadata.dependsOn) {
          if (!checks.some((c) => c.metadata.id === dependency)) {
            throw new ScanRegistryError(
              `Check ${check.metadata.id} depends on ${dependency} but it is not registered`,
              ScanRegistryErrorCode.CHECK_DEPENDENCY_NOT_FOUND,
            );
          }
        }
      }
    }
  };

  const create = (sdk: SDK, config: ScanConfig): ScanRunnable => {
    validate();

    return createRunnable({
      sdk,
      checks,
      context: (target) => ({
        target,
        sdk,
        config,
      }),
    });
  };

  return {
    register,
    create,
  };
};
