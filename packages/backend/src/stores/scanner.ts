import { type ScanState } from "shared";

import { type ScanEvent, scanSessionFSM } from "../fsm/scanner";

export class ScannerStore {
  private static _store?: ScannerStore;
  private sessions = new Map<string, ScanState>();

  private constructor() {
    this.sessions = new Map();
  }

  static get(): ScannerStore {
    if (!ScannerStore._store) {
      ScannerStore._store = new ScannerStore();
    }

    return ScannerStore._store;
  }

  createSession(): string {
    const id = crypto.randomUUID();
    this.sessions.set(id, { kind: "Pending", createdAt: Date.now() });
    return id;
  }

  getSession(id: string): ScanState | undefined {
    return this.sessions.get(id);
  }

  send(id: string, event: ScanEvent): void {
    const session = this.sessions.get(id);
    if (!session) throw new Error(`Session ${id} not found`);

    const newState = scanSessionFSM(session, event);
    this.sessions.set(id, newState);
  }

  listSessions(): ScanState[] {
    return [...this.sessions.values()];
  }
}
