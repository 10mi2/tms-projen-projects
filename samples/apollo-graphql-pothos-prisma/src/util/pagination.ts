import { ArgBuilder, EnumRef, ObjectRef } from "@pothos/core";
import { Cursor, CursorContext, CursorSort } from "./pagination-cursor.js";
import { TypesWithDefaults, builder } from "../builder.js";

export class Edge<T extends Record<string, unknown> & { id: number }> {
  private _cursor?: Cursor;
  constructor(
    public readonly typeName: string,
    public readonly node: T,
    private readonly sort: CursorSort,
    private readonly context?: CursorContext,
  ) {}

  get cursor(): string {
    this._cursor ??= Cursor.fromValue(
      this.typeName,
      this.sort.map((s) => ({
        ...s,
        value: this.node[s.key],
      })),
      this.context,
    );
    return this._cursor.toString();
  }
}
export class PageInfo {
  hasNextPage!: boolean;
  hasPreviousPage!: boolean;
  startCursor?: string;
  endCursor?: string;
}
builder.objectType(PageInfo, {
  name: "PageInfo",
  description: "Information about pagination in a connection",
  fields: (t) => ({
    hasNextPage: t.exposeBoolean("hasNextPage"),
    hasPreviousPage: t.exposeBoolean("hasPreviousPage"),
    startCursor: t.field({
      type: "Cursor",
      nullable: true,
      resolve: (parent) => parent.startCursor,
    }),
    endCursor: t.field({
      type: "Cursor",
      nullable: true,
      resolve: (parent) => parent.endCursor,
    }),
  }),
});
export class Connection<T extends Record<string, unknown> & { id: number }> {
  edges: Edge<T>[];

  constructor(
    readonly typeName: string,
    readonly edgeValues: T[],
    readonly sort: CursorSort,
    readonly context?: CursorContext,
  ) {
    this.edges = edgeValues.map((e) => new Edge<T>(typeName, e, sort, context));
  }

  // TODO: implement hasNextPage and hasPreviousPage
  get pageInfo(): PageInfo {
    return {
      hasNextPage: false, // TODO
      hasPreviousPage: false, // TODO
      startCursor: this.edges[0]?.cursor,
      endCursor: this.edges[this.edges.length - 1]?.cursor,
    };
  }
}
export const makePagination = <T extends { id: number }>(
  obj: ObjectRef<unknown, T>,
) => {
  const name = obj.name;
  const edge = builder.objectType(Edge<T>, {
    name: `${name}Edge`,
    description: `Edge containing a ${name} object and it's cursor`,
    fields: (t) => ({
      node: t.field({
        type: obj,
        resolve: async (parent, _args, _ctx, _info) => parent.node,
      }),
      cursor: t.exposeString("cursor"),
    }),
  });

  const connection = builder.objectType(Connection<T>, {
    name: `${name}Connection`,
    description: `Connection for ${name} objects`,
    fields: (t) => ({
      edges: t.field({
        type: [edge],
        resolve: (parent) => parent.edges,
      }),
      pageInfo: t.field({
        type: PageInfo,
        resolve: (parent) => parent.pageInfo,
      }),
    }),
  });

  return { edge, connection };
};

export function commonPaginationArgs<T, P extends T>(
  arg: ArgBuilder<TypesWithDefaults>,
  orderByInputType: EnumRef<T, P>,
  defaultValue: P,
) {
  return {
    first: arg.int({ required: false }),
    after: arg({ type: "Cursor", required: false }),
    last: arg.int({ required: false }),
    before: arg({ type: "Cursor", required: false }),
    orderBy: arg({
      type: orderByInputType,
      required: true,
      defaultValue,
    }),
    orderDesc: arg.boolean({ required: true, defaultValue: false }),
  };
}
