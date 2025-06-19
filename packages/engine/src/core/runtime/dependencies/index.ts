import { type JSONSerializable } from "../../../types";

export class DependencyStore {
  private readonly store = new Map<string, JSONSerializable>();

  get(id: string): JSONSerializable {
    if (!this.store.has(id)) {
      throw new Error(`Dependency '${id}' not resolved`);
    }
    return this.store.get(id)!;
  }

  set(id: string, value: JSONSerializable): void {
    this.store.set(id, value);
  }
}
