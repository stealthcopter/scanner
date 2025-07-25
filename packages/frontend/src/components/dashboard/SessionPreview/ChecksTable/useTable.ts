import { type Session } from "shared";
import { computed, toRefs } from "vue";

export const useTable = (props: { session: Session }) => {
  const { session } = toRefs(props);

  const checksHistory = computed(() => {
    if (
      session.value.kind !== "Running" &&
      session.value.kind !== "Done" &&
      session.value.kind !== "Interrupted"
    ) {
      return [];
    }

    return session.value.progress.checksHistory.map((check) => {
      return {
        name: check.checkID,
        status: check.kind,
        targetID: check.targetRequestID,
        requestsSent: check.requestsSent.length,
        findings: check.findings,
      };
    });
  });

  return {
    checksHistory,
  };
};
