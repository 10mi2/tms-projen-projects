/* eslint-disable import/no-extraneous-dependencies */
import assert from "assert";
import { ApolloServer } from "@apollo/server";
import { Post, PrismaClient } from "@prisma/client";
import { mockDeep } from "jest-mock-extended";
import { CreatePostInput } from "./gql/graphql.js";
import {
  postCreateImpl,
  postDeleteImpl,
  postFindManyImpl,
  postFindUniqueOrThrowImpl,
} from "./util/posts.mock.js";
import { createPost, deletePost, getPosts } from "./util/posts.queries.js";
import { postsSimple, usersSimple } from "./util/test-data.js";
import {
  userFindManyImpl,
  userFindUniqueOrThrowImpl,
} from "./util/users.mock.js";
import { BuilderContext, builder } from "../src/builder.js";

// Refs:
// https://www.apollographql.com/docs/apollo-server/testing/testing/
// https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing

builder.queryType({});
builder.mutationType({});

// We have to import *something from users and posts
// to make sure the schema is built correctly
// if we import nothing specific, import generically
// import "../src/posts.js";
import { decodePostID, encodePostID } from "../src/posts.js";
// import "../src/users.js";
import { encodeUserID } from "../src/users.js";

const schema = builder.toSchema();

let testServer: ApolloServer<BuilderContext> | undefined;
let mockContext: BuilderContext | undefined;

beforeEach(() => {
  testServer = new ApolloServer<BuilderContext>({
    schema,
  });

  const mockPrisma = mockDeep<PrismaClient>();
  mockContext = {
    prisma: mockPrisma,
  };

  const tempUsersSimple = [...usersSimple];
  const tempPostsSimple = [...postsSimple];

  mockPrisma.user.findMany.mockImplementation(
    userFindManyImpl(tempUsersSimple),
  );
  mockPrisma.user.findUniqueOrThrow.mockImplementation(
    userFindUniqueOrThrowImpl(tempUsersSimple, tempPostsSimple),
  );

  // called by the paginated users query
  mockPrisma.post.findMany.mockImplementation(
    postFindManyImpl(tempPostsSimple, tempUsersSimple),
  );
  mockPrisma.post.create.mockImplementation(
    postCreateImpl(tempPostsSimple, tempUsersSimple),
  );
  mockPrisma.post.findUniqueOrThrow.mockImplementation(
    postFindUniqueOrThrowImpl(tempPostsSimple, tempUsersSimple),
  );
  mockPrisma.post.delete.mockImplementation(
    postDeleteImpl(tempPostsSimple, tempUsersSimple),
  );
});

/**===============================================================*
 * Tests Begin Here
 **===============================================================*/

it("simple posts query", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  await getPosts({ testServer, mockContext });

  expect(mockPrisma.post.findMany).toHaveBeenNthCalledWith(1, {
    orderBy: [{ title: "asc" }, { id: "asc" }],
    take: 50,
    where: {},
  });
});

it("post creation happy path", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  const newPostUserNumber = 1;
  const newPostUserID = encodeUserID(newPostUserNumber);
  const newPost = {
    title: "New Post Title",
    content: "New Post Content",
    published: false,
    authorId: newPostUserID,
  } satisfies CreatePostInput;
  const newPostInternal = {
    ...newPost,
    authorId: newPostUserNumber,
  } satisfies Omit<Post, "id">;

  const result = await createPost({
    testServer,
    mockContext,
    newPost,
    check: true,
  });

  expect(mockPrisma.post.create).toHaveBeenLastCalledWith({
    data: newPostInternal,
    include: { author: true },
  });

  assert(result?.errors === undefined);
  assert(result?.data !== undefined);
  assert(result?.data !== null);
  assert(result?.data.createPost !== undefined);
  assert(result?.data.createPost !== null);
  assert(decodePostID(result?.data.createPost.id));

  const newPostNode = result?.data.createPost;
  expect(newPostNode).toMatchObject<typeof newPostNode>({
    id: expect.any(String),
    author: { id: newPostUserID },
  });
});

it("post delete happy path", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  const postIdNumber = postsSimple[0].id;
  const deletePostID = encodePostID(postIdNumber);

  const deleteResult = await deletePost({
    testServer,
    mockContext,
    postId: deletePostID,
  });
  const deletedPost = deleteResult?.data?.deletePost;
  assert(deletedPost?.id === deletePostID);

  console.log(process.env.NODE_OPTIONS);

  expect(mockPrisma.post.delete).toHaveBeenLastCalledWith({
    where: { id: postIdNumber },
  });
});
