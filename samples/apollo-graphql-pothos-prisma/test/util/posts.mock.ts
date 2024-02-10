import assert from "assert";
import { Post, Prisma, User } from "@prisma/client";
import { userFindUniqueOrThrowImpl } from "./users.mock.js";

// Reference: https://www.prisma.io/docs/orm/prisma-client/client-extensions/type-utilities

// Here we make a mock implementation of a few functions of the Prisma PostDelegate
// Due to how Prisma handles return values, like making a Promise with additional properties (!), we have to do some
// acrobatics to make the mock implementation type correctly to ensure we're retuning the right values

// NOTE: This is a very basic implementation, and does not handle all possible cases.
// Specifically, it does not handle the `include` fields of the Prisma query arguments AT ALL, and the `select` fields
// are only honored to *add* relation fields to the returned object, not to *remove* fields from the returned object.

// Damn Fluent API makes this SO much more complicated:
//  https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries#fluent-api

/**
 * Make a `prisma.post.findMany` mock implementation - this function returns a function that is the mock implementation
 *
 * @param posts - Array of Post objects to use as sample data
 * @param users - Array of User objects to use as sample data
 * @param defaultArgs - (optional) Default arguments to use for the query (for example, to limit the results to a
 * certain post)
 * @returns A mock function that takes the query arguments and returns a faked "PrismaPromise" of the result
 */
export function postFindManyImpl(posts: Post[], users: User[]) {
  // This is the actual mock function that will be returned, with the user and post data references "baked in"
  return <A extends Prisma.PostFindManyArgs>(
    args?: Prisma.Exact<A, Prisma.PostFindManyArgs>,
  ): Prisma.Prisma__PostClient<
    Prisma.Result<Prisma.PostDelegate, typeof args, "findMany">
  > => {
    const whereId = args?.where?.id;
    const whereAuthorId = args?.where?.authorId;

    const filteredPosts = posts.filter((post) => {
      if (whereId !== undefined) {
        return whereId === post.id;
      }
      if (whereAuthorId !== undefined) {
        return whereAuthorId === post.authorId;
      }
      return true;
    });

    const promise = (async () => {
      if (args?.select?.author || args?.include?.author) {
        const filteredPostsWithAuthor: Array<Post & { author: User }> = [];
        for (const post of filteredPosts) {
          filteredPostsWithAuthor.push({
            ...post,
            author: await userFindUniqueOrThrowImpl(
              users,
              posts,
            )({ where: { id: post.authorId } }),
          });
        }

        return filteredPostsWithAuthor;
      }

      // console.log(JSON.stringify({ args, actualArgs, filteredPosts }, null, 2));
      return filteredPosts;
    })();

    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      author: <T extends Prisma.UserDefaultArgs = {}>(
        args2?: Prisma.Subset<T, Prisma.UserDefaultArgs>,
      ) => {
        assert(filteredPosts.length == 1);
        return userFindUniqueOrThrowImpl(
          users,
          posts,
        )({ ...args2, where: { id: filteredPosts[0].authorId } }) as never;
      },
    };
  };
} // END postFindManyImpl

/**
 * Make a `prisma.post.findUniqueOrThrow` mock implementation - this function returns a function that is the mock
 * implementation
 *
 * @param posts - Array of Post objects to use as sample data
 * @param users - Array of User objects to use as sample data
 * @param defaultArgs - (optional) Default arguments to use for the query (for example, to limit the results to a
 * certain post)
 * @returns A mock function that takes the query arguments and returns a faked "PrismaPromise" of the result
 */
export function postFindUniqueOrThrowImpl(posts: Post[], users: User[]) {
  // This is the actual mock function that will be returned, with the user and post data references "baked in"
  return <A extends Prisma.PostFindUniqueOrThrowArgs>(
    args?: Prisma.Exact<A, Prisma.PostFindUniqueOrThrowArgs>,
  ): Prisma.Prisma__PostClient<
    Prisma.Result<Prisma.PostDelegate, typeof args, "findFirstOrThrow">
  > => {
    const whereId = args?.where.id;
    assert(whereId !== undefined);

    const foundPost = whereId
      ? posts.find((post) => whereId == post.id)
      : undefined;
    assert(foundPost !== undefined);

    const promise = (async () => {
      const post: Post & { author?: User } = foundPost;
      if (args?.include?.author || args?.select?.author) {
        post.author = await userFindUniqueOrThrowImpl(
          users,
          posts,
        )({
          where: {
            id: post.authorId,
          },
          ...(typeof args.select?.author === "object"
            ? args.select?.author
            : {}),
        });
      }
      return post;
    })();

    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      author: () =>
        Promise.reject(
          "Not implemented: PostFindUniqueOrThrow.author",
        ) as never,
    };
  };
} // END postFindUniqueOrThrowImpl

/**
 * Make a `prisma.post.create` mock implementation - this function returns a function that is the mock implementation
 *
 * @param posts - Array of Post objects to use as sample data
 * @param users - Array of User objects to use as sample data - used for the return value
 * @returns A mock function that takes the query arguments and returns a faked "PrismaPromise" of the result
 */
export function postCreateImpl(posts: Post[], users: User[]) {
  // This is the actual mock function that will be returned, with the user and post data references "baked in"
  return <A extends Prisma.PostCreateArgs>(
    args: Prisma.Exact<A, Prisma.PostCreateArgs>,
  ): Prisma.Prisma__PostClient<
    Prisma.Result<Prisma.PostDelegate, typeof args, "create">
  > => {
    const authorId = args.data.authorId;
    assert(typeof authorId === "number");
    const authorRaw = users.find((user) => user.id === authorId);
    assert(authorRaw !== undefined);

    const promise = (async () => {
      const newPost = {
        id: posts.length + 1,
        title: args.data.title ?? false,
        content: args.data.content ?? null,
        published: args.data.published ?? false,
        authorId,
      } satisfies Post;
      posts.push(newPost);

      return newPost as Prisma.Result<
        Prisma.PostDelegate,
        typeof args,
        "create"
      >;
    })();

    // add toStringTag and author
    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      author: () =>
        Promise.reject("Not implemented: PostCreate.author") as never,
    };
  };
} // END postCreateImpl

/**
 * Make a `prisma.post.delete` mock implementation - this function returns a function that is the mock implementation
 *
 * @param posts - Array of Post objects to use as sample data
 * @param users - Array of User objects to use as sample data - used for the return value
 * @returns A mock function that takes the query arguments and returns a faked "PrismaPromise" of the result
 */
export function postDeleteImpl(posts: Post[], users: User[]) {
  // This is the actual mock function that will be returned, with the user and post data references "baked in"
  return <A extends Prisma.PostDeleteArgs>(
    args?: Prisma.Exact<A, Prisma.PostDeleteArgs>,
  ): Prisma.Prisma__PostClient<
    Prisma.Result<Prisma.PostDelegate, typeof args, "delete">
  > => {
    const postId = args?.where?.id;
    assert(postId !== undefined);

    const postIndex = posts.findIndex((post) => post.id === postId);
    const oldPost = posts.splice(postIndex, 1)[0];

    const promise = Promise.resolve(oldPost);
    return {
      [Symbol.toStringTag]: "PrismaPromise" as const,
      then: promise.then.bind(promise),
      catch: promise.catch.bind(promise),
      finally: promise.finally.bind(promise),
      author: () =>
        Promise.reject("Not implemented: PostDelete.author") as never,
    };
  };
} // END postDeleteImpl
