import { type Finding, type InterruptReason, type ScanRunnable } from "engine";
import { create } from "mutative";
import { type CheckExecution, type Session } from "shared";

export class ScannerStore {
  private static _store?: ScannerStore;
  private sessions: Map<string, Session> = new Map();
  private runnables: Map<string, ScanRunnable> = new Map();

  private constructor() {}

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

  createSession(title: string): Session {
    const id = "ascan-" + Math.random().toString(36).substring(2, 15);
    const session: Session = {
      kind: "Pending",
      id,
      createdAt: Date.now(),
      title,
    };
    this.sessions.set(id, session);
    return session;
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  deleteSession(id: string): boolean {
    const runnable = this.runnables.get(id);
    if (runnable) {
      runnable.cancel("Cancelled");
      this.runnables.delete(id);
    }

    return this.sessions.delete(id);
  }

  updateSessionTitle(id: string, title: string): Session | undefined {
    return this.updateSession(id, (draft) => {
      draft.title = title;
    });
  }

  startSession(id: string, checksTotal: number): Session | undefined {
    return this.updateSession(id, (draft) => {
      if (draft.kind !== "Pending") {
        throw new Error(`Cannot start session in state: ${draft.kind}`);
      }

      Object.assign(draft, {
        kind: "Running" as const,
        startedAt: Date.now(),
        progress: {
          checksTotal,
          checksHistory: [],
        },
      });
    });
  }

  addFinding(
    sessionId: string,
    checkId: string,
    targetId: string,
    finding: Finding,
  ): Session | undefined {
    return this.updateSession(sessionId, (draft) => {
      if (draft.kind !== "Running") {
        throw new Error(`Cannot add finding in state: ${draft.kind}`);
      }

      const execution = this.findCheckExecution(
        draft.progress.checksHistory,
        checkId,
        targetId,
      );

      if (execution?.kind === "Running") {
        execution.findings.push(finding);
      }
    });
  }

  addRequestSent(
    sessionId: string,
    checkId: string,
    targetId: string,
    pendingRequestID: string,
  ): Session | undefined {
    return this.updateSession(sessionId, (draft) => {
      if (draft.kind !== "Running") {
        throw new Error(`Cannot add request sent in state: ${draft.kind}`);
      }

      const execution = this.findCheckExecution(
        draft.progress.checksHistory,
        checkId,
        targetId,
      );

      if (execution?.kind === "Running") {
        execution.requestsSent.push({
          status: "pending",
          pendingRequestID,
          sentAt: Date.now(),
        });
      }
    });
  }

  completeRequest(
    sessionId: string,
    pendingRequestID: string,
    requestID: string,
  ): Session | undefined {
    return this.updateSession(sessionId, (draft) => {
      if (draft.kind !== "Running") {
        throw new Error(`Cannot complete request in state: ${draft.kind}`);
      }

      for (const execution of draft.progress.checksHistory) {
        if (execution.kind !== "Running") continue;

        const requestIndex = execution.requestsSent.findIndex(
          (req) => req.pendingRequestID === pendingRequestID,
        );

        if (requestIndex !== -1) {
          const request = execution.requestsSent[requestIndex];
          if (request) {
            execution.requestsSent[requestIndex] = {
              status: "completed",
              pendingRequestID,
              requestID,
              sentAt: request.sentAt,
              completedAt: Date.now(),
            };
          }
          break;
        }
      }
    });
  }

  failRequest(
    sessionId: string,
    pendingRequestID: string,
    error: string,
  ): Session | undefined {
    return this.updateSession(sessionId, (draft) => {
      if (draft.kind !== "Running") {
        throw new Error(`Cannot fail request in state: ${draft.kind}`);
      }

      for (const execution of draft.progress.checksHistory) {
        if (execution.kind !== "Running") continue;

        const requestIndex = execution.requestsSent.findIndex(
          (req) => req.pendingRequestID === pendingRequestID,
        );

        if (requestIndex !== -1) {
          const request = execution.requestsSent[requestIndex];
          if (request) {
            execution.requestsSent[requestIndex] = {
              status: "failed",
              pendingRequestID,
              error,
              sentAt: request.sentAt,
              completedAt: Date.now(),
            };
          }
          break;
        }
      }
    });
  }

  startCheck(
    sessionId: string,
    checkId: string,
    targetId: string,
  ): Session | undefined {
    return this.updateSession(sessionId, (draft) => {
      if (draft.kind !== "Running") {
        throw new Error(`Cannot start check in state: ${draft.kind}`);
      }

      const newExecution: CheckExecution = {
        kind: "Running",
        checkID: checkId,
        targetRequestID: targetId,
        startedAt: Date.now(),
        requestsSent: [],
        findings: [],
      };

      draft.progress.checksHistory.push(newExecution);
    });
  }

  completeCheck(
    sessionId: string,
    checkId: string,
    targetId: string,
  ): Session | undefined {
    return this.updateSession(sessionId, (draft) => {
      if (draft.kind !== "Running") {
        throw new Error(`Cannot complete check in state: ${draft.kind}`);
      }

      const execution = this.findCheckExecution(
        draft.progress.checksHistory,
        checkId,
        targetId,
      );

      if (execution?.kind === "Running") {
        Object.assign(execution, {
          kind: "Completed" as const,
          completedAt: Date.now(),
        });
      }
    });
  }

  failCheck(
    sessionId: string,
    checkId: string,
    targetId: string,
    error: string,
  ): Session | undefined {
    return this.updateSession(sessionId, (draft) => {
      if (draft.kind !== "Running") {
        throw new Error(`Cannot fail check in state: ${draft.kind}`);
      }

      const execution = this.findCheckExecution(
        draft.progress.checksHistory,
        checkId,
        targetId,
      );

      if (execution?.kind === "Running") {
        Object.assign(execution, {
          kind: "Failed" as const,
          failedAt: Date.now(),
          error,
        });
      }
    });
  }

  finishSession(sessionId: string): Session | undefined {
    return this.updateSession(sessionId, (draft) => {
      if (draft.kind !== "Running") {
        throw new Error(`Cannot finish session in state: ${draft.kind}`);
      }

      Object.assign(draft, {
        kind: "Done" as const,
        finishedAt: Date.now(),
      });
    });
  }

  interruptSession(
    sessionId: string,
    reason: InterruptReason,
  ): Session | undefined {
    return this.updateSession(sessionId, (draft) => {
      if (draft.kind !== "Running") {
        throw new Error(`Cannot interrupt session in state: ${draft.kind}`);
      }

      Object.assign(draft, {
        kind: "Interrupted" as const,
        reason,
      });
    });
  }

  errorSession(sessionId: string, error: string): Session | undefined {
    return this.updateSession(sessionId, (draft) => {
      if (
        draft.kind === "Done" ||
        draft.kind === "Error" ||
        draft.kind === "Interrupted"
      ) {
        throw new Error(`Cannot error session in state: ${draft.kind}`);
      }

      Object.assign(draft, {
        kind: "Error" as const,
        error,
      });
    });
  }

  listSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  private updateSession(
    id: string,
    updater: (draft: Session) => void,
  ): Session | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const newSession = create(session, updater);
    this.sessions.set(id, newSession);
    return newSession;
  }

  private findCheckExecution(
    checksHistory: CheckExecution[],
    checkId: string,
    targetId: string,
  ): CheckExecution | undefined {
    return checksHistory.find(
      (execution) =>
        execution.checkID === checkId && execution.targetRequestID === targetId,
    );
  }
}
