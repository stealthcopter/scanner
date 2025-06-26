import { ConfigState } from "@/types/config";
import { defineStore } from "pinia";
import { UserConfig } from "shared";
import { reactive } from "vue";

type Context = {
  state: ConfigState;
};

type Message =
  | { type: "Start" }
  | { type: "Error"; error: string }
  | { type: "Success"; config: UserConfig }
  | { type: "UpdateConfig"; config: Partial<UserConfig> };

export const useConfigStore = defineStore("stores.config", () => {
  const context: Context = reactive({
    state: { type: "Idle" },
  });

  const getState = () => context.state;

  const send = (message: Message) => {
    const currState = context.state;

    switch (currState.type) {
      case "Idle":
        context.state = processIdle(currState, message);
        break;
      case "Error":
        context.state = processError(currState, message);
        break;
      case "Success":
        context.state = processSuccess(currState, message);
        break;
      case "Loading":
        context.state = processLoading(currState, message);
        break;
    }
  };

  return { getState, send };
});

const processIdle = (
  state: ConfigState & { type: "Idle" },
  message: Message
): ConfigState => {
  switch (message.type) {
    case "Start":
      return { type: "Loading" };
    case "Error":
    case "Success":
    case "UpdateConfig":
      return state;
  }
};

const processError = (
  state: ConfigState & { type: "Error" },
  message: Message
): ConfigState => {
  switch (message.type) {
    case "Start":
      return { type: "Loading" };
    case "Error":
    case "Success":
    case "UpdateConfig":
      return state;
  }
};

const processSuccess = (
  state: ConfigState & { type: "Success" },
  message: Message
): ConfigState => {
  switch (message.type) {
    case "UpdateConfig":
      return {
        ...state,
        config: {
          ...state.config,
          ...message.config,
        },
      };

    case "Start":
    case "Error":
    case "Success":
      return state;
  }
};

const processLoading = (
  state: ConfigState & { type: "Loading" },
  message: Message
): ConfigState => {
  switch (message.type) {
    case "Error":
      return { type: "Error", error: message.error };
    case "Success":
      return { type: "Success", config: message.config };
    case "Start":
    case "UpdateConfig":
      return state;
  }
};
