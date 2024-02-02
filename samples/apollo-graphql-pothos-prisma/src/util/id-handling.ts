import { z } from "zod";

export function encodeID(value: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}
export function decodeAndCheckID<Z extends z.AnyZodObject>(
  input: string,
  validator: Z,
): z.infer<Z> {
  try {
    const stringValue = !input.startsWith("{")
      ? Buffer.from(input, "base64").toString()
      : input;
    return validator.parse(JSON.parse(stringValue));
  } catch (e) {
    throw new Error(`Invalid ID or ID Type: ${input}`);
  }
}
