import { queryFromInfo } from "@pothos/plugin-prisma";
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

// Handling of Post IDs
export const encodePostID = (id: number) => encodeID({ post: id });
export const decodePostID = (id: string) =>
  decodeAndCheckID(id, z.object({ post: z.number() }).strict()).post;

// Post Object
const prismaPostObjRef = builder.prismaObject("Post", {
  description: "A blog post",
  // specify minimum select fields for the Prisma object
  // other fields that are requested will be added to the select
  // See: https://pothos-graphql.dev/docs/plugins/prisma#select-mode-for-types
  // Note that this will be used by *other* resolvers to determine what fields to select as well
  select: {
    id: true,
    // we must include any fields we *might* sort on, even if the client doesn't ask for them
    title: true,
  },
  fields: (t) => ({
    id: t.field({
      type: "ID",
      nullable: false,
      resolve: (post) => encodePostID(post.id),
    }),
    title: t.exposeString("title"),
    content: t.exposeString("content", { nullable: true }),
    published: t.exposeBoolean("published"),
    author: t.relation("author"),
  }),
});

// Input enum for controlling post ordering
export const PostOrderByInput = builder.enumType("PostOrderByInput", {
  description: "Options for sorting Posts",
  values: {
    ID: { value: "id" },
    TITLE: { value: "title" },
  } as const,
});

// Create Pagination types for Posts
export const { edge: PostEdge, connection: PostConnection } =
  makePagination(prismaPostObjRef);

// Input for creating new posts
export const CreatePostInput = builder.inputType("CreatePostInput", {
  description: "Input for new posts",
  fields: (t) => ({
    title: t.string({ required: true }),
    content: t.string({ defaultValue: null }),
    published: t.boolean({ required: true, defaultValue: false }),
    authorId: t.string({ required: true }),
  }),
});

// Input for updating posts (not used currently)
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

// Sorting configurations for posts
export const postSortConfigs = {
  id: [{ key: "id" }],
  title: [{ key: "title" }, { key: "id" }],
} satisfies Record<string, CursorSort>;

// Zod schema to validate cursor values
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
// Zod schema to validate cursor context
const PostCursorContextSchema = z.object({
  key: z.enum(["authorId"] as const),
  value: z.number(),
});

// Create cursor schema for Posts
export const PostCursorSchema = makeCursorSchema("post", PostCursorValueSchema);

// Create cursor schemas for Posts in a Users list
export const UserPostCursorSchema = makeCursorSchema(
  "userPost",
  PostCursorValueSchema,
  PostCursorContextSchema,
);

// Query and Mutation fields for Posts
builder.queryFields((t) => ({
  posts: t.field({
    type: PostConnection,
    description: "All Posts, paginated",
    args: {
      // Optional ID argument to get a specifc Post
      id: t.arg.id({ required: false }),

      // Pagination arguments
      ...commonPaginationArgs(t.arg, PostOrderByInput, "title"),
    },
    resolve: async (_parent, args, context, info) => {
      // Get cursor properties from arguments
      const { orderBy, cursorWhere, take, sort, reverse } = getCursorProperties(
        args,
        postSortConfigs,

        // Zod schema to validate the cursor against
        PostCursorSchema,
        // Context for cursor, will be used in making the where clause from the cursor
        typeof args.id === "string"
          ? {
              id: decodePostID(args.id),
            }
          : undefined,
      );

      // Get the posts, using the cursor properties
      // Note if we are reversing the order, we will do that below, not here
      const posts = await context.prisma.post.findMany({
        ...queryFromInfo({
          context,
          info,
          // nested path where the selections for this type can be found
          path: ["edges", "node"],
        }),
        where: {
          ...cursorWhere,
        },
        orderBy,
        take,
      });

      // Return the Posts as a Connection
      return new Connection("post", !reverse ? posts : posts.reverse(), sort);
    },
  }),
}));

builder.mutationFields((t) => ({
  createPost: t.prismaField({
    type: "Post",
    description: "Create a new Post",
    args: {
      input: t.arg({
        type: CreatePostInput,
        required: true,
      }),
    },
    resolve: async (query, _parent, args, context) => {
      // query is generated by Pothos and containes the Prisma query values (where, etc) for the response shape
      const post = await context.prisma.post.create({
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
    description: "Delete a Post",
    args: {
      id: t.arg.id({ required: true }),
    },
    resolve: async (query, _parent, args, context) => {
      // query is generated by Pothos and containes the Prisma query values (where, etc) for the response shape
      const post = await context.prisma.post.delete({
        ...query,
        where: {
          id: decodePostID(args.id),
        },
      });
      return post;
    },
  }),
}));
