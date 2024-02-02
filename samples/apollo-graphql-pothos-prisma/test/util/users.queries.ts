import assert from "assert";
import { ApolloServer } from "@apollo/server";
import { BuilderContext } from "../../src/builder.js";
import { graphql } from "../gql/gql.js";
import {
  CreateUserInput,
  CreateUserMutation,
  CreateUserMutationVariables,
  DeleteUserMutation,
  DeleteUserMutationVariables,
  UserOrderByInput,
  UsersSimpleQuery,
  UsersSimpleQueryVariables,
  UsersWithPosts1Query,
  UsersWithPosts1QueryVariables,
  UsersWithoutPosts1Query,
  UsersWithoutPosts1QueryVariables,
} from "../gql/graphql.js";

/** Note that this file is typed by graphql codegen!
 *  If you add or change change any of the queries below, you'll likely see type
 *  errors, this is expected.
 *
 *  To regenreate or generate new types, save the file and run:
 *    npm run codegen
 *
 *  If you want to auto-generate types on save, run the following command:
 *    npm run codegen:watch
 * **/

export async function getUsers({
  testServer: server,
  mockContext: context,
  first,
  last,
  check = true,
}: {
  testServer: ApolloServer<BuilderContext>;
  mockContext: BuilderContext;
  first?: number | null;
  last?: number | null;
  check?: boolean;
}) {
  const result = await server.executeOperation<
    UsersSimpleQuery,
    UsersSimpleQueryVariables
  >(
    {
      query: graphql(/* GraphQL */ `
        query UsersSimple(
          $after: Cursor
          $first: Int
          $last: Int
          $postsAfter: Cursor
          $postsFirst: Int
          $postsLast: Int
        ) {
          users(after: $after, first: $first, last: $last) {
            pageInfo {
              endCursor
              hasNextPage
            }
            edges {
              userCursor: cursor
              node {
                id
                name
                posts(
                  after: $postsAfter
                  first: $postsFirst
                  last: $postsLast
                ) {
                  pageInfo {
                    endCursor
                  }
                  edges {
                    node {
                      id
                      title
                      content
                    }
                  }
                }
              }
            }
          }
        }
      `),
      variables: { first, last },
    },
    {
      contextValue: context,
    },
  );
  assert(result.body.kind === "single");
  if (check) {
    assert(result.body.singleResult.data !== undefined);
    assert(result.body.singleResult.data !== null);
    assert(
      result.body.singleResult.errors === undefined,
      `${JSON.stringify(result.body.singleResult.errors, null, 2)}`,
    );
  }
  return result.body.singleResult;
}

export async function getUsersWithoutPosts({
  atUser = null,
  afterUser = null,
  beforeUser = null,
  testServer: server,
  mockContext: context,
  check = true,
}: {
  atUser?: string | null;
  afterUser?: string | null;
  beforeUser?: string | null;
  postsAfter?: string | null;
  postsFirst?: number | null;
  testServer: ApolloServer<BuilderContext>;
  mockContext: BuilderContext;
  check?: boolean;
}) {
  const result = await server.executeOperation<
    UsersWithoutPosts1Query,
    UsersWithoutPosts1QueryVariables
  >(
    {
      query: graphql(/* GraphQL */ `
        query UsersWithoutPosts1(
          $atUser: ID
          $afterUser: Cursor
          $beforeUser: Cursor
        ) {
          users(id: $atUser, after: $afterUser, before: $beforeUser) {
            pageInfo {
              endCursor
              hasNextPage
            }
            edges {
              userCursor: cursor
              node {
                id
                name
                email
              }
            }
          }
        }
      `),
      variables: { atUser, afterUser, beforeUser },
    },
    {
      contextValue: context,
    },
  );
  assert(result.body.kind === "single");
  if (check) {
    assert(result.body.singleResult.data !== undefined);
    assert(result.body.singleResult.data !== null);
    assert(
      result.body.singleResult.errors === undefined,
      `${JSON.stringify(result.body.singleResult.errors, null, 2)}`,
    );
  }
  return result.body.singleResult;
}

export async function getUserWithPostPage({
  atUser,
  postsAfter,
  postsFirst,
  orderBy = UserOrderByInput.Name,
  testServer: server,
  mockContext: context,
  check = true,
}: {
  atUser?: string | null;
  postsAfter?: string | null;
  postsFirst?: number | null;
  orderBy?: UserOrderByInput;
  testServer: ApolloServer<BuilderContext>;
  mockContext: BuilderContext;
  check?: boolean;
}) {
  const result = await server.executeOperation<
    UsersWithPosts1Query,
    UsersWithPosts1QueryVariables
  >(
    {
      query: graphql(/* GraphQL */ `
        query UsersWithPosts1(
          $atUser: ID
          $postsAfter: Cursor
          $postsFirst: Int
          $orderBy: UserOrderByInput! = NAME
        ) {
          users(id: $atUser, orderBy: $orderBy) {
            pageInfo {
              endCursor
              hasNextPage
            }
            edges {
              userCursor: cursor
              node {
                id
                name
                posts(after: $postsAfter, first: $postsFirst) {
                  pageInfo {
                    endCursor
                  }
                  edges {
                    node {
                      id
                      title
                      content
                    }
                  }
                }
              }
            }
          }
        }
      `),
      variables: { atUser, postsAfter, postsFirst, orderBy },
    },
    {
      contextValue: context,
    },
  );
  if (check) {
    assert(result.body.kind === "single");
    expect(result.body.singleResult.errors).toBeUndefined();
    assert(result.body.singleResult.data !== undefined);
    assert(result.body.singleResult.data !== null);
  }
  return result.body.kind === "single" ? result.body.singleResult : undefined;
}

export async function createUser({
  newUser,
  testServer: server,
  mockContext: context,
  check = true,
}: {
  newUser: CreateUserInput;
  testServer: ApolloServer<BuilderContext>;
  mockContext: BuilderContext;
  check?: boolean;
}) {
  const result = await server.executeOperation<
    CreateUserMutation,
    CreateUserMutationVariables
  >(
    {
      query: graphql(/* GraphQL */ `
        mutation CreateUser($newUser: CreateUserInput!) {
          createUser(input: $newUser) {
            id
          }
        }
      `),
      variables: { newUser },
    },
    {
      contextValue: context,
    },
  );
  if (check) {
    assert(result.body.kind === "single");
    expect(result.body.singleResult.errors).toBeUndefined();
    assert(result.body.singleResult.data !== undefined);
    assert(result.body.singleResult.data !== null);
  }
  return result.body.kind === "single" ? result.body.singleResult : undefined;
}

export async function deleteUser({
  userId,
  testServer: server,
  mockContext: context,
  check = true,
}: {
  userId: string;
  testServer: ApolloServer<BuilderContext>;
  mockContext: BuilderContext;
  check?: boolean;
}) {
  const result = await server.executeOperation<
    DeleteUserMutation,
    DeleteUserMutationVariables
  >(
    {
      query: graphql(/* GraphQL */ `
        mutation DeleteUser($userId: ID!) {
          deleteUser(id: $userId) {
            id
          }
        }
      `),
      variables: { userId },
    },
    {
      contextValue: context,
    },
  );
  if (check) {
    assert(result.body.kind === "single");
    expect(result.body.singleResult.errors).toBeUndefined();
    assert(result.body.singleResult.data !== undefined);
    assert(result.body.singleResult.data !== null);
  }
  return result.body.kind === "single" ? result.body.singleResult : undefined;
}
