import assert from "assert";
import { ApolloServer } from "@apollo/server";
import { BuilderContext } from "../../src/builder.js";
import { graphql } from "../gql/gql.js";
import {
  CreatePostInput,
  CreatePostMutation,
  CreatePostMutationVariables,
  DeletePostMutation,
  DeletePostMutationVariables,
  LoadPostsQuery,
  LoadPostsQueryVariables,
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

export async function getPosts({
  testServer: server,
  mockContext: context,
  after,
  first,
  last,
  id,
  check = true,
  skipTitle = false,
}: {
  testServer: ApolloServer<BuilderContext>;
  mockContext: BuilderContext;
  after?: string | null;
  first?: number | null;
  last?: number | null;
  id?: string | null;
  check?: boolean;
  skipTitle?: boolean;
}) {
  const result = await server.executeOperation<
    LoadPostsQuery,
    LoadPostsQueryVariables
  >(
    {
      query: graphql(/* GraphQL */ `
        query LoadPosts(
          $after: Cursor
          $first: Int
          $last: Int
          $id: ID
          $skipTitle: Boolean = false
        ) {
          posts(
            after: $after
            first: $first
            last: $last
            id: $id
            orderBy: TITLE
          ) {
            pageInfo {
              endCursor
            }
            edges {
              cursor @include(if: $skipTitle)
              node {
                id
                published
                title @skip(if: $skipTitle)
                content
                author {
                  id
                  name
                }
              }
            }
          }
        }
      `),
      variables: { after, first, last, id, skipTitle },
    },
    {
      contextValue: context,
    },
  );
  assert(result.body.kind === "single");
  if (check) {
    assert(result.body.singleResult.data !== undefined);
    assert(result.body.singleResult.data !== null);
    assert(result.body.singleResult.errors === undefined);
  }
  return result.body.singleResult;
}

export async function createPost({
  newPost,
  testServer: server,
  mockContext: context,
  check = true,
}: {
  newPost: CreatePostInput;
  testServer: ApolloServer<BuilderContext>;
  mockContext: BuilderContext;
  check?: boolean;
}) {
  const result = await server.executeOperation<
    CreatePostMutation,
    CreatePostMutationVariables
  >(
    {
      query: graphql(/* GraphQL */ `
        mutation CreatePost($newPost: CreatePostInput!) {
          createPost(input: $newPost) {
            id
            author {
              id
            }
          }
        }
      `),
      variables: { newPost },
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

export async function deletePost({
  postId: postId,
  testServer: server,
  mockContext: context,
  check = true,
}: {
  postId: string;
  testServer: ApolloServer<BuilderContext>;
  mockContext: BuilderContext;
  check?: boolean;
}) {
  const result = await server.executeOperation<
    DeletePostMutation,
    DeletePostMutationVariables
  >(
    {
      query: graphql(/* GraphQL */ `
        mutation DeletePost($postId: ID!) {
          deletePost(id: $postId) {
            id
          }
        }
      `),
      variables: { postId },
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
