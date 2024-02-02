import { Prisma } from "@prisma/client";
import { ZodIssueCode, z } from "zod";
import { SchemaTypes } from "../builder.js";

const BASE64_ENCODE_CURSORS = false;

export type CursorScalar = {
  Input: string;
  Output: string;
};
const checkIsStringAndReturn = (n: unknown) => {
  if (typeof n === "string") {
    return n;
  }
  throw new Error(`Expected string, got ${typeof n}`);
};
export const CursorResolver: PothosSchemaTypes.ScalarTypeOptions<
  PothosSchemaTypes.ExtendDefaultTypes<SchemaTypes>,
  string,
  string
> = {
  serialize: checkIsStringAndReturn,
  parseValue: checkIsStringAndReturn,
};

export const makeCursorSchema = <
  ValueSchema extends
    | z.AnyZodObject
    | z.ZodDiscriminatedUnion<string, z.AnyZodObject[]>,
  ContextSchema extends z.AnyZodObject,
>(
  name: string,
  valueSchema: ValueSchema,
  contextSchema?: ContextSchema,
) =>
  z.object({
    name: z.literal(name, { invalid_type_error: `Invalid cursor type` }),
    value: z.array(valueSchema),
    ...(contextSchema ? { context: z.array(contextSchema) } : {}),
  });

export type CursorSort = Array<{
  sort?: "a" | "d";
  key: string;
}>;
export type CursorContext = Array<{
  key: string;
  value: unknown;
}>;
export type CursorValue = Array<{
  sort?: "a" | "d";
  key: string;
  value: unknown;
}>;
export class Cursor {
  static fromString<Z extends z.AnyZodObject>(str: string, validator: Z) {
    try {
      // accept json-encoded cursors for debugging
      const stringValue =
        BASE64_ENCODE_CURSORS && !str.startsWith("{")
          ? Buffer.from(str, "base64").toString()
          : str;
      const { name, value, context } = validator.parse(JSON.parse(stringValue));
      return new Cursor({ name, value, context });
    } catch (e) {
      if (e instanceof z.ZodError) {
        const found = e.issues.find(
          (i) =>
            i.code === "invalid_literal" &&
            i.path[0] === "name" &&
            i.path.length === 1,
        );
        // console.log(e.issues);
        if (found && found.code === ZodIssueCode.invalid_literal) {
          throw new Error(
            `Invalid cursor type: got '${found.received}' where  it should have been '${found.expected}'`,
          );
        }
      }

      throw new Error(`Invalid cursor: ${e}`);
    }
  }

  static fromValue(name: string, value: CursorValue, context?: CursorContext) {
    return new Cursor({ name, value, context });
  }

  readonly name: string;
  readonly context?: CursorContext;
  readonly value: CursorValue;

  private constructor({
    name,
    value,
    context,
  }: {
    name: string;
    value: CursorValue;
    context?: CursorContext;
  }) {
    this.name = name;
    this.value = value;
    this.context = context;
  }
  toString(): string {
    const stringValue = JSON.stringify({
      name: this.name,
      value: this.value,
      context: this.context,
    });
    return BASE64_ENCODE_CURSORS
      ? Buffer.from(stringValue).toString("base64")
      : stringValue;
  }
}
export const getCursorProperties = <Z extends z.AnyZodObject>(
  {
    first = null,
    after = null,
    last = null,
    before = null,
    orderBy = "id",
  }: {
    first?: number | null;
    last?: number | null;
    before?: string | null;
    after?: string | null;
    orderDesc?: boolean;
    orderBy?: string;
  },
  sortConfig: Record<string, CursorSort> = {
    id: [{ sort: "a", key: "id" }],
  },
  validator: Z,
  cursorContext: Record<string, unknown> = {},
) => {
  const sort: CursorSort | undefined = sortConfig[orderBy];
  if (!sort) {
    throw new Error(`Invalid orderBy: ${orderBy}`);
  }

  if (first !== null && last !== null) {
    throw new Error(`Cannot use both first (${first}) and last (${last})`);
  }

  if (after !== null && before !== null) {
    throw new Error("Cannot use both before and after");
  }

  const take = first ?? last ?? 50;

  const afterOrBefore = after ?? before ?? undefined;
  const cursor = afterOrBefore
    ? Cursor.fromString(afterOrBefore, validator)
    : undefined;
  const cursorIsBefore =
    last !== null || (typeof before === "string" && before !== "");

  let cursorWhere: Record<string, unknown> = {};
  let foundContext: Record<string, unknown> = {};

  if (cursor) {
    // we need to reverse the sort order for the cursor if cursorIsBefore
    [cursorWhere = {}, foundContext = {}] = makeCursorWhere(cursor);
    // console.log(JSON.stringify({ cursorWhere, foundContext }));
  }

  cursorWhere = {
    ...cursorWhere,
    ...cursorContext,
  };

  const sortBy = (cursor?.value ?? sort).map((c) => ({
    [c.key]:
      ((c.sort ?? "a") === "a") !== cursorIsBefore
        ? Prisma.SortOrder.asc
        : Prisma.SortOrder.desc,
  }));

  return {
    cursorWhere,
    orderBy: sortBy, // Prisma will use this a 'orderBy', but we don't want to call it that above since it's confusing
    take,
    sort: cursor?.value ?? sort,
    reverse: cursorIsBefore,
    foundContext,
  };

  // If there's more than one item, we need to use AND
  // So if we sore by title then id, for example, we need to do
  // where title > cursor.title OR (title = cursor.title AND id > cursor.id)
  // If we sort by name, title, then id, we need to do
  // where name > cursor.name
  //   OR (name = cursor.name AND title > cursor.title)
  //   OR (name = cursor.name AND title = cursor.title AND id > cursor.id)

  function makeCursorWhere(cursorValue: Cursor) {
    const where: {
      [name: string]: { [match: string]: unknown };
    }[] = [];
    const context: { [match: string]: unknown } = {};
    let contextItems = 0;
    if (cursorValue.context) {
      for (const item of cursorValue.context) {
        context[item.key] = item.value;
      }
    }
    for (const [index] of cursorValue.value.entries()) {
      where.push(makeCursorSubWhere(cursorValue, index - contextItems));
    }
    return [
      cursorValue.value.length === 1
        ? { ...context, ...where[0] }
        : { ...context, OR: where },
      context,
    ];
  }

  function makeCursorSubWhere(cursorValue: Cursor, index = 0) {
    let where: {
      [name: string]: { [match: string]: unknown };
    } = {};
    for (const c of cursorValue.value) {
      if (index-- === 0) {
        where[c.key as string] = {
          [(c.sort ?? "a" === "a") !== cursorIsBefore ? "gt" : "lt"]: c.value,
        };
        break;
      } else {
        where[c.key as string] = {
          equals: c.value,
        };
      }
    }
    return where;
  }
};
