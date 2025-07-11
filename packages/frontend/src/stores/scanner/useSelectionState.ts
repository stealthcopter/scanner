import { reactive } from "vue";

import { type SessionsSelectionState } from "@/types/scanner";

type Context = {
  state: SessionsSelectionState;
};

type Message = { type: "Reset" } | { type: "Select"; sessionId: string };

export const useSelectionState = () => {
  const context: Context = reactive({
    state: { type: "None" },
  });

  const getState = () => context.state;

  const send = (message: Message) => {
    switch (message.type) {
      case "Reset":
        context.state = { type: "None" };
        break;
      case "Select":
        context.state = { type: "Selected", sessionId: message.sessionId };
        break;
    }
  };

  return {
    selectionState: {
      getState,
      send,
    },
  };
};
