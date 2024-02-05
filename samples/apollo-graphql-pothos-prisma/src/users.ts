/* eslint-disable dot-notation */
import { queryFromInfo } from "@pothos/plugin-prisma";
import { z } from "zod";
import { builder } from "./builder.js";
import {
  PostConnection,
  PostOrderByInput,
  UserPostCursorSchema,
  postSortConfigs,
} from "./posts.js";
import { decodeAndCheckID, encodeID } from "./util/id-handling.js";
import {
  CursorSort,
  getCursorProperties,
  makeCursorSchema,
} from "./util/pagination-cursor.js";
import {
  Connection,
  commonPaginationArgs,
  makePagination,
} from "./util/pagination.js";

export const encodeUserID = (id: number) => encodeID({ user: id });
export const decodeUserID = (id: string) =>
  decodeAndCheckID(id, z.object({ user: z.number() }).strict()).user;

export const userWithPaginatedPosts = builder.prismaObject("User", {
  name: "UserWithPaginatedPosts",
  description: "A user with paginated posts",
  select: {
    id: true,
  },
  fields: (t) => {
    return {
      id: t.field({
        type: "ID",
        nullable: false,
        resolve: (parent) => encodeUserID(parent.id),
      }),
      name: t.exposeString("name", { nullable: true }),
      email: t.exposeString("email"),
      test: t.string({ resolve: () => "test" }),

      posts: t.field({
        type: PostConnection,
        args: {
          ...commonPaginationArgs(t.arg, PostOrderByInput, "title"),
        },
        select: (args, _context, nestedSelection) => {
          const { orderBy, cursorWhere, take } = getCursorProperties(
            args,
            postSortConfigs,
            UserPostCursorSchema,
          );

          const ret = {
            posts: nestedSelection(
              {
                select: {
                  id: true,
                },
                where: {
                  ...cursorWhere,
                },
                orderBy: orderBy,
                take,
              },
              // Look at the selections in posts.edges.edge to determine what relations/fields to select
              ["edges", "node"],
            ),
          } as const;
          return ret;
        },
        resolve: (user, args) => {
          const { sort, reverse } = getCursorProperties(
            args,
            postSortConfigs,
            UserPostCursorSchema,
            {
              authorId: user.id,
            },
          );

          return new Connection(
            "userPost",
            !reverse ? user.posts : user.posts.reverse(),
            sort,
            [{ key: "authorId", value: user.id }],
          );
        },
      }),
    };
  },
});

const UserOrderByInput = builder.enumType("UserOrderByInput", {
  description: "Options for sorting Users",
  values: {
    ID: { value: "id" },
    NAME: { value: "name" },
    EMAIL: { value: "email" },
  } as const,
});

const { connection: UserConnection } = makePagination(userWithPaginatedPosts);

export const CreateUserInput = builder.inputType("CreateUserInput", {
  description: "Input for new users",
  fields: (t) => ({
    name: t.string({ required: true }),
    email: t.string({ required: true }),
  }),
});

// const UpdateUserInput =
// builder.inputType("UpdateUserInput", {
//   description: "Input for updating users",
//   fields: (t) => ({
//     name: t.string({}),
//     email: t.string({}),
//   }),
// });

export const userSortConfigs = {
  id: [{ key: "id" }],
  name: [{ key: "name" }, { key: "id" }],
  email: [{ key: "email" }, { key: "name" }, { key: "id" }],
} satisfies Record<string, CursorSort>;

const UserCursorValueSchema = z.discriminatedUnion("key", [
  z.object({
    sort: z.enum(["a", "d"]).optional(),
    key: z.enum(["name", "email"] as const),
    value: z.string(),
  }),
  z.object({
    sort: z.enum(["a", "d"]).optional(),
    key: z.literal("id"),
    value: z.number(),
  }),
]);
const UserCursorSchema = makeCursorSchema("user", UserCursorValueSchema);

builder.queryFields((t) => ({
  users: t.field({
    type: UserConnection,
    args: {
      id: t.arg.id(),
      ...commonPaginationArgs(t.arg, UserOrderByInput, "name"),
    },
    resolve: async (_parent, args, context, info) => {
      const { orderBy, cursorWhere, take, sort, reverse } = getCursorProperties(
        args,
        userSortConfigs,
        UserCursorSchema,
        typeof args.id === "string"
          ? {
              id: decodeUserID(args.id),
            }
          : undefined,
      );
      // console.log(info);
      const findManyArgs = {
        ...queryFromInfo({
          context: context,
          info,
          // nested path where the selections for this type can be found
          path: ["edges", "node"],
        }),
        where: {
          ...cursorWhere,
        },
        orderBy: orderBy,
        take,
      } as const;
      // console.log(findManyArgs);
      const users = await context.prisma.user.findMany(findManyArgs);
      return new Connection("user", !reverse ? users : users.reverse(), sort);
    },
  }),
}));

builder.mutationFields((t) => ({
  createUser: t.field({
    type: userWithPaginatedPosts,
    args: {
      input: t.arg({
        type: CreateUserInput,
        required: true,
      }),
    },
    resolve: async (_parent, args, context, info) => {
      const user = await context.prisma.user.create({
        ...queryFromInfo({
          context: context,
          info,
          // nested path where the selections for this type can be found
          path: [],
        }),
        data: args.input,
      });
      return user;
    },
  }),
  deleteUser: t.field({
    type: userWithPaginatedPosts,
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (_parent, args, context, info) => {
      const id = decodeUserID(args.id);
      const user = await context.prisma.user.delete({
        ...queryFromInfo({
          context,
          info,
          // nested path where the selections for this type can be found
          path: [],
        }),
        where: {
          id,
        },
      });
      return user;
    },
  }),
}));
