import { type Finding, type InterruptReason, type ScanRunnable } from "engine";
import {
  type CheckExecution,
  type SentRequest,
  type SessionState,
} from "shared";

export type ScanMessage =
  | { type: "Start"; checksTotal: number }
  | {
      type: "AddFinding";
      finding: Finding;
      relatedTargetID: string;
      relatedCheckID: string;
    }
  | {
      type: "AddRequestSent";
      request: SentRequest & { status: "pending" };
      relatedTargetID: string;
      relatedCheckID: string;
    }
  | {
      type: "AddRequestCompleted";
      request: SentRequest & { status: "completed" };
      relatedTargetID: string;
      relatedCheckID: string;
    }
  | {
      type: "AddRequestFailed";
      request: SentRequest & { status: "failed" };
      relatedTargetID: string;
      relatedCheckID: string;
    }
  | { type: "AddCheckRunning"; checkID: string; targetRequestID: string }
  | { type: "AddCheckCompleted"; checkID: string; targetRequestID: string }
  | {
      type: "AddCheckFailed";
      checkID: string;
      targetRequestID: string;
      error: string;
    }
  | { type: "Finish" }
  | { type: "Interrupted"; reason: InterruptReason }
  | { type: "Error"; error: string };

export class ScannerStore {
  private static _store?: ScannerStore;
  private sessions: SessionState[] = [];
  private runnables: Map<string, ScanRunnable> = new Map();

  private constructor() {
    this.sessions = [];
  }

  static get(): ScannerStore {
    if (!ScannerStore._store) {
      ScannerStore._store = new ScannerStore();
    }

    return ScannerStore._store;
  }

  registerRunnable(id: string, runnable: ScanRunnable) {
    this.runnables.set(id, runnable);
  }

  async cancelRunnable(id: string): Promise<boolean> {
    const runnable = this.runnables.get(id);
    if (!runnable) return false;

    await runnable.cancel("Cancelled");
    return true;
  }

  unregisterRunnable(id: string): boolean {
    return this.runnables.delete(id);
  }

  updateSessionTitle(id: string, title: string): SessionState | undefined {
    const sessionIndex = this.sessions.findIndex(
      (session) => session.id === id,
    );
    if (sessionIndex === -1) return undefined;

    const session = this.sessions[sessionIndex];
    const updatedSession = { ...session, title } as SessionState;
    this.sessions[sessionIndex] = updatedSession;
    return updatedSession;
  }

  createSession(title: string): SessionState {
    const id = "ascan-" + Math.random().toString(36).substring(2, 15);
    const session: SessionState = {
      kind: "Pending",
      id,
      createdAt: Date.now(),
      title,
    };
    this.sessions.push(session);
    return session;
  }

  getSession(id: string): SessionState | undefined {
    return this.sessions.find((session) => session.id === id);
  }

  deleteSession(id: string): boolean {
    const runnable = this.runnables.get(id);
    if (runnable) {
      runnable.cancel("Cancelled");
      this.runnables.delete(id);
    }

    const index = this.sessions.findIndex((session) => session.id === id);
    if (index === -1) return false;
    this.sessions.splice(index, 1);
    return true;
  }

  send(id: string, message: ScanMessage): SessionState | undefined {
    const session = this.sessions.find((session) => session.id === id);
    if (!session) return undefined;

    const newState = this.processMessage(session, message);
    this.sessions = this.sessions.map((s) => (s.id === id ? newState : s));
    return newState;
  }

  private processMessage(
    session: SessionState,
    message: ScanMessage,
  ): SessionState {
    switch (message.type) {
      case "Start":
        return this.handleStart(session, message);
      case "AddFinding":
        return this.handleAddFinding(session, message);
      case "AddRequestSent":
        return this.handleAddRequestSent(session, message);
      case "AddRequestCompleted":
        return this.handleAddRequestCompleted(session, message);
      case "AddRequestFailed":
        return this.handleAddRequestFailed(session, message);
      case "AddCheckRunning":
        return this.handleAddCheckRunning(session, message);
      case "AddCheckCompleted":
        return this.handleAddCheckCompleted(session, message);
      case "AddCheckFailed":
        return this.handleAddCheckFailed(session, message);
      case "Finish":
        return this.handleFinish(session, message);
      case "Interrupted":
        return this.handleInterrupted(session, message);
      case "Error":
        return this.handleError(session, message);
      default:
        throw new Error(`Unknown message type`);
    }
  }

