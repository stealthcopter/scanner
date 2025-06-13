export class DependencyStore {
  private readonly data = new Map<string, unknown>();

  public set(id: string, value: unknown): void {
    this.data.set(id, value);
  }

  public get<T = unknown>(id: string): T {
    if (!this.data.has(id)) {
      throw new Error(`Dependency '${id}' not resolved yet`);
    }
    return this.data.get(id) as T;
  }
}
