import { CustomScalar, Scalar } from "@nestjs/graphql";
import { Kind, ValueNode } from "graphql";

@Scalar("Date")
export class DateScalar implements CustomScalar<number, Date> {
  description = "Date custom scalar type";

  parseValue(value: unknown): Date {
    if (typeof value !== "number") {
      throw new Error("Date cannot represent an invalid Date string");
    }
    return new Date(value); // value from the client
  }

  serialize(value: unknown): number {
    if (!(value instanceof Date)) {
      throw new Error("Date cannot represent non Date type");
    }
    return value.getTime(); // value sent to the client
  }

  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.INT) {
      return new Date(ast.value);
    }
    throw new Error("Date cannot represent non integer type");
  }
}