  private handleStart(
    session: SessionState,
    message: ScanMessage & { type: "Start" },
  ): SessionState {
    if (session.kind !== "Pending") {
      throw new Error(`Cannot start session in state: ${session.kind}`);
    }

    return {
      kind: "Running",
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      startedAt: Date.now(),
      progress: {
        checksTotal: message.checksTotal,
        checksHistory: [],
      },
    };
  }

  private handleAddFinding(
    session: SessionState,
    message: ScanMessage & { type: "AddFinding" },
  ): SessionState {
    if (session.kind !== "Running") {
      throw new Error(`Cannot add finding in state: ${session.kind}`);
    }

    return {
      ...session,
      progress: {
        ...session.progress,
        checksHistory: this.updateCheckExecution(
          session.progress.checksHistory,
          message.relatedCheckID,
          message.relatedTargetID,
          (execution) => {
            if (execution.kind !== "Running") return execution;

            return {
              ...execution,
              findings: [...execution.findings, message.finding],
            };
          },
        ),
      },
    };
  }

  private handleAddRequestSent(
    session: SessionState,
    message: ScanMessage & { type: "AddRequestSent" },
  ): SessionState {
    if (session.kind !== "Running") {
      throw new Error(`Cannot add request sent in state: ${session.kind}`);
    }

    return {
      ...session,
      progress: {
        ...session.progress,
        checksHistory: this.updateCheckExecution(
          session.progress.checksHistory,
          message.relatedCheckID,
          message.relatedTargetID,
          (execution) => {
            if (execution.kind !== "Running") return execution;

            const newRequest: SentRequest = {
              status: "pending",
              pendingRequestID: message.request.pendingRequestID,
              sentAt: Date.now(),
            };

            return {
              ...execution,
              requestsSent: [...execution.requestsSent, newRequest],
            };
          },
        ),
      },
    };
  }

  private handleAddRequestCompleted(
    session: SessionState,
    message: ScanMessage & { type: "AddRequestCompleted" },
  ): SessionState {
    if (session.kind !== "Running") {
      throw new Error(`Cannot add request completed in state: ${session.kind}`);
    }

    return {
      ...session,
      progress: {
        ...session.progress,
        checksHistory: session.progress.checksHistory.map((execution) => {
          if (execution.kind !== "Running") return execution;

          const hasRequest = execution.requestsSent.some(
            (request) =>
              request.pendingRequestID === message.request.pendingRequestID,
          );

          if (!hasRequest) return execution;

          return {
            ...execution,
            requestsSent: execution.requestsSent.map((request) =>
              request.pendingRequestID === message.request.pendingRequestID
                ? {
                    status: "completed" as const,
                    pendingRequestID: message.request.pendingRequestID,
                    requestID: message.request.requestID,
                    sentAt: request.sentAt,
                    completedAt: Date.now(),
                  }
                : request,
            ),
          };
        }),
      },
    };
  }

  private handleAddRequestFailed(
    session: SessionState,
    message: ScanMessage & { type: "AddRequestFailed" },
  ): SessionState {
    if (session.kind !== "Running") {
      throw new Error(`Cannot add request failed in state: ${session.kind}`);
    }

    return {
      ...session,
      progress: {
        ...session.progress,
        checksHistory: session.progress.checksHistory.map((execution) => {
          if (execution.kind !== "Running") return execution;

          const hasRequest = execution.requestsSent.some(
            (request) =>
              request.pendingRequestID === message.request.pendingRequestID,
          );

          if (!hasRequest) return execution;

          return {
            ...execution,
            requestsSent: execution.requestsSent.map((request) =>
              request.pendingRequestID === message.request.pendingRequestID
                ? {
                    status: "failed" as const,
                    pendingRequestID: message.request.pendingRequestID,
                    error: message.request.error,
                    sentAt: request.sentAt,
                    completedAt: Date.now(),
                  }
                : request,
            ),
          };
        }),
      },
    };
  }

