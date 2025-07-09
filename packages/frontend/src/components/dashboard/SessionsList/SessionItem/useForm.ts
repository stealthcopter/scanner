import { SessionState } from "shared";
import { computed, toRefs } from "vue";
import { Severity } from "engine";
import { useTimestamp } from "@vueuse/core";

export const useForm = (props: { session: SessionState }) => {
  const { session } = toRefs(props);
  const now = useTimestamp({ interval: 1000 });

  const getStatusColor = (kind: string) => {
    switch (kind) {
      case "Running":
        return "bg-blue-500";
      case "Done":
        return "bg-green-500";
      case "Error":
        return "bg-red-500";
      default:
        return "bg-surface-400";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case Severity.CRITICAL:
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case Severity.HIGH:
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case Severity.MEDIUM:
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case Severity.LOW:
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case Severity.INFO:
        return "bg-surface-500/20 text-surface-400 border-surface-500/30";
      default:
        return "bg-surface-500/20 text-surface-400 border-surface-500/30";
    }
  };

  const progress = computed(() => {
    if (session.value.kind === "Running" || session.value.kind === "Done") {
      const { checksCompleted, checksCount } = session.value.progress;
      if (checksCount === 0) return 0;
      return Math.round((checksCompleted / checksCount) * 100);
    }
    return 0;
  });

  const requestsSent = computed(() => {
    if (session.value.kind === "Running" || session.value.kind === "Done") {
      return session.value.progress.requestsSent;
    }
    return 0;
  });

  const checksCompleted = computed(() => {
    if (session.value.kind === "Running" || session.value.kind === "Done") {
      return session.value.progress.checksCompleted;
    }
    return 0;
  });

  const findingsBySeverity = computed(() => {
    if (
      session.value.kind === "Running" ||
      session.value.kind === "Done" ||
      session.value.kind === "Interrupted"
    ) {
      const findings = session.value.findings;
      const counts = {
        [Severity.CRITICAL]: 0,
        [Severity.HIGH]: 0,
        [Severity.MEDIUM]: 0,
        [Severity.LOW]: 0,
        [Severity.INFO]: 0,
      };

      findings.forEach((finding) => {
        counts[finding.severity]++;
      });

      return counts;
    }
    return {
      [Severity.CRITICAL]: 0,
      [Severity.HIGH]: 0,
      [Severity.MEDIUM]: 0,
      [Severity.LOW]: 0,
      [Severity.INFO]: 0,
    };
  });

  const hasFindings = computed(() => {
    return (
      session.value.kind === "Running" ||
      session.value.kind === "Done" ||
      session.value.kind === "Interrupted"
    );
  });

  const severityOrder = [
    Severity.CRITICAL,
    Severity.HIGH,
    Severity.MEDIUM,
    Severity.LOW,
    Severity.INFO,
  ];

  const getPreciseTimeAgo = (date: Date) => {
    const diff = Math.floor((now.value - date.getTime()) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    return `${Math.floor(diff / 3600)} hours ago`;
  };

  const timeSinceCreated = computed(() =>
    getPreciseTimeAgo(new Date(session.value.createdAt))
  );

  const timeSinceFinished = computed(() => {
    if (session.value.kind === "Done") {
      return getPreciseTimeAgo(new Date(session.value.finishedAt));
    }

    return "Invalid State";
  });

  const onCancel = () => {};
  const onDelete = () => {};
  const onExport = () => {};

  return {
    timeSinceCreated,
    timeSinceFinished,
    progress,
    hasFindings,
    requestsSent,
    severityOrder,
    onCancel,
    onDelete,
    onExport,
    checksCompleted,
    getStatusColor,
    findingsBySeverity,
    getSeverityBadgeColor,
  };
};
