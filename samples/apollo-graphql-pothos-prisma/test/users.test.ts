/* eslint-disable import/no-extraneous-dependencies */
import assert from "assert";
import { ApolloServer } from "@apollo/server";
import { PrismaClient } from "@prisma/client";
import { mockDeep } from "jest-mock-extended";
import { postFindManyImpl } from "./util/posts.mock.js";
import { postsSimple, usersSimple } from "./util/test-data.js";
import {
  userCreateImpl,
  userDeleteImpl,
  userFindManyImpl,
} from "./util/users.mock.js";
import {
  createUser,
  deleteUser,
  getUserWithPostPage,
  getUsers,
  getUsersWithoutPosts,
} from "./util/users.queries.js";
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
import { encodePostID } from "../src/posts.js";
// import "../src/users.js";
import { decodeUserID, encodeUserID } from "../src/users.js";

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
  mockPrisma.user.create.mockImplementation(userCreateImpl(tempUsersSimple));
  mockPrisma.user.delete.mockImplementation(
    userDeleteImpl(tempUsersSimple, tempPostsSimple),
  );

  // called by the paginated users query
  mockPrisma.post.findMany.mockImplementation(
    postFindManyImpl(tempPostsSimple, tempUsersSimple),
  );
});

/**===============================================================*
 * Tests Begin Here
 **===============================================================*/

it("simple users query", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  await getUsers({ testServer, mockContext });

  expect(mockPrisma.user.findMany).toHaveBeenNthCalledWith(1, {
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 50,
    where: {},
  });
  expect(mockPrisma.post.findMany).toHaveBeenNthCalledWith(1, {
    orderBy: [{ title: "asc" }, { id: "asc" }],
    take: 50,
    where: { authorId: 1 },
  });
  expect(mockPrisma.post.findMany).toHaveBeenNthCalledWith(2, {
    orderBy: [{ title: "asc" }, { id: "asc" }],
    take: 50,
    where: { authorId: 2 },
  });
});

it("users query without posts", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  const firstPage = await getUsersWithoutPosts({ testServer, mockContext });
  expect(mockPrisma.user.findMany).toHaveBeenNthCalledWith(1, {
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 50,
    where: {},
  });
  expect(mockPrisma.post.findMany).toHaveBeenCalledTimes(0);

  assert(firstPage.data !== undefined && firstPage.data !== null);
  assert(firstPage.data.users.edges.length >= 1);
});

it("users query with posts paginated", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  const firstPage = await getUserWithPostPage({
    testServer,
    mockContext,
    postsFirst: 2,
  });
  expect(mockPrisma.user.findMany).toHaveBeenNthCalledWith(1, {
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 50,
    where: {},
  });
  expect(mockPrisma.post.findMany).toHaveBeenCalledTimes(2);
  const firstPageUsers = firstPage?.data?.users;

  assert(firstPageUsers !== undefined);
  expect(firstPageUsers?.edges.length).toBe(2);
  expect(firstPageUsers?.edges[0]?.node.posts.edges.length).toBe(1);
  expect(firstPageUsers?.edges[1]?.node.posts.edges.length).toBe(3);

  const secondUser = firstPageUsers.edges[1];
  const secondUserCursor = secondUser.userCursor;
  assert(typeof secondUserCursor === "string");
  assert(secondUserCursor !== "" && secondUserCursor !== null);
  assert(typeof secondUser.node.posts.pageInfo.endCursor === "string");

  await getUserWithPostPage({
    testServer,
    mockContext,
    atUser: secondUser.node.id,
    postsAfter: secondUser.node.posts.pageInfo.endCursor,
  });

  expect(mockPrisma.user.findMany).toHaveBeenLastCalledWith({
    orderBy: [{ name: "asc" }, { id: "asc" }],
    take: 50,
    where: {
      id: 2,
    },
  });

  const mixedCursorResponse1 = await getUserWithPostPage({
    testServer,
    mockContext,
    postsAfter: secondUserCursor,
    check: false,
  });
  assert(mixedCursorResponse1?.errors !== undefined);
  expect(mixedCursorResponse1?.errors?.length).toBeGreaterThan(0);
  expect(mixedCursorResponse1?.errors[0].message).toMatch(
    "Invalid cursor type:",
  );
});

it("users query with bad atUser value (string)", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  const result = await getUserWithPostPage({
    testServer,
    mockContext,
    atUser: '{"wrong": "value"}' as any,
    check: false,
  });

  assert(result?.errors !== undefined);
  // console.log(result.errors);
});

it("users query with bad orderBy", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  const result = await getUserWithPostPage({
    testServer,
    mockContext,
    orderBy: "nothing userful" as any,
    check: false,
  });

  assert(result?.errors !== undefined);
  // console.log(result.errors);
});

it("users query with first and last (bad)", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  const result = await getUsers({
    testServer,
    mockContext,
    first: 3,
    last: 3,
    check: false,
  });

  assert(result?.errors !== undefined);
  // console.log(result.errors);
});

it("users query with before and after (bad)", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  const result = await getUsersWithoutPosts({
    testServer,
    mockContext,
    afterUser: "after cursor",
    beforeUser: "before cursor",
    check: false,
  });

  assert(result?.errors !== undefined);
  expect(result?.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message: "Cannot use both before and after",
      }),
    ]),
  );
});

it("users creation happy path", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  const newUser = {
    name: "New User",
    email: "blah@test.com",
  };
  const result = await createUser({
    testServer,
    mockContext,
    newUser,
    check: false,
  });

  expect(mockPrisma.user.create).toHaveBeenLastCalledWith({
    data: newUser,
  });

  assert(result?.errors === undefined);
  assert(result?.data !== undefined);
  assert(result?.data !== null);
  assert(result?.data.createUser !== undefined);
  assert(result?.data.createUser !== null);
  assert(decodeUserID(result?.data.createUser.id));
});

it("user delete happy path", async () => {
  assert(testServer !== undefined);
  assert(mockContext !== undefined);
  const mockPrisma = mockContext.prisma;

  const userIdNumber = usersSimple[0].id;
  const deleteUserID = encodeUserID(userIdNumber);

  const deleteResult = await deleteUser({
    testServer,
    mockContext,
    userId: deleteUserID,
  });
  const deletedUser = deleteResult?.data?.deleteUser;
  assert(deletedUser?.id === deleteUserID);

  expect(mockPrisma.user.delete).toHaveBeenLastCalledWith({
    where: { id: userIdNumber },
  });
});