  private handleAddCheckRunning(
    session: SessionState,
    message: ScanMessage & { type: "AddCheckRunning" },
  ): SessionState {
    if (session.kind !== "Running") {
      throw new Error(`Cannot add check running in state: ${session.kind}`);
    }

    const newExecution: CheckExecution = {
      kind: "Running",
      checkID: message.checkID,
      targetRequestID: message.targetRequestID,
      startedAt: Date.now(),
      requestsSent: [],
      findings: [],
    };

    return {
      ...session,
      progress: {
        ...session.progress,
        checksHistory: [...session.progress.checksHistory, newExecution],
      },
    };
  }

  private handleAddCheckCompleted(
    session: SessionState,
    message: ScanMessage & { type: "AddCheckCompleted" },
  ): SessionState {
    if (session.kind !== "Running") {
      throw new Error(`Cannot add check completed in state: ${session.kind}`);
    }

    return {
      ...session,
      progress: {
        ...session.progress,
        checksHistory: this.updateCheckExecution(
          session.progress.checksHistory,
          message.checkID,
          message.targetRequestID,
          (execution) => {
            if (execution.kind !== "Running") return execution;

            return {
              kind: "Completed",
              checkID: execution.checkID,
              targetRequestID: execution.targetRequestID,
              startedAt: execution.startedAt,
              completedAt: Date.now(),
              requestsSent: execution.requestsSent,
              findings: execution.findings,
            };
          },
        ),
      },
    };
  }

  private handleAddCheckFailed(
    session: SessionState,
    message: ScanMessage & { type: "AddCheckFailed" },
  ): SessionState {
    if (session.kind !== "Running") {
      throw new Error(`Cannot add check failed in state: ${session.kind}`);
    }

    return {
      ...session,
      progress: {
        ...session.progress,
        checksHistory: this.updateCheckExecution(
          session.progress.checksHistory,
          message.checkID,
          message.targetRequestID,
          (execution) => {
            if (execution.kind !== "Running") return execution;

            return {
              kind: "Failed",
              checkID: execution.checkID,
              targetRequestID: execution.targetRequestID,
              startedAt: execution.startedAt,
              failedAt: Date.now(),
              error: message.error,
              requestsSent: execution.requestsSent,
              findings: execution.findings,
            };
          },
        ),
      },
    };
  }

  private handleFinish(
    session: SessionState,
    message: ScanMessage & { type: "Finish" },
  ): SessionState {
    if (session.kind !== "Running") {
      throw new Error(`Cannot finish session in state: ${session.kind}`);
    }

    return {
      kind: "Done",
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      startedAt: session.startedAt,
      finishedAt: Date.now(),
      progress: session.progress,
    };
  }

  private handleInterrupted(
    session: SessionState,
    message: ScanMessage & { type: "Interrupted" },
  ): SessionState {
    if (session.kind !== "Running") {
      throw new Error(`Cannot interrupt session in state: ${session.kind}`);
    }

    return {
      kind: "Interrupted",
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      startedAt: session.startedAt,
      progress: session.progress,
      reason: message.reason,
    };
  }

  private handleError(
    session: SessionState,
    message: ScanMessage & { type: "Error" },
  ): SessionState {
    if (
      session.kind === "Done" ||
      session.kind === "Error" ||
      session.kind === "Interrupted"
    ) {
      throw new Error(`Cannot error session in state: ${session.kind}`);
    }

    return {
      kind: "Error",
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
      error: message.error,
    };
  }

  private updateCheckExecution(
    checksHistory: CheckExecution[],
    checkID: string,
    targetRequestID: string,
    updater: (execution: CheckExecution) => CheckExecution,
  ): CheckExecution[] {
    return checksHistory.map((execution) =>
      execution.checkID === checkID &&
      execution.targetRequestID === targetRequestID
        ? updater(execution)
        : execution,
    );
  }

  listSessions(): SessionState[] {
    return [...this.sessions];
  }
}
