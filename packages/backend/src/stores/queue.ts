import { type ScanRunnable } from "engine";
import { type QueueTask } from "shared";

import { type TaskQueue } from "../utils/task-queue";

export class QueueStore {
  private static _store?: QueueStore;

  private tasks: QueueTask[] = [];
  private cancelFunctions: Map<string, () => void> = new Map();
  private passiveTaskQueue?: TaskQueue;

  private constructor() {
    this.tasks = [];
  }

  static get(): QueueStore {
    if (!QueueStore._store) {
      QueueStore._store = new QueueStore();
    }

    return QueueStore._store;
  }

  setPassiveTaskQueue(queue: TaskQueue): void {
    this.passiveTaskQueue = queue;
  }

  addTask(id: string, requestID: string): QueueTask {
    const task: QueueTask = {
      id,
      requestID,
      status: "pending",
    };

    this.tasks.push(task);
    return task;
  }

  addActiveRunnable(id: string, runnable: ScanRunnable): void {
    this.cancelFunctions.set(id, () => runnable.cancel("Cancelled"));
  }

  removeActiveRunnable(id: string): void {
    this.cancelFunctions.delete(id);
  }

  updateTaskStatus(
    id: string,
    status: QueueTask["status"],
  ): QueueTask | undefined {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.status = status;
    }
    return task;
  }

  removeTask(id: string): boolean {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.tasks.splice(index, 1);
      return true;
    }

    return false;
  }

  getTasks(): QueueTask[] {
    return [...this.tasks];
  }

  getTask(id: string): QueueTask | undefined {
    return this.tasks.find((t) => t.id === id);
  }

  clearTasks(): void {
    for (const [id, cancelFunction] of this.cancelFunctions.entries()) {
      cancelFunction();
      this.cancelFunctions.delete(id);
    }

    this.passiveTaskQueue?.clear();
    this.tasks = [];
  }
}
