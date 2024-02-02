import { Post } from "@prisma/client";
import { z } from "zod";
import { builder } from "./builder.js";
import { decodeUserID } from "./users.js";
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

export const encodePostID = (id: number) => encodeID({ post: id });
export const decodePostID = (id: string) =>
  decodeAndCheckID(id, z.object({ post: z.number() }).strict()).post;

const prismaPostObjRef = builder.prismaObject("Post", {
  description: "A blog post",
  fields: (t) => ({
    id: t.field({
      type: "ID",
      nullable: false,
      resolve: (parent) => encodePostID(parent.id),
    }),
    title: t.exposeString("title"),
    content: t.exposeString("content", { nullable: true }),
    published: t.exposeBoolean("published"),
    author: t.relation("author"),
  }),
});
// type PaginatedPost =
typeof prismaPostObjRef.$inferType;
export const PostOrderByInput = builder.enumType("PostOrderByInput", {
  description: "Options for sorting Posts",
  values: {
    ID: { value: "id" },
    TITLE: { value: "title" },
  } as const,
});

export const { edge: PostEdge, connection: PostConnection } =
  makePagination<Post>(prismaPostObjRef);

export const CreatePostInput = builder.inputType("CreatePostInput", {
  description: "Input for new posts",
  fields: (t) => ({
    title: t.string({ required: true }),
    content: t.string({ defaultValue: null }),
    published: t.boolean({ required: true, defaultValue: false }),
    authorId: t.string({ required: true }),
  }),
});

// const UpdatePostInput =
// builder.inputType("UpdatePostInput", {
//   description: "Input for new posts",
//   fields: (t) => ({
//     title: t.string(),
//     content: t.string(),
//     published: t.boolean(),
//     authorId: t.string(),
//   }),
// });

export const postSortConfigs = {
  id: [{ key: "id" }],
  title: [{ key: "title" }, { key: "id" }],
} satisfies Record<string, CursorSort>;

const PostCursorValueSchema = z.discriminatedUnion("key", [
  z.object({
    sort: z.enum(["a", "d"]).optional(),
    key: z.literal("title"),
    value: z.string(),
  }),
  z.object({
    sort: z.enum(["a", "d"]).optional(),
    key: z.literal("id"),
    value: z.number(),
  }),
]);
const PostCursorContextSchema = z.object({
  key: z.enum(["authorId"] as const),
  value: z.number(),
});
export const UserPostCursorSchema = makeCursorSchema(
  "userPost",
  PostCursorValueSchema,
  PostCursorContextSchema,
);
export const PostCursorSchema = makeCursorSchema("post", PostCursorValueSchema);

builder.queryFields((t) => ({
  posts: t.field({
    type: PostConnection,
    args: {
      id: t.arg.id({ required: false }),
      ...commonPaginationArgs(t.arg, PostOrderByInput, "title"),
    },
    resolve: async (_parent, args, ctx, _info) => {
      const { orderBy, cursorWhere, take, sort, reverse } = getCursorProperties(
        args,
        postSortConfigs,
        PostCursorSchema,
        {
          id: typeof args.id === "string" ? decodePostID(args.id) : undefined,
        },
      );
      const posts = await ctx.prisma.post.findMany({
        where: {
          ...cursorWhere,
        },
        orderBy,
        take,
      });
      return new Connection("post", !reverse ? posts : posts.reverse(), sort);
    },
  }),
}));

builder.mutationFields((t) => ({
  createPost: t.prismaField({
    type: "Post",
    args: {
      input: t.arg({
        type: CreatePostInput,
        required: true,
      }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const post = await ctx.prisma.post.create({
        ...query,
        data: {
          ...args.input,
          authorId: decodeUserID(args.input.authorId),
        },
      });
      return post;
    },
  }),
  deletePost: t.prismaField({
    type: "Post",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (query, _parent, args, ctx) => {
      const post = await ctx.prisma.post.delete({
        ...query,
        where: {
          id: decodePostID(args.id),
        },
      });
      return post;
    },
  }),
}));
