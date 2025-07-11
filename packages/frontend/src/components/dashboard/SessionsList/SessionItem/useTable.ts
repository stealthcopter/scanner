import { useTimestamp } from "@vueuse/core";
import { type CheckExecution, type SessionState } from "shared";
import { computed, toRefs } from "vue";

export const useTable = (props: { session: SessionState }) => {
  const { session } = toRefs(props);
  const now = useTimestamp({ interval: 50 });

  const checksHistory = computed(() => {
    if (session.value.kind === "Running" || session.value.kind === "Done" || session.value.kind === "Interrupted") {
      return session.value.progress.checksHistory.map((check) => ({
        name: check.checkID,
        status: check.kind,
        duration: getDuration(check),
        targetID: check.targetRequestID,
        requestsSent: check.requestsSent.length,
        findings: check.findings.length,
      }));
    }
    return [];
  });

  const getDuration = (check: CheckExecution) => {
    if (check.kind === "Running") {
      const duration = now.value - check.startedAt;
      return formatDuration(duration);
    } else if (check.kind === "Completed") {
      const duration = check.completedAt - check.startedAt;
      return formatDuration(duration);
    } else if (check.kind === "Failed") {
      const duration = check.failedAt - check.startedAt;
      return formatDuration(duration);
    }
    return "0ms";
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  return {
    checksHistory,
  };
};
