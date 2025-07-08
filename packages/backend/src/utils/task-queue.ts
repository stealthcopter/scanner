type TaskFn<T = unknown> = () => Promise<T>;

type CancellableTask = {
  task: () => void;
  cancel: (reason: string) => void;
};

export class TaskQueue {
  private queue: CancellableTask[] = [];
  private activeTasks = 0;
  private concurrency: number;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  public setConcurrency(concurrency: number): void {
    this.concurrency = concurrency;
    this.processNext();
  }

  public add<T>(taskFn: TaskFn<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task: async () => {
          try {
            const result = await taskFn();
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            this.activeTasks--;
            this.processNext();
          }
        },
        cancel: (reason: string) => {
          reject(new Error(reason));
        },
      });

      this.processNext();
    });
  }

  private processNext(): void {
    if (this.activeTasks >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.activeTasks++;
    const cancellableTask = this.queue.shift();
    if (cancellableTask) {
      cancellableTask.task();
    }
  }

  public clear(): void {
    this.queue.forEach((t) => t.cancel("Queue cleared"));
    this.queue = [];
  }
}
