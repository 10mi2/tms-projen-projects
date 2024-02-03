/* eslint-disable dot-notation */
import SchemaBuilder from "@pothos/core";
import PrismaPlugin from "@pothos/plugin-prisma";
import { Prisma, PrismaClient } from "@prisma/client";
import type PrismaTypes from "./generated/pothos.js";
import { CursorResolver, CursorScalar } from "./util/pagination-cursor.js";

export type BuilderContext = {
  prisma: PrismaClient;
};

export interface SchemaTypes {
  Context: BuilderContext;
  PrismaTypes: PrismaTypes;
  Scalars: {
    Cursor: CursorScalar;
    ID: {
      // type all ID arguments and input values as string
      Input: string;
      // Allow resolvers for ID fields to return strings
      Output: string;
    };
  };
}
export type TypesWithDefaults =
  PothosSchemaTypes.ExtendDefaultTypes<SchemaTypes>;

export const builder = new SchemaBuilder<SchemaTypes>({
  plugins: [PrismaPlugin],
  prisma: {
    client: (ctx) => ctx.prisma,
    // defaults to false, uses /// comments from prisma schema as descriptions
    // for object types, relations and exposed fields.
    // descriptions can be omitted by setting description to false
    exposeDescriptions: true,
    // use where clause from prismaRelatedConnection for totalCount (will true by default in next major version)
    filterConnectionTotalCount: true,
    // warn when not using a query parameter correctly
    onUnusedQuery: process.env["NODE_ENV"] === "production" ? null : "warn",
    // Because the prisma client is loaded dynamically, we need to explicitly provide the some information about the prisma schema
    dmmf: Prisma.dmmf,
    // use where clause from prismaRelatedConnection for totalCount (will true by default in next major version)
    // filterConnectionTotalCount: true,
  },
});

builder.scalarType("Cursor", CursorResolver);
