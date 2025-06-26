type JSONPrimitive = string | number | boolean;

export type JSONSerializable =
  | JSONPrimitive
  | JSONSerializable[]
  | { [k: string]: JSONSerializable | undefined };
