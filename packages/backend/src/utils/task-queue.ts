type TaskFn<T = unknown> = () => Promise<T>;

export class TaskQueue {
  private queue: Array<() => void> = [];
  private activeTasks = 0;
  private concurrency: number;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  public setConcurrency(concurrency: number): void {
    this.concurrency = concurrency;
    this.processNext();
  }

  public add<T>(task: TaskFn<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const queuedTask = async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.activeTasks--;
          this.processNext();
        }
      };

      this.queue.push(queuedTask);
      this.processNext();
    });
  }

  private processNext(): void {
    if (this.activeTasks >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.activeTasks++;
    const task = this.queue.shift();
    if (task) {
      task();
    }
  }
}
