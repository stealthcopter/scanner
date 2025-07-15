import { type ZodType, ZodError, type ZodIssue } from "zod";
import { error, type Result } from "shared";

export function validateInput<T>(
  schema: ZodType<T>,
  input: unknown,
): Result<T> {
  try {
    const result = schema.parse(input);
    return { kind: "Success", value: result };
  } catch (err) {
    if (err instanceof ZodError) {
      const errorMessages = err.issues.map((e: ZodIssue) => {
        const path = e.path.length > 0 ? `${e.path.join(".")}: ` : "";
        return `${path}${e.message}`;
      });
      return error(`Validation failed: ${errorMessages.join(", ")}`);
    }
    return error("Invalid input");
  }
}
